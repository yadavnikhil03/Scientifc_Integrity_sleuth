import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Search, RefreshCcw, Download, BarChart3, Binary } from 'lucide-react';
import { ForensicReport } from './ForensicReport';

export const AnalysisPanel = React.memo(({ 
  file, isAnalyzing, results, logs, viewMode, onRunAnalysis
}) => {
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      {/* Action Card */}
      <div className="glass-card p-6 border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80">
        <h3 className="mono-label mb-5 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-500" /> Control Module
        </h3>
        <div className="space-y-4">
          <button 
            disabled={!file || isAnalyzing || results}
            onClick={onRunAnalysis}
            className="btn-primary w-full h-14 text-sm font-bold shadow-xl shadow-emerald-500/10 active:scale-95 disabled:scale-100"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <RefreshCcw className="w-4 h-4 animate-spin" /> RUNNING_SCAN...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4" /> START_FORENSICS
              </div>
            )}
          </button>
          {results && (
            <button className="btn-outline w-full h-12 flex items-center justify-center gap-2 text-xs font-bold uppercase">
              <Download className="w-4 h-4" /> Export Report
            </button>
          )}
        </div>
      </div>

      {/* Results/Log Card */}
      <div className="flex-grow glass-card flex flex-col border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/30 bg-slate-900/50 flex items-center justify-between">
          <span className="mono-label">{viewMode === 'user' ? 'Findings Report' : 'Raw Subsystem Output'}</span>
          {viewMode === 'dev' && <Binary className="w-3.5 h-3.5 text-slate-500" />}
        </div>

        <div className="flex-grow p-5 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {viewMode === 'dev' ? (
              <motion.div 
                key="dev-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[10px] space-y-2.5"
              >
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-slate-500 hover:text-slate-300 transition-colors">
                    <span className="opacity-30">{String(i).padStart(2, '0')}</span>
                    <span className={log.includes('ERROR') ? 'text-red-400' : log.includes('COMPLETE') ? 'text-emerald-400' : ''}>
                      {log}
                    </span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="user-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {!results ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-30">
                    <BarChart3 className="w-12 h-12 mb-4" />
                    <p className="text-xs uppercase font-bold tracking-widest">Awaiting Analysis Data</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ForensicReport results={results} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
