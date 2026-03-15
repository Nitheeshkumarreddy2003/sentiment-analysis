import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { CommentInput } from './components/CommentInput';
import { CommentList } from './components/CommentList';
import { LandingPage } from './components/LandingPage';
import { Comment, DashboardStats } from './types';
import { Activity, ShieldCheck, Database as DbIcon, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);

  const fetchData = async (retries = 3) => {
    try {
      const [commentsRes, statsRes] = await Promise.all([
        fetch('/api/comments'),
        fetch('/api/stats')
      ]);
      
      if (!commentsRes.ok || !statsRes.ok) {
        throw new Error(`Server responded with ${commentsRes.status} / ${statsRes.status}`);
      }

      const commentsData = await commentsRes.json();
      const statsData = await statsRes.json();
      setComments(commentsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      if (retries > 0) {
        console.log(`Retrying fetch... (${retries} attempts left)`);
        setTimeout(() => fetchData(retries - 1), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-emerald-500 animate-pulse" size={48} />
          <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing Surveillance Framework...</div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!showDashboard ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <LandingPage onEnter={() => setShowDashboard(true)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30 relative overflow-hidden"
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          {/* Header */}
          <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowDashboard(false)}>
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-lg font-mono font-bold text-white tracking-tight uppercase">AI-Enhanced Real-Time Feedback Analytics Dashboard</h1>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Real-Time Analysis: Positive • Negative • Neutral • Sarcasm
                  </div>
                </div>
              </div>

              {/* Live Ticker */}
              <div className="hidden lg:flex flex-1 mx-12 bg-zinc-900/30 border border-zinc-800/50 rounded-full h-8 items-center px-4 overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
                <motion.div 
                  animate={{ x: [0, -1000] }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-8 whitespace-nowrap text-[9px] font-mono text-zinc-500 uppercase tracking-widest"
                >
                  {comments.length > 0 ? comments.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={c.sentiment === 'positive' ? 'text-emerald-500' : c.sentiment === 'negative' ? 'text-rose-500' : 'text-zinc-400'}>
                        [{c.sentiment}]
                      </span>
                      <span>{c.topic}:</span>
                      <span className="text-zinc-300">{c.text.substring(0, 40)}...</span>
                      <span className="text-zinc-600">|</span>
                    </div>
                  )) : (
                    <span>Awaiting incoming feedback streams...</span>
                  )}
                </motion.div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full">
                    <DbIcon size={12} className="text-emerald-500" /> SQLite: Connected
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full">
                    <Activity size={12} className="text-emerald-500" /> Gemini 3 Flash: Online
                  </div>
                </div>
                <button 
                  onClick={fetchData}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
                >
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard stats={stats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <CommentInput onSubmitted={fetchData} />
                  
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 italic">System Status</h3>
                    <div className="space-y-4 text-[11px] font-mono">
                      <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span className="text-zinc-500">Model</span>
                        <span className="text-emerald-500">Gemini 3 Flash</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span className="text-zinc-500">Latency</span>
                        <span className="text-zinc-300">~1.2s</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span className="text-zinc-500">XAI Engine</span>
                        <span className="text-emerald-500">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Database</span>
                        <span className="text-zinc-300">sentix.db</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <CommentList comments={comments} onDelete={fetchData} />
                </div>
              </div>
            </motion.div>
          </main>

          <footer className="border-t border-zinc-800 py-8 mt-12 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                © 2026 Sentix Framework • MCA Major Project PR105
              </div>
              <div className="flex gap-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                <a href="#" className="hover:text-emerald-500 transition-colors">Documentation</a>
                <a href="#" className="hover:text-emerald-500 transition-colors">API Reference</a>
                <a href="#" className="hover:text-emerald-500 transition-colors">Ethical AI Policy</a>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
