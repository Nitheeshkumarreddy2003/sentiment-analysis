import React, { useState, useRef } from 'react';
import { Send, Loader2, Paperclip, X, FileText, Image as ImageIcon, FileCode, CheckCircle2 } from 'lucide-react';
import { analyzeText, analyzeFile } from '../services/geminiService';

export const CommentInput: React.FC<{ onSubmitted: () => void }> = ({ onSubmitted }) => {
  const [text, setText] = useState('');
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'text' | 'file' | 'saving' | 'complete'>('idle');
  const [selectedFile, setSelectedFile] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported MIME types for Gemini inlineData
    const supportedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 
      'application/x-javascript', 'text/x-typescript', 'application/x-typescript', 
      'text/markdown', 'text/x-python', 'application/x-python', 'text/x-json', 'application/json'
    ];

    if (!supportedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      alert(`Unsupported file type: ${file.type || file.name}. Please upload a PDF, Image, or Plain Text file.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFile({
        file,
        base64: base64String,
        mimeType: file.type || 'application/octet-stream'
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || analysisStage !== 'idle') return;

    setAnalysisStage('text');
    try {
      // 1. Analyze Text
      const textAnalysis = await analyzeText(text || `Intelligence input with attached file: ${selectedFile?.file.name}`);
      
      setAnalysisStage('saving');
      // 2. Save initial comment
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text || `[Attached File: ${selectedFile?.file.name}]`, 
          ...textAnalysis,
          file_name: selectedFile?.file.name,
          file_type: selectedFile?.mimeType,
          file_analysis: selectedFile ? "Analyzing attachment..." : null
        })
      });
      const { id: commentId } = await response.json();
      onSubmitted();

      // 3. Analyze File Asynchronously if present
      if (selectedFile) {
        setAnalysisStage('file');
        const fileAnalysis = await analyzeFile(text, { data: selectedFile.base64, mimeType: selectedFile.mimeType });
        
        // 4. Update comment with file analysis
        await fetch(`/api/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_analysis: fileAnalysis.file_summary,
            sentiment: fileAnalysis.sentiment || textAnalysis.sentiment,
            is_urgent: fileAnalysis.is_urgent !== undefined ? fileAnalysis.is_urgent : textAnalysis.is_urgent,
            confidence: fileAnalysis.confidence || textAnalysis.confidence
          })
        });
        onSubmitted();
      }

      setAnalysisStage('complete');
      setTimeout(() => {
        setText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setAnalysisStage('idle');
      }, 1500);

    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze intelligence. Please check your API key and file format.");
      setAnalysisStage('idle');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={14} className="text-emerald-500" />;
    if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) return <FileCode size={14} className="text-emerald-500" />;
    return <FileText size={14} className="text-emerald-500" />;
  };

  const isAnalyzing = analysisStage !== 'idle' && analysisStage !== 'complete';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl mb-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-focus-within:bg-emerald-500 transition-colors" />
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4 italic flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Service Feedback Portal
      </h3>
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Please describe your issue or feedback about the service. Our AI system will analyze your comment and identify whether it is Positive, Negative, Neutral, or Sarcastic."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 min-h-[120px] transition-all placeholder:text-zinc-700 font-sans"
          disabled={isAnalyzing}
        />

        {selectedFile && (
          <div className="mt-3 flex items-center gap-3 bg-zinc-950/50 border border-zinc-800 p-2 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="w-8 h-8 bg-zinc-900 rounded flex items-center justify-center">
              {getFileIcon(selectedFile.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-zinc-300 truncate">{selectedFile.file.name}</div>
              <div className="text-[8px] font-mono text-zinc-600 uppercase">{(selectedFile.file.size / 1024).toFixed(1)} KB • {selectedFile.mimeType}</div>
            </div>
            <button 
              type="button"
              onClick={removeFile}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,text/plain,text/csv,application/json"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all disabled:opacity-50"
            >
              <Paperclip size={12} />
              Attach Documents
            </button>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest ml-2">
              {text.length} Chars • {selectedFile ? '1 File' : '0 Files'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono uppercase tracking-widest">
                <Loader2 size={12} className="animate-spin" />
                {analysisStage === 'text' && 'Analyzing Text...'}
                {analysisStage === 'saving' && 'Saving Record...'}
                {analysisStage === 'file' && 'Analyzing Attachment...'}
              </div>
            )}
            {analysisStage === 'complete' && (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-mono uppercase tracking-widest animate-in fade-in">
                <CheckCircle2 size={12} />
                Analysis Complete
              </div>
            )}
            <button
              type="submit"
              disabled={(!text.trim() && !selectedFile) || isAnalyzing || analysisStage === 'complete'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:hover:bg-emerald-600 text-white p-2 rounded-lg transition-all flex items-center gap-2 px-6 font-mono text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
            >
              <Send size={12} />
              Analyze Feedback
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
