import { useState, useEffect } from "react";
import { PaperCard } from "./PaperCard";

interface Paper {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  uploadedAt: number;
  status: "completed" | "processing" | "error" | "uploaded";
  filePath?: string;
}

export function PaperHistory() {
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadLocalPapers = () => {
      const storedPapers = JSON.parse(localStorage.getItem("papers") || "[]");
      setLocalPapers(storedPapers);
    };

    loadLocalPapers();

    const handleStorageChange = () => loadLocalPapers();
    const handlePaperUpdate = () => loadLocalPapers();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("paperUpdated", handlePaperUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("paperUpdated", handlePaperUpdate);
    };
  }, []);

  const filteredPapers = localPapers.filter(
    (paper) =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearAllPapers = () => {
    localStorage.removeItem("papers");
    setLocalPapers([]);
  };
  const allPapers = filteredPapers.sort((a, b) => b.uploadedAt - a.uploadedAt);
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Paper History</h2>
          <p className="text-gray-400">
            {allPapers.length} paper{allPapers.length !== 1 ? 's' : ''} processed • Interactive AI chat available
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 pl-10 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={clearAllPapers}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors backdrop-blur-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No matching papers</h3>
          <p className="text-gray-400">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPapers.map((paper, index) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
