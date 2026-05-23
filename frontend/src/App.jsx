import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Binary,
  CircleAlert,
  Cpu,
  Database,
  Download,
  Fingerprint,
  FlaskConical,
  Gauge,
  Layers3,
  Microchip,
  MousePointer2,
  RefreshCcw,
  Search,
  Shield,
  Sparkles,
  Terminal,
  TimerReset,
  Upload,
  Zap,
} from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const shellVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const App = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState(['BOOT_SEQUENCE_COMPLETE', 'FORENSIC_CORE_READY', 'AWAITING_SAMPLE']);
  const [metrics, setMetrics] = useState({ cpu: 12, gpu: 4, mem: 4.2 });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dragActive, setDragActive] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  const fileInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => ({
        cpu: Math.max(5, Math.min(96, prev.cpu + (Math.random() * 6 - 3))),
        gpu: Math.max(0, Math.min(100, prev.gpu + (Math.random() * 4 - 2))),
        mem: Math.max(2, Math.min(16, prev.mem + (Math.random() * 0.1 - 0.05))),
      }));
    }, 2000);

    const clockTimer = setInterval(() => setClock(new Date()), 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        if (!response.ok) throw new Error('health check failed');
        await response.json();
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkBackend();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const addLog = useCallback((message) => {
    setLogs((prev) => [...prev.slice(-11), `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const handleFile = useCallback((selected) => {
    if (!selected) return;

    setFile(selected);
    setResults(null);
    setError(null);

    const previewUrl = URL.createObjectURL(selected);
    setPreview(previewUrl);
    addLog(`SPECIMEN_LOADED: ${selected.name}`);
  }, [addLog]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const runAnalysis = useCallback(async () => {
    if (!file || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setBackendStatus('busy');
    addLog('INITIATING_FORENSIC_PROTOCOL');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || 'FORENSIC_CORE_FAILURE');
      }

      setResults(data);
      setBackendStatus('online');
      addLog(`ANALYSIS_SUCCESS: ${data.findings.length} ANOMALIES`);
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : 'ANALYSIS_FAILED';
      setError(message);
      setBackendStatus('offline');
      addLog(`SUBSYSTEM_CRITICAL_FAILURE: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addLog, file, isAnalyzing]);

  const reset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
    setBackendStatus('checking');
    addLog('WORKSPACE_PURGED');
  }, [addLog, preview]);

  const summaryCards = results
    ? [
        { label: 'Integrity', value: `${(results.overall_score * 100).toFixed(1)}%`, tone: results.overall_score > 0.8 ? 'text-emerald-400' : 'text-amber-400' },
        { label: 'Findings', value: results.findings.length, tone: 'text-cobalt' },
        { label: 'Payload', value: `${(results.filesize / 1024).toFixed(1)} KB`, tone: 'text-slate-100' },
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(88,166,255,0.18),_transparent_35%),linear-gradient(180deg,_#060709_0%,_#090c12_55%,_#050608_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cobalt/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-emerald/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />

      <div className="relative z-10 flex min-h-screen flex-col p-3 sm:p-4 lg:p-5">
        <motion.header
          variants={shellVariants}
          initial="hidden"
          animate="visible"
          className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cobalt/30 bg-cobalt/10 shadow-[0_0_30px_rgba(88,166,255,0.18)]">
                  <FlaskConical className="h-5 w-5 text-cobalt" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cobalt/70">Scientific Integrity Sleuth</p>
                  <h1 className="text-lg font-semibold tracking-tight text-white sm:text-2xl">Forensic imaging control center</h1>
                </div>
              </div>
              <div className="hidden h-8 w-px bg-white/10 md:block" />
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(63,185,80,0.9)]' : backendStatus === 'busy' ? 'bg-amber-400 shadow-[0_0_10px_rgba(210,153,34,0.9)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,81,73,0.9)]'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">{backendStatus}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                <Cpu className="h-3.5 w-3.5 text-cobalt" />
                <span>CPU {metrics.cpu.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                <Microchip className="h-3.5 w-3.5 text-emerald-400" />
                <span>GPU {metrics.gpu.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span>RAM {metrics.mem.toFixed(1)} GB</span>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-2 sm:flex sm:items-center sm:gap-2">
                <TimerReset className="h-3.5 w-3.5 text-cobalt" />
                <span>{clock.toISOString().split('T')[1].split('.')[0]} UTC</span>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)_380px]">
          <motion.aside
            custom={0.05}
            variants={shellVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Case Intake</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Upload sample</h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
              <div
                onClick={() => !file && fileInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`scan-dropzone group relative flex min-h-[210px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border p-5 text-center transition-all duration-300 ${file ? 'border-cobalt/40 bg-cobalt/10' : dragActive ? 'border-emerald-400/70 bg-emerald-400/10' : 'border-white/10 bg-black/20 hover:border-cobalt/60 hover:bg-cobalt/10'}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)] opacity-70" />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-105">
                  {file ? <Fingerprint className="h-8 w-8 text-cobalt" /> : <Upload className="h-8 w-8 text-slate-300" />}
                </div>
                <p className="relative z-10 mt-4 text-sm font-semibold text-white">{file ? 'Sample staged for analysis' : 'Drop a microscopy image or click to load'}</p>
                <p className="relative z-10 mt-2 max-w-[18rem] text-xs leading-5 text-slate-400">
                  Supported input: PNG, JPG, TIFF, and other browser-readable image formats.
                </p>
                <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-cobalt" />
                  <span>drag to arm scanner</span>
                </div>
                <input ref={fileInputRef} type="file" onChange={(event) => handleFile(event.target.files?.[0])} className="hidden" accept="image/*" />
              </div>

              {file ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">{(file.size / 1024).toFixed(1)} KB • {file.type || 'image/*'}</p>
                    </div>
                    <CircleAlert className="h-4 w-4 text-amber-400" />
                  </div>
                  <button
                    onClick={reset}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-red-200 transition hover:border-red-400/40 hover:bg-red-500/20"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Detach sample
                  </button>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Telemetry</p>
                  <Gauge className="h-4 w-4 text-cobalt" />
                </div>
                <div className="space-y-3">
                  <MetricBar label="CPU load" value={metrics.cpu} max={100} tone="bg-cobalt" unit="%" />
                  <MetricBar label="GPU intensity" value={metrics.gpu} max={100} tone="bg-emerald-400" unit="%" />
                  <MetricBar label="RAM pressure" value={metrics.mem} max={16} tone="bg-amber-400" unit="GB" precision={1} />
                </div>
              </div>

              <div className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cobalt" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">System log</p>
                </div>
                <div className="scrollbar-hide max-h-[220px] space-y-2 overflow-y-auto pr-1 font-mono text-[10px] leading-5 text-slate-400">
                  {logs.map((log, index) => (
                    <div key={`${log}-${index}`} className="flex gap-3">
                      <span className="w-6 text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                      <span className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('FAILURE') ? 'text-red-400' : log.includes('LOADED') ? 'text-cobalt' : 'text-slate-400'}>{log}</span>
                    </div>
                  ))}
                  {isAnalyzing ? <div className="animate-pulse text-cobalt">PROCESSING_SCAN...</div> : null}
                </div>
              </div>
            </div>
          </motion.aside>

          <motion.section
            custom={0.12}
            variants={shellVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel relative min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_25%)]" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cobalt/40 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_45%)]" />
            </div>

            <div className="relative flex h-full min-h-[520px] flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Viewport</span>
                  <span className="hidden sm:inline">Resolution adaptive</span>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <MousePointer2 className="h-3.5 w-3.5 text-cobalt" />
                  <span>live inspection</span>
                </div>
              </div>

              <div className="relative flex flex-1 items-center justify-center overflow-hidden p-5 sm:p-8">
                <div className="pointer-events-none absolute left-4 right-4 top-4 h-4 border-b border-white/10">
                  <div className="flex justify-between text-[8px] uppercase tracking-[0.3em] text-slate-600">
                    {['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'].map((value) => (
                      <span key={value}>{value}mm</span>
                    ))}
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-4 left-4 top-10 w-6 border-r border-white/10 text-[8px] uppercase tracking-[0.3em] text-slate-600">
                  <div className="flex h-full flex-col justify-between py-4">
                    {['0', '25', '50', '75', '100'].map((value) => (
                      <span key={value} className="-rotate-90 origin-left">{value}%</span>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!preview ? (
                    <motion.div
                      key="empty-stage"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="relative z-10 flex max-w-xl flex-col items-center text-center"
                    >
                      <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-cobalt/15 bg-cobalt/5 shadow-[0_0_60px_rgba(88,166,255,0.1)]">
                        <div className="absolute inset-0 animate-ping rounded-full border border-cobalt/20" />
                        <Binary className="h-20 w-20 text-cobalt/20" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cobalt/60">Inspect mode</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Awaiting specimen injection</h2>
                      <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
                        Load an image to activate anomaly overlays, run the backend scan, and generate a formal integrity readout.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview-stage"
                      initial={{ opacity: 0, scale: 0.97, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 max-w-full"
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                        <img src={preview} alt="Sample analysis preview" className="max-h-[68vh] max-w-full rounded-xl object-contain" />

                        {isAnalyzing ? (
                          <motion.div
                            initial={{ top: 0 }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                            className="scanner-active absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cobalt to-transparent shadow-[0_0_18px_rgba(88,166,255,0.85)]"
                          />
                        ) : null}

                        {results?.findings?.map((finding, index) => (
                          <motion.div
                            key={finding.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.06 }}
                            className="finding-box"
                            style={{ left: finding.bbox[0], top: finding.bbox[1], width: finding.bbox[2], height: finding.bbox[3] }}
                          >
                            <div className="finding-tag">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{finding.type.toUpperCase()}</span>
                              <span>{(finding.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.28em] text-slate-400">
                <div className="flex items-center gap-3">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Encrypted analysis lane</span>
                </div>
                <div className="flex items-center gap-3">
                  <Layers3 className="h-3.5 w-3.5 text-cobalt" />
                  <span>{preview ? 'sample locked' : 'no sample mounted'}</span>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.aside
            custom={0.2}
            variants={shellVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Intel Panel</p>
              <h2 className="mt-2 text-lg font-semibold text-white">Findings and report</h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={!file || isAnalyzing}
                  onClick={runAnalysis}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] transition-all duration-300 ${!file || isAnalyzing ? 'cursor-not-allowed border-white/10 bg-white/5 text-slate-500' : 'border-cobalt/40 bg-cobalt/15 text-cobalt hover:bg-cobalt/25 hover:text-white'}`}
                >
                  <Search className="h-4 w-4" />
                  {isAnalyzing ? 'Scanning' : 'Initialize Scan'}
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <CircleAlert className="h-4 w-4" />
                    Scan error
                  </div>
                  <p className="text-sm leading-6 text-red-100/80">{error}</p>
                </div>
              ) : null}

              {results ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                    {summaryCards.map((card) => (
                      <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                        <p className={`mt-2 text-3xl font-semibold tracking-tight ${card.tone}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Integrity coefficient</p>
                    <div className="mb-2 flex items-end gap-3">
                      <span className={`text-5xl font-semibold tracking-tight ${results.overall_score > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {(results.overall_score * 100).toFixed(1)}
                      </span>
                      <span className="pb-1 text-[10px] uppercase tracking-[0.35em] text-slate-500">/ 100.0</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${results.overall_score * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${results.overall_score > 0.8 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Anomalies detected</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300">{results.findings.length} hits</span>
                    </div>
                    <div className="scrollbar-hide max-h-[260px] space-y-3 overflow-y-auto pr-1">
                      {results.findings.map((finding, index) => (
                        <motion.div
                          key={finding.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="finding-card rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cobalt/40 hover:bg-cobalt/10"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{finding.type}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">Confidence {finding.confidence.toFixed(3)}</p>
                            </div>
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Case {finding.id}</div>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Box {finding.bbox.join(' • ')}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-cobalt/40 hover:bg-cobalt/15 hover:text-white">
                    <Download className="h-4 w-4" />
                    Generate lab report
                  </button>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
                  <div>
                    <Zap className="mx-auto h-12 w-12 text-cobalt/30" />
                    <p className="mt-4 text-sm font-semibold text-white">No intelligence generated yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Select an image and run the scan to populate the integrity report and anomaly ledger.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </main>

        <footer className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-slate-500 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span>SLEUTH-X1-STATION_A</span>
            <span>Kernel L_V1.0.4</span>
            <span>Encryption AES-256-SHA3</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Fingerprint className="h-3.5 w-3.5 text-cobalt" />
            <span>© 2026 Sleuth Forensics Lab</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, max, tone, unit, precision = 0 }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-500">
        <span>{label}</span>
        <span>
          {value.toFixed(precision)} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default App;
