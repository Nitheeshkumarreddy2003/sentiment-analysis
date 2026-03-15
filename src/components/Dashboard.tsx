import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { DashboardStats } from '../types';
import { AlertCircle, TrendingUp, MessageSquare, ShieldAlert, BrainCircuit, Globe2, Target } from 'lucide-react';
import { motion } from 'motion/react';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22d3ee', // Cyan
  negative: '#d946ef', // Fuchsia
  neutral: '#a78bfa',  // Violet
  sarcastic: '#a3e635' // Lime
};

const LANG_COLORS = ['#fb7185', '#38bdf8', '#fbbf24', '#c084fc', '#4ade80'];
const TOPIC_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

export const Dashboard: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const totalSentiments = stats.sentiment_dist.reduce((acc, curr) => acc + curr.count, 0);
  const totalLanguages = stats.language_dist.reduce((acc, curr) => acc + curr.count, 0);
  
  const sarcasmCount = stats.sentiment_dist.find(s => s.sentiment === 'sarcastic')?.count || 0;
  const sarcasmRate = totalSentiments > 0 ? (sarcasmCount / totalSentiments) * 100 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <BrainCircuit size={16} className="text-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Intelligence Engine</span>
          </div>
          <div className="text-2xl font-mono text-white">{stats.total}</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Total Neural Inferences</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <ShieldAlert size={16} className="text-rose-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Urgent Alerts</span>
          </div>
          <div className="text-2xl font-mono text-rose-500">{stats.urgency_count}</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Critical Priority</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <AlertCircle size={16} className="text-lime-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Anomaly Detection</span>
          </div>
          <div className="text-2xl font-mono text-lime-400">{(stats.avg_toxicity * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Avg Toxicity Level</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <TrendingUp size={16} className="text-yellow-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Sarcasm Rate</span>
          </div>
          <div className="text-2xl font-mono text-yellow-500">{sarcasmRate.toFixed(1)}%</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Contextual Ambiguity</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <Globe2 size={16} className="text-blue-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Multilingual Coverage</span>
          </div>
          <div className="text-2xl font-mono text-blue-400">{stats.language_dist.length}</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Detected Dialects</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <Target size={16} className="text-lime-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Polarization</span>
          </div>
          <div className="text-2xl font-mono text-lime-400">{(stats.avg_polarization * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Emotional Extremism</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-sm md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <BrainCircuit size={16} className="text-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider">AI Confidence</span>
          </div>
          <div className="text-2xl font-mono text-emerald-500">{(stats.avg_confidence * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-zinc-600 font-mono mt-1">Model Reliability</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 italic">Sentiment Trend Forecasting</h3>
            <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" /> Sentiment
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-lime-400" /> Polarization
              </div>
            </div>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={stats.recent_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split(' ')[1].substring(0, 5)}
                />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} domain={[-1, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sentiment_score" 
                  name="Sentiment"
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#22d3ee' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_polarization" 
                  name="Polarization"
                  stroke="#a3e635" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#a3e635' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Language Distribution */}
        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Globe2 size={14} className="text-blue-500" />
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 italic">Multilingual Reach</h3>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.language_dist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="language"
                >
                  {stats.language_dist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [
                    `${value} (${totalLanguages > 0 ? ((value / totalLanguages) * 100).toFixed(1) : 0}%)`, 
                    'Comments'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sentiment Pie */}
        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-6 italic">Opinion Landscape</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.sentiment_dist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="sentiment"
                >
                  {stats.sentiment_dist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment] || '#71717a'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                  formatter={(value: number, name: string) => [
                    `${value} (${totalSentiments > 0 ? ((value / totalSentiments) * 100).toFixed(1) : 0}%)`, 
                    name.toUpperCase()
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Topic Bar */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-6 italic">Top Consultation Topics</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.topic_dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="topic" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.topic_dist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Strategic AI Recommendations */}
      <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit size={18} className="text-emerald-500" />
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 italic">Strategic AI Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.recommendations.map((rec, i) => (
            <div key={i} className="bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-lg flex gap-4 items-start group hover:border-emerald-500/30 transition-colors">
              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-mono shrink-0">
                0{i + 1}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
