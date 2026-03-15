import React, { useState, useMemo } from 'react';
import { Comment } from '../types';
import { AlertTriangle, CheckCircle2, Info, MessageSquareWarning, Search, Filter, X, BrainCircuit, Calendar, ShieldAlert, Zap, Target, Trash2, ChevronDown, ChevronUp, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Reply, Send, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SortField = 'date' | 'sentiment' | 'toxicity' | 'confidence';
type SortOrder = 'asc' | 'desc';

export const CommentList: React.FC<{ comments: Comment[], onDelete?: () => void }> = ({ comments, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedComments(newExpanded);
  };

  const languageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    comments.forEach(c => {
      stats[c.language] = (stats[c.language] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => a.lang.localeCompare(b.lang));
  }, [comments]);

  const filteredComments = useMemo(() => {
    const filtered = comments.filter(comment => {
      // Only show top-level comments in the main list
      if (comment.parent_id) return false;

      const matchesSearch = comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comment.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comment.entities.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSentiment = sentimentFilter === 'all' || comment.sentiment === sentimentFilter;
      const matchesLanguage = languageFilter === 'all' || comment.language === languageFilter;
      const matchesUrgency = urgencyFilter === 'all' || 
                            (urgencyFilter === 'urgent' && comment.is_urgent) ||
                            (urgencyFilter === 'normal' && !comment.is_urgent);

      const commentDate = new Date(comment.timestamp).getTime();
      const matchesStartDate = !startDate || commentDate >= new Date(startDate).getTime();
      const matchesEndDate = !endDate || commentDate <= new Date(endDate).getTime() + 86400000; // Include full end day

      return matchesSearch && matchesSentiment && matchesLanguage && matchesUrgency && matchesStartDate && matchesEndDate;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'sentiment') {
        comparison = a.sentiment.localeCompare(b.sentiment);
      } else if (sortBy === 'toxicity') {
        comparison = a.toxicity - b.toxicity;
      } else if (sortBy === 'confidence') {
        comparison = a.confidence - b.confidence;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [comments, searchQuery, sentimentFilter, languageFilter, urgencyFilter, startDate, endDate, sortBy, sortOrder]);

  const getReplies = (parentId: number) => {
    return comments.filter(c => c.parent_id === parentId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const handleReply = async (parentId: number) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    
    try {
      // For simplicity, we'll create a "neutral" comment as a reply
      // In a real app, we might want to analyze the reply too
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText,
          sentiment: 'neutral',
          intensity: 0.5,
          toxicity: 0,
          is_sarcastic: false,
          is_urgent: false,
          is_spam: false,
          spam_score: 0,
          polarization_score: 0,
          topic: 'Reply',
          explanation: 'User generated reply',
          actionable_insight: '',
          language: 'English',
          confidence: 1,
          entities: [],
          parent_id: parentId
        }),
      });

      if (response.ok) {
        setReplySuccess(parentId);
        setReplyText('');
        // Wait 1.5 seconds to show success message before closing
        setTimeout(() => {
          setReplyingTo(null);
          setReplySuccess(null);
          onDelete?.(); // Trigger refresh
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSentimentFilter('all');
    setLanguageFilter('all');
    setUrgencyFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDeleteId(null);
        setSuccessMessage('Feedback record successfully purged from intelligence database.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        onDelete?.();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 italic">Feedback Intelligence Stream</h3>
            {(startDate || endDate) && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
                <Calendar size={10} />
                {startDate || '...'} — {endDate || '...'}
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              const headers = ['ID', 'Text', 'Sentiment', 'Topic', 'Urgency', 'Language', 'Confidence', 'Entities'];
              const rows = filteredComments.map(c => [
                c.id,
                `"${c.text.replace(/"/g, '""')}"`,
                c.sentiment,
                c.topic,
                c.is_urgent ? 'Yes' : 'No',
                c.language,
                c.confidence.toFixed(2),
                `"${c.entities.join('; ').replace(/"/g, '""')}"`
              ]);
              
              const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = `feedback_report_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }}
            className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 hover:text-emerald-400 uppercase tracking-widest border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors bg-emerald-500/5"
          >
            <ExternalLink size={12} />
            Export CSV ({filteredComments.length})
          </button>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
          The dashboard allows administrators to search, filter, and manage previously analyzed feedback. You can review sentiment results, identify trends, or remove outdated records.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords, topics, or entities..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
            <ArrowUpDown size={14} className="text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase"
            >
              <option value="date">Sort by Date</option>
              <option value="sentiment">Sort by Sentiment</option>
              <option value="toxicity">Sort by Toxicity</option>
              <option value="confidence">Sort by Confidence</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-emerald-500"
            >
              {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Filter size={12} className="text-zinc-500" />
            <select 
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase tracking-wider"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive (Good)</option>
              <option value="negative">Negative (Bad)</option>
              <option value="neutral">Neutral</option>
              <option value="sarcastic">Sarcasm</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Filter size={12} className="text-zinc-500" />
            <select 
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase tracking-wider"
            >
              <option value="all">All Languages ({comments.length})</option>
              {languageStats.map(({ lang, count }) => (
                <option key={lang} value={lang}>{lang} ({count})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Filter size={12} className="text-zinc-500" />
            <select 
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase tracking-wider"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent Only</option>
              <option value="normal">Normal Priority</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 group/date focus-within:border-emerald-500/50 transition-colors">
            <Calendar size={12} className="text-zinc-500 group-focus-within/date:text-emerald-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">From</span>
            <input 
              type="date" 
              min="1990-01-01"
              max="2040-12-31"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase appearance-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 group/date focus-within:border-emerald-500/50 transition-colors">
            <Calendar size={12} className="text-zinc-500 group-focus-within/date:text-emerald-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">To</span>
            <input 
              type="date" 
              min="1990-01-01"
              max="2040-12-31"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-400 focus:outline-none cursor-pointer uppercase appearance-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <button 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all uppercase tracking-widest"
          >
            Today
          </button>

          <button 
            onClick={resetFilters}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all uppercase tracking-widest flex items-center gap-2"
          >
            <X size={12} /> Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-1">
        Showing {filteredComments.length} of {comments.length} intelligence records
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredComments.map((comment, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={comment.id}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                    comment.sentiment === 'positive' ? 'bg-cyan-500/10 text-cyan-400' :
                    comment.sentiment === 'negative' ? 'bg-fuchsia-500/10 text-fuchsia-400' :
                    comment.sentiment === 'sarcastic' ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20' :
                    'bg-violet-500/10 text-violet-400'
                  }`}>
                    {comment.sentiment === 'sarcastic' ? '⚠️ Sarcasm Detected' : comment.sentiment}
                  </span>
                  
                  {expandedComments.has(comment.id) && (
                    <>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-800/50 px-2 py-0.5 rounded">
                        {comment.language}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                        Topic: {comment.topic}
                      </span>
                      {comment.is_urgent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold uppercase animate-pulse">
                          <AlertTriangle size={10} /> Urgent
                        </span>
                      )}
                      {comment.is_spam && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500 text-white text-[10px] font-bold uppercase">
                          <ShieldAlert size={10} /> Spam/Bot
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-600">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => setDeleteId(comment.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Feedback"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {comment.text}
                </p>
                
                <AnimatePresence>
                  {expandedComments.has(comment.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-4">
                        {comment.translated_text && (
                          <p className="text-zinc-500 text-xs italic border-l-2 border-zinc-800 pl-3">
                            Translation: {comment.translated_text}
                          </p>
                        )}

                        {comment.explanation && (
                          <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                              <BrainCircuit size={16} className="text-emerald-500" />
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">Explainable AI (XAI) Reasoning</h4>
                            </div>
                            <p className="text-zinc-400 text-xs leading-relaxed italic">
                              "{comment.explanation}"
                            </p>
                            <div className="flex items-center gap-4 pt-2 border-t border-zinc-900">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">Confidence:</span>
                                <span className="text-[10px] font-mono text-emerald-500">{(comment.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">Toxicity:</span>
                                <span className={`text-[10px] font-mono ${comment.toxicity > 0.5 ? 'text-rose-500' : 'text-zinc-400'}`}>{(comment.toxicity * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {comment.actionable_insight && (
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-start gap-3">
                            <Zap size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[9px] font-mono uppercase text-emerald-500 block mb-1 tracking-widest">Actionable Insight</span>
                              <p className="text-zinc-400 text-xs italic leading-relaxed">
                                {comment.actionable_insight}
                              </p>
                            </div>
                          </div>
                        )}

                        {comment.entities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {comment.entities.map((entity, i) => (
                              <span key={i} className="text-[9px] font-mono text-blue-400 bg-blue-400/5 border border-blue-400/10 px-2 py-0.5 rounded">
                                @{entity}
                              </span>
                            ))}
                          </div>
                        )}

                        {comment.file_analysis && (
                          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-3">
                            <FileText size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[9px] font-mono uppercase text-blue-500 block mb-1 tracking-widest">
                                Attachment Analysis: {comment.file_name}
                              </span>
                              <p className="text-zinc-400 text-xs italic leading-relaxed">
                                {comment.file_analysis}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
                          <div>
                            <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-500 mb-1">
                              <span>Anomaly (Tox)</span>
                              <span className={comment.toxicity > 0.7 ? 'text-red-500' : ''}>{(comment.toxicity * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${comment.toxicity > 0.7 ? 'bg-red-500' : 'bg-orange-500'}`} 
                                style={{ width: `${comment.toxicity * 100}%` }} 
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-500 mb-1">
                              <span>Confidence</span>
                              <span>{(comment.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${comment.confidence * 100}%` }} 
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[9px] font-mono uppercase text-zinc-500">Sarcasm</div>
                            {comment.is_sarcastic ? (
                              <MessageSquareWarning size={14} className="text-yellow-500" />
                            ) : (
                              <CheckCircle2 size={14} className="text-zinc-700" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[9px] font-mono uppercase text-zinc-500">Polarization</div>
                            <div className="flex items-center gap-1">
                              <Target size={12} className={comment.polarization_score > 0.7 ? 'text-orange-500' : 'text-zinc-600'} />
                              <span className={`text-[10px] font-mono ${comment.polarization_score > 0.7 ? 'text-orange-500' : 'text-zinc-400'}`}>
                                {(comment.polarization_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group/info relative">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors cursor-help">
                              <BrainCircuit size={12} className="text-emerald-500" />
                              <span className="text-[9px] font-mono uppercase text-zinc-400">XAI Logic</span>
                            </div>
                            <div className="absolute bottom-full left-0 mb-2 w-72 p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 opacity-0 group-hover/info:opacity-100 transition-all z-50 pointer-events-none shadow-2xl translate-y-2 group-hover/info:translate-y-0">
                              <div className="flex items-center gap-2 font-bold text-emerald-500 mb-2 uppercase tracking-widest text-[9px]">
                                <BrainCircuit size={12} /> Explainable AI Reasoning
                              </div>
                              <div className="leading-relaxed font-sans italic">
                                "{comment.explanation}"
                              </div>
                              <div className="mt-3 pt-2 border-t border-zinc-900 flex justify-between items-center text-[8px] font-mono text-zinc-600 uppercase">
                                <span>Model: Gemini 3 Flash</span>
                                <span>Confidence: {(comment.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleExpand(comment.id)}
                    className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors"
                  >
                    {expandedComments.has(comment.id) ? (
                      <>
                        <ChevronUp size={12} /> Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> View Details
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                      replyingTo === comment.id ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'
                    }`}
                  >
                    <Reply size={12} /> Reply
                  </button>
                </div>
                
                {!expandedComments.has(comment.id) && (
                  <div className="flex items-center gap-3">
                    {comment.is_urgent && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {comment.is_spam && <ShieldAlert size={10} className="text-purple-500" />}
                    <div className="text-[9px] font-mono text-zinc-700 uppercase">
                      Conf: {(comment.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <AnimatePresence>
                {replyingTo === comment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-zinc-800"
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response..."
                          className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[80px] resize-none ${replySuccess === comment.id ? 'opacity-50' : ''}`}
                          disabled={isSubmittingReply || replySuccess === comment.id}
                        />
                        {replySuccess === comment.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-xs rounded-lg animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase tracking-widest">
                              <CheckCircle2 size={14} />
                              Intelligence Dispatched
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={isSubmittingReply || !replyText.trim() || replySuccess === comment.id}
                        className="self-end p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[44px] flex items-center justify-center"
                      >
                        {isSubmittingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nested Replies */}
              {getReplies(comment.id).length > 0 && (
                <div className="mt-6 ml-4 pl-6 border-l-2 border-emerald-500/10 space-y-4">
                  {getReplies(comment.id).map(reply => (
                    <div key={reply.id} className="relative group/reply">
                      {/* Visual Connector */}
                      <div className="absolute -left-[25px] top-6 w-4 h-[2px] bg-emerald-500/20" />
                      
                      <div className="bg-linear-to-br from-emerald-500/[0.08] via-zinc-900/40 to-zinc-900/20 border border-emerald-500/20 p-4 rounded-xl backdrop-blur-xs hover:border-emerald-500/40 transition-all shadow-lg shadow-emerald-900/5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
                              <Reply size={12} className="text-emerald-400 -scale-x-100" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                Analyst Intervention
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDelete(reply.id)}
                            className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/reply:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                          <p className="text-zinc-300 text-xs leading-relaxed pl-5 italic font-serif">
                            "{reply.text}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredComments.length === 0 && (
          <div className="py-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl">
            <Search className="mx-auto text-zinc-700 mb-3" size={32} />
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">No intelligence records match your filters</p>
            <button 
              onClick={resetFilters}
              className="mt-4 text-emerald-500 hover:text-emerald-400 font-mono text-[10px] uppercase tracking-widest"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Permanent Deletion</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Are you sure you want to delete this intelligence record? This will permanently remove the <span className="text-white font-bold">feedback text</span>, <span className="text-white font-bold">sentiment analysis results</span>, <span className="text-white font-bold">attachments</span>, and all <span className="text-white font-bold">analyst notes</span>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteId && handleDelete(deleteId)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
