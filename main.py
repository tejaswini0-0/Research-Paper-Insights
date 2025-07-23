from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import fitz
from nltk.tokenize import sent_tokenize
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import nltk
import uuid
import json
import time
from openai import OpenAI
from config import GROQ_API_KEY

nltk.download('punkt')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

PAPER_STORE_FILE = "papers.json"
CHAT_HISTORY_FILE = "chat_history.json"

client = OpenAI(
    api_key= GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

if os.path.exists(PAPER_STORE_FILE):
    with open(PAPER_STORE_FILE, "r") as f:
        stored_data = json.load(f)
        if isinstance(stored_data, list):
            new_data = {}
            for item in stored_data:
                paper_id = item.get("paperId") or str(uuid.uuid4())
                item["paperId"] = paper_id
                new_data[paper_id] = item
            stored_data = new_data
            with open(PAPER_STORE_FILE, "w") as fw:
                json.dump(stored_data, fw)
else:
    stored_data = {}

papers = {}

for paper_id, paper_data in stored_data.items():
    filename = paper_data["filename"]
    chunks = paper_data["chunks"]
    embeddings = np.array(paper_data["embeddings"])
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    papers[paper_id] = {
        "filename": filename,
        "chunks": chunks,
        "index": index,
        "model": SentenceTransformer('all-MiniLM-L6-v2')
    }

def save_chat_history(paper_id, question, answer):
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'r') as f:
            history = json.load(f)
    else:
        history = {}

    timestamp = int(time.time() * 1000)

    if paper_id not in history:
        history[paper_id] = []

    history[paper_id].extend([
        {
            "paperId": paper_id,
            "role": "user",
            "content": question,
            "timestamp": timestamp
        },
        {
            "paperId": paper_id,
            "role": "assistant",
            "content": answer,
            "timestamp": timestamp + 1
        }
    ])

    with open(CHAT_HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "pdf" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["pdf"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    print(f"Uploading and processing: {filename}")
    paper_id = str(uuid.uuid4())

    try:
        chunks, embeddings = process_pdf_for_chat(save_path)
        
        embeddings_array = np.array(embeddings)
        index = build_faiss_index(embeddings_array)
        papers[paper_id] = {
            "filename": filename,
            "chunks": chunks,
            "index": index,
            "model": SentenceTransformer('all-MiniLM-L6-v2')
        }
        stored_data[paper_id] = {
            "paperId": paper_id,
            "filename": filename,
            "chunks": chunks,
            "embeddings": embeddings_array.tolist()
        }
        
        with open(PAPER_STORE_FILE, "w") as f:
            json.dump(stored_data, f)
        summary_prompt = (
            "Please provide a plain text summary of this research paper using the following structure.\n"
            "Do not use any special characters, markdown, or formatting symbols.\n"
            "Simply use numbers and plain text:\n\n"
            "1. Title\n2. Authors\n3. Year\n4. Objectives\n5. Methodology\n"
            "6. Advantages\n7. Disadvantages\n8. Conclusion\n\n"
            "Present each section with its number and title followed by a period and a space, then the content."
        )
        summary = query_groq(summary_prompt, "\n".join(chunks[:15]))
        summary = summary.replace('*', '').replace('_', '').replace('#', '').replace('`', '')
        save_chat_history(paper_id, "Summary of this paper", summary)

        print(f"Paper {filename} stored with ID: {paper_id}")
        return jsonify({
            "message": "Upload successful",
            "filename": filename,
            "paperId": paper_id
        }), 200
    except Exception as e:
        print("Error processing PDF:", str(e))
        return jsonify({"error": "Failed to process paper"}), 500

@app.route("/ask", methods=["POST"])
def ask_question():
    data = request.get_json()
    paper_id = data.get("paperId")
    question = data.get("question")

    print(f"Received question: {question}")
    print(f"Looking for paper ID: {paper_id}")

    if not paper_id or not question:
        return jsonify({"error": "Missing paperId or question"}), 400
    if paper_id not in papers:
        print("Paper not found in memory")
        return jsonify({"error": "Paper not found"}), 404

    paper = papers[paper_id]
    model = paper["model"]
    index = paper["index"]
    chunks = paper["chunks"]

    try:
        question_embedding = model.encode([question])
        D, I = index.search(np.array(question_embedding), k=3)

        print("Top indices:", I)
        top_chunks = [chunks[i] for i in I[0] if i < len(chunks)]
        for i, chunk in enumerate(top_chunks):
            print(f"Chunk {i+1}: {chunk[:100]}...")

        context = "\n\n".join(top_chunks)
        answer = query_groq(question, context)

        save_chat_history(paper_id, question, answer)

        print("Answer:", answer)
        return jsonify({"answer": answer})
    except Exception as e:
        print("Error during /ask:", e)
        return jsonify({"answer": "Sorry, I couldn't find an answer."}), 500

@app.route("/chat_history/<paper_id>", methods=["GET"])
def get_chat_history(paper_id):
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'r') as f:
            history = json.load(f)
            return jsonify(history.get(paper_id, []))
    return jsonify([])

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    return "\n".join([page.get_text() for page in doc])

def chunk_text(text, chunk_size=1000):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < chunk_size:
            current_chunk += sentence + " "
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def get_embeddings(chunks, model):
    return model.encode(chunks)

def build_faiss_index(embeddings):
    if not isinstance(embeddings, np.ndarray):
        embeddings = np.array(embeddings)
    
    if len(embeddings.shape) != 2:
        raise ValueError(f"Embeddings must be 2D array, got shape {embeddings.shape}")
    
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    return index

def query_groq(question, context):
    prompt = f"""You are an academic assistant. Use this context to answer the question clearly:

Context:
{context}

Question: {question}

Note: Please provide your response in plain text without any markdown formatting or special characters.
"""
    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful academic assistant. Format your responses in plain text without markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )
        answer = response.choices[0].message.content.strip()
        answer = answer.replace('*', '')
        answer = answer.replace('_', '')
        answer = answer.replace('#', '')
        return answer
    except Exception as e:
        print("Groq API error:", e)
        return "Sorry, I couldn't get a response from Groq."

def process_pdf_for_chat(pdf_path):
    try:
        print("Extracting text from PDF...")
        text = extract_text_from_pdf(pdf_path)
        
        print("Chunking text...")
        chunks = chunk_text(text)
        
        print("Loading model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        print("Getting embeddings...")
        embeddings = get_embeddings(chunks, model)
        
        print("Process complete.")
        return chunks, embeddings
    except Exception as e:
        print(f"Error in process_pdf_for_chat: {str(e)}")
        raise

if __name__ == "__main__":
    app.run(debug=False)