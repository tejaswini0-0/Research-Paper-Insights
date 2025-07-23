import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

export function PaperUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setTitle(file.name.replace(".pdf", ""));
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      setUploading(true);
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Save to localStorage
      const papers = JSON.parse(localStorage.getItem("papers") || "[]");
      const newPaper = {
        id: response.data.paperId,
        title: title,
        fileName: selectedFile.name,
        summary: "",
        uploadedAt: Date.now(),
        status: "uploaded",
      };
      localStorage.setItem("papers", JSON.stringify([newPaper, ...papers]));

      // Trigger update
      window.dispatchEvent(new Event("paperUpdated"));
      toast.success("Paper uploaded successfully!");
      setSelectedFile(null);
      setTitle("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload paper.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-800/40 p-6 rounded-2xl shadow-lg border border-gray-700/50 space-y-6">
      <h2 className="text-2xl font-bold text-white">Upload a Research Paper</h2>
      <p className="text-gray-400 text-sm">Drag and drop your PDF or select from your device</p>

      <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-900/30">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {selectedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4h10v12m-5 4l-5-4h10l-5 4z" />
            </svg>
            <p className="text-white text-sm">{selectedFile.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4h10v12m-5 4l-5-4h10l-5 4z" />
            </svg>
            <p>Click or drag to upload PDF</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter paper title"
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="ml-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
