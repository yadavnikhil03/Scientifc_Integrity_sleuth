import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertTriangle } from 'lucide-react';

export const Viewport = React.memo(({ preview, isAnalyzing, results, onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  return (
    <div 
      className="flex-[3] flex flex-col glass-card border-slate-700/50 relative overflow-hidden group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
      
      <div className="flex-grow relative flex items-center justify-center p-8 bg-slate-950/40">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center max-w-md"
            >
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group-hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Begin Forensics</h3>
              <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                Upload a scientific document, microscopy image, or chart to detect digital alterations and cloning artifacts.
              </p>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="btn-primary w-full py-4 text-sm tracking-widest"
              >
                SELECT_SOURCE_IMAGE
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => onFileSelect(e.target.files[0])} 
                className="hidden" 
                accept="image/*" 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-full max-h-full p-1 bg-slate-800/50 rounded-lg ring-1 ring-slate-700"
            >
              <img src={preview} alt="Source" className="max-w-full max-h-[65vh] rounded-md object-contain" />
              
              {isAnalyzing && (
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="scanner-active"
                />
              )}

              {results && results.findings.map((finding) => (
                <motion.div 
                  key={finding.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="finding-box border-2 cursor-pointer"
                  style={{
                    left: `${finding.bbox[0]}px`,
                    top: `${finding.bbox[1]}px`,
                    width: `${finding.bbox[2]}px`,
                    height: `${finding.bbox[3]}px`,
                  }}
                >
                  <div className="absolute -top-6 left-0 flex items-center gap-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-t tracking-tighter whitespace-nowrap">
                    <AlertTriangle className="w-3 h-3" /> {finding.type.toUpperCase()}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="h-12 border-t border-slate-700/30 px-6 flex items-center justify-between bg-slate-900/40 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <span>Resolution: {preview ? 'Auto-detected' : 'N/A'}</span>
          <span>Integrity Check: {results ? 'Completed' : isAnalyzing ? 'Running...' : 'Ready'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Live Forensic Stream</span>
        </div>
      </div>
    </div>
  );
});
