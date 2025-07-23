import { useState } from "react";
import { PaperChat } from "./PaperChat";

interface Paper {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  uploadedAt: number;
  status: 'completed' | 'processing' | 'error' | 'uploaded';
  fileId?: string;
}

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export function PaperCard({ paper, index }: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case "processing":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
        );
      case "error":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getGradientBorder = (index: number) => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-cyan-500 to-blue-500",
      "from-green-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-pink-500 to-rose-500"
    ];
    return gradients[index % gradients.length];
  };

  if (showChat) {
    return (
      <div className="col-span-full">
        <PaperChat 
          paper={paper} 
          onClose={() => setShowChat(false)}
        />
      </div>
    );
  }

  return (
    <div 
      className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
      }}
    >
      {/* Gradient border effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getGradientBorder(index)} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-white mb-2 line-clamp-2 text-lg">
              {paper.title}
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              {new Date(paper.uploadedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(paper.status)}`}>
            {getStatusIcon(paper.status)}
            <span className="ml-1.5 capitalize">{paper.status}</span>
          </div>
        </div>

        {paper.summary && (
          <div className="mb-4">
            <div className={`text-sm text-gray-300 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {paper.summary}
            </div>
            {paper.summary.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-3 transition-colors flex items-center"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Read more</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <span className="text-xs text-gray-500 truncate flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {paper.fileName}
          </span>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowChat(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
            <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
