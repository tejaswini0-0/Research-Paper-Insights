export function Hero() {
  return (
    <div className="text-center py-16">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 rounded-3xl mb-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Paper Chat
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload research papers and have interactive conversations with AI. Ask questions, 
            get insights, and explore complex research through intelligent dialogue.
          </p>
          
          <div className="flex flex-wrap gap-6 justify-center items-center">
            <div className="flex items-center space-x-3 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Interactive AI Chat</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Smart Q&A System</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Real-time Responses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
