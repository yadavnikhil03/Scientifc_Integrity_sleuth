import { motion } from 'framer-motion';
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const ForensicReport = ({ results }) => {
  if (!results) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-emerald-500" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">Formal Forensic Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ReportMetric label="File Integrity" value={`${(results.overall_score * 100).toFixed(0)}%`} status={results.overall_score > 0.7 ? 'success' : 'warning'} />
        <ReportMetric label="Anomalies" value={results.findings.length} status={results.findings.length > 0 ? 'danger' : 'success'} />
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase">Detailed Log</p>
        <div className="space-y-2">
          {results.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-black/20 border border-slate-800 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-300">{f.type}</p>
                <p className="text-[9px] text-slate-500 leading-relaxed italic">
                  Structural inconsistency detected at coordinates [{f.bbox.join(', ')}]. Confidence: {(f.confidence * 100).toFixed(1)}%.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Analysis Certified</span>
        </div>
        <button className="text-[10px] font-bold text-emerald-500 hover:text-white transition-colors underline uppercase">
          Download PDF Certificate
        </button>
      </div>
    </motion.div>
  );
};

const ReportMetric = ({ label, value, status }) => {
  const statusColors = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400'
  };
  return (
    <div className="p-3 bg-black/40 border border-slate-800 rounded-xl">
      <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">{label}</p>
      <p className={`text-xl font-black ${statusColors[status]}`}>{value}</p>
    </div>
  );
};
