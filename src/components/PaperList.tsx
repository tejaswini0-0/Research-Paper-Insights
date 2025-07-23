import { useState, useEffect } from "react";
import { PaperCard } from "./PaperCard";

interface Paper {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  uploadedAt: number;
  status: 'completed' | 'processing' | 'error';
}

export function PaperList() {
  const [papers, setPapers] = useState<Paper[]>([]);

  useEffect(() => {
    const storedPapers = JSON.parse(localStorage.getItem('papers') || '[]');
    setPapers(storedPapers);
  }, []);

  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No papers yet</h3>
        <p className="text-gray-600">Upload your first research paper to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Papers</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {papers.map((paper, index) => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
