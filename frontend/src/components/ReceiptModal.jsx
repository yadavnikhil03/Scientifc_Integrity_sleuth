/* eslint-disable react-hooks/purity */
import { useMemo } from 'react';
import { Printer, X } from 'lucide-react';

export const ReceiptModal = ({ results, file, onClose }) => {
  const refId = useMemo(() => Math.random().toString(36).substring(2, 10).toUpperCase(), []);

  if (!results) return null;

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm print:bg-transparent print:backdrop-blur-none p-4">
      {/* Receipt Container */}
      <div 
        id="receipt-printable" 
        className="relative bg-white text-black font-mono w-full max-w-sm max-h-full overflow-y-auto print:max-w-none print:h-auto print:overflow-visible print:absolute print:left-0 print:top-0"
        style={{
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backgroundImage: 'linear-gradient(to bottom, #fff 0%, #f9f9f9 100%)',
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))'
        }}
      >
        <div className="p-8 pb-12 text-[12px] leading-tight">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-1">SCIENTIFIC INTEGRITY</h2>
            <p className="text-[10px] font-bold">FORENSIC LAB REPORT</p>
            <p className="text-[10px] mt-2">--------------------------------</p>
          </div>

          {/* Meta Data */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>DATE:</span>
              <span>{timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span>REF ID:</span>
              <span>#{refId}</span>
            </div>
            <div className="flex justify-between">
              <span>FILE:</span>
              <span className="truncate max-w-[150px]">{file?.name || 'UNKNOWN_SPECIMEN'}</span>
            </div>
          </div>

          <p className="text-[10px] mb-4">--------------------------------</p>

          {/* Results */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between font-bold text-[14px]">
              <span>INTEGRITY:</span>
              <span>{(results.overall_score * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between font-bold text-[14px]">
              <span>SPLICING:</span>
              <span>{results.findings.length > 0 ? 'DETECTED' : 'CLEAN'}</span>
            </div>
            <div className="flex justify-between">
              <span>ANOMALIES:</span>
              <span>{results.findings.length}</span>
            </div>
          </div>

          <p className="text-[10px] mb-4">--------------------------------</p>

          {/* Detailed Findings */}
          <div className="space-y-4 mb-8">
            <p className="font-bold">ITEMIZED LOG:</p>
            {results.findings.length === 0 ? (
              <p className="italic text-center my-4">NO ANOMALIES FOUND</p>
            ) : (
              results.findings.map((f, i) => (
                <div key={i} className="mb-2">
                  <p className="font-bold">[{i + 1}] {f.type}</p>
                  <p>CONFIDENCE: {(f.confidence * 100).toFixed(1)}%</p>
                  <p className="text-[9px]">LOC: {f.bbox.map(n => n.toFixed(1)).join(', ')}</p>
                </div>
              ))
            )}
          </div>

          <p className="text-[10px] mb-4">--------------------------------</p>

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="font-bold">* ANALYSIS CERTIFIED *</p>
            <p className="text-[9px]">THANK YOU FOR YOUR COOPERATION</p>
          </div>

          {/* End of receipt decorative barcode */}
          <div className="mt-8 flex justify-center opacity-60">
            <div className="h-8 w-48 bg-repeating-linear-gradient(to right, black, black 2px, transparent 2px, transparent 4px, black 4px, black 5px, transparent 5px, transparent 8px)" style={{
                background: 'repeating-linear-gradient(to right, #000, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden in Print) */}
      <div className="absolute top-4 right-4 flex gap-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="bg-white text-black font-mono px-4 py-2 text-sm font-bold shadow-lg hover:bg-slate-200 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          PRINT TICKET
        </button>
        <button 
          onClick={onClose}
          className="bg-black/50 text-white font-mono px-4 py-2 text-sm font-bold shadow-lg border border-white/20 hover:bg-black flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          CLOSE
        </button>
      </div>
    </div>
  );
};
