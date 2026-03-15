import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Activity, Globe, Zap, Database, Lock } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <span className="font-mono font-bold tracking-tighter text-xl uppercase">Sentix</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          <a href="#" className="hover:text-emerald-400 transition-colors">Framework</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Intelligence</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Nodes</a>
          <button 
            onClick={onEnter}
            className="px-4 py-2 border border-emerald-500/30 text-emerald-500 rounded hover:bg-emerald-500/10 transition-all"
          >
            Access Terminal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-8">
            <Activity size={12} className="animate-pulse" />
            System Status: Operational
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-[0.9]">
            AI-ENHANCED <br />
            <span className="text-emerald-500 italic font-serif font-light">Real-Time Analytics</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            An intelligent platform that analyzes service feedback in real-time. 
            Processing multilingual comments and classifying sentiment into 
            <span className="text-emerald-400"> Positive, Negative, Neutral, and Sarcasm</span> with explainable AI insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onEnter}
              className="group relative px-8 py-4 bg-emerald-600 text-white font-mono uppercase tracking-widest text-sm rounded hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/20"
            >
              Initialize Analysis
              <div className="absolute inset-0 rounded border border-white/20 group-hover:scale-105 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-zinc-900 text-zinc-400 font-mono uppercase tracking-widest text-sm rounded border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all">
              View Documentation
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 w-full">
          {[
            { icon: Globe, title: "Global Reach", desc: "Multi-lingual processing across 50+ languages with native-level nuance." },
            { icon: Zap, title: "Real-time XAI", desc: "Explainable AI providing confidence scores and toxicity metrics instantly." },
            { icon: Database, title: "Secure Storage", desc: "Encrypted SQLite persistence for all feedback records and analyst notes." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl text-left hover:border-emerald-500/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="relative z-10 py-12 px-6 border-t border-zinc-900 mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Node Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs font-mono text-zinc-400">Primary Cluster: Online</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Encryption</span>
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-emerald-500" />
                <span className="text-xs font-mono text-zinc-400">AES-256 Active</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            Sentix Framework v2.4.0-Stable
          </div>
        </div>
      </footer>
    </div>
  );
};
