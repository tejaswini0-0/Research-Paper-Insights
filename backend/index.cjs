const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const DATA_FILE = path.join(__dirname, "papers.json");
let papers = loadPapers();

function loadPapers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function savePapers() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2));
}

app.post("/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).send("No PDF uploaded");

  const { originalname, filename, path: filepath } = req.file;

  const paper = {
    id: Date.now().toString(),
    title: originalname.replace(".pdf", ""),
    fileName: filename,
    filePath: filepath,
    summary: null,
    status: "uploaded",
    uploadedAt: Date.now(),
  };

  papers.push(paper);
  savePapers();

  res.json({ message: "PDF uploaded", paper });
});

app.post("/update-summary", (req, res) => {
  const { paperId, summary, status } = req.body;

  const paper = papers.find((p) => p.id === paperId);
  if (!paper) return res.status(404).send("Paper not found");

  paper.summary = summary;
  paper.status = status || "completed";

  savePapers();

  res.json({ message: "Summary updated", paper });
});

app.get("/papers", (req, res) => {
  const allPapers = papers.map((p) => ({
    ...p,
    fileUrl: `http://localhost:${PORT}/${p.fileName}`,
  }));

  res.json(allPapers);
});

app.post("/ask", async (req, res) => {
  const { paperId, question } = req.body;
  const paper = papers.find((p) => p.id === paperId);

  if (!paper) return res.status(404).send("Paper not found");

  try {
    const flaskRes = await fetch("http://localhost:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, pdfPath: paper.filePath }),
    });

    const data = await flaskRes.json();
    res.json({ answer: data.answer });
  } catch (err) {
    console.error("Flask Error:", err);
    res.status(500).send("AI processing failed.");
  }
});

app.use(express.static("uploads"));

app.listen(PORT, () => {
  console.log(`Node.js backend running at http://localhost:${PORT}`);
});
