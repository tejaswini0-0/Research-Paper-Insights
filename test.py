import requests

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json"
}
data = {
    "model": "llama3-70b-8192",  # or llama3-8b-8192
    "messages": [
        {"role": "user", "content": "Hello!"},
    ]
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
