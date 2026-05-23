/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ReceiptModal } from './components/ReceiptModal';
import { SplashScreen } from './components/SplashScreen';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/* ─── Particle Background ─────────────────────────── */

const PARTICLE_COUNT = 30;
const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1.2 + Math.random() * 2.5,
  dur: 15 + Math.random() * 18,
  delay: Math.random() * 6,
  color: Math.random() > 0.5 ? 'rgba(56,189,248,0.14)' : 'rgba(129,140,248,0.12)',
}));

const ParticleField = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {particleData.map((p) => (
      <div
        key={p.id}
        className="particle-dot absolute rounded-full"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }}
      />
    ))}
  </div>
);

/* ─── Custom Hooks ────────────────────────────────── */

const useCountUp = (target, duration = 1000) => {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
};

const useTypewriter = (text, speed = 50) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/set-state-in-effect
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
};

/* ─── Main App Component ──────────────────────────── */

const App = () => {
  const [activeTab, setActiveTab] = useState('intake'); // 'intake' | 'archive' | 'telemetry' | 'developer'

  // Intake View States
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [githubData, setGithubData] = useState(null);

  useEffect(() => {
    fetch('https://api.github.com/users/yadavnikhil03')
      .then(res => res.json())
      .then(data => setGithubData(data))
      .catch(err => console.error('Failed to fetch github data', err));
  }, []);
  
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);
  const [logs, setLogs] = useState([
    'BOOT_SEQUENCE_COMPLETE',
    'FORENSIC_CORE_READY',
    'AWAITING_SAMPLE',
  ]);
  const [metrics, setMetrics] = useState({ cpu: 42, gpu: 78, mem: 5.4 });
  const [, setBackendStatus] = useState('checking');
  const [dragActive, setDragActive] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  const fileInputRef = useRef(null);

  // Archive Filter States
  const [archiveFilter, setArchiveFilter] = useState('ALL');

  // Typewriter for empty state
  const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
    'Awaiting specimen injection',
    40
  );

  // CountUp for scan score
  const animatedScore = useCountUp(
    results ? results.overall_score * 100 : 0,
    1400
  );

  // Sync state intervals
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => ({
        cpu: Math.max(10, Math.min(98, prev.cpu + (Math.random() * 8 - 4))),
        gpu: Math.max(10, Math.min(99, prev.gpu + (Math.random() * 6 - 3))),
        mem: Math.max(2, Math.min(16, prev.mem + (Math.random() * 0.12 - 0.06))),
      }));
    }, 2000);

    const clockTimer = setInterval(() => setClock(new Date()), 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clockTimer);
    };
  }, []);

  // Backend Health check
  useEffect(() => {
    const controller = new AbortController();

    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`, {
          signal: controller.signal,
        });
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
    setLogs((prev) => [
      ...prev.slice(-12),
      `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}] ${message}`,
    ]);
  }, []);

  const handleFile = useCallback(
    (selected) => {
      if (!selected) return;
      setFile(selected);
      setResults(null);
      setError(null);
      const previewUrl = URL.createObjectURL(selected);
      setPreview(previewUrl);
      addLog(`SPECIMEN_LOADED: ${selected.name}`);
    },
    [addLog]
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragActive(false);
      const droppedFile = event.dataTransfer.files?.[0];
      if (droppedFile && droppedFile.type.startsWith('image/')) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const runAnalysis = useCallback(async () => {
    if (!file || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setBackendStatus('busy');
    addLog('INITIATING_FORENSIC_PROTOCOL');

    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else if (file.url) {
      try {
        const res = await fetch(file.url);
        const blob = await res.blob();
        formData.append('file', blob, file.name || 'archive.png');
      } catch (e) {
        setError('FAILED_TO_FETCH_ARCHIVE_SPECIMEN');
        setIsAnalyzing(false);
        setBackendStatus('offline');
        return;
      }
    }

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
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : 'ANALYSIS_FAILED';
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setBackendStatus('online');
    addLog('WORKSPACE_PURGED');
  }, [addLog, preview]);

  // Load a specimen from the archive into the intake view
  const loadArchiveSpecimen = (specimen) => {
    setFile({
      name: specimen.filename,
      size: specimen.size,
      type: 'image/jpeg',
    });
    setPreview(specimen.imageSrc);
    setResults(specimen.mockResults);
    setError(null);
    setActiveTab('intake');
    addLog(`MOUNTED_ARCHIVE_SPECIMEN: ${specimen.filename}`);
  };

  // Mock Archive Database
  const archiveSpecimens = [
    {
      id: 'SI-8892-TX',
      filename: 'microscopy_cell_fragmentation.jpg',
      size: 421200,
      risk: 'TAMPERED',
      date: '2026.05.23 // 14:02',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK9wwU3az_dNznscMfFtSguAxu6XZHFs2LZX4T7wTgrY8vYRAfDNg91f2WTeiDYO15KWfyYkpeye3WdgqFpXQIS78f7TifoMy_16owptfZ5VMb_dW2t1p-dqXRsEJPJbandUKuBG1hrPMFhUyKiUEfvplPBUnmF5FzB86i3-rD0sAkswSIpmFMt58u9QOzFkdDZfBocRZzejubtfT9pD6FK0SRASsDkNe4F8QnDE97YEyXhn_fsi_ZuytuFRpz6rjNXeGPejFMpaVU',
      detected: 'DETECTED: SEQ_FRAG',
      mockResults: {
        filename: 'microscopy_cell_fragmentation.jpg',
        filesize: 421200,
        overall_score: 0.28,
        findings: [
          { id: 'ANOMALY_112', type: 'Splicing Artifact', confidence: 0.942, bbox: [40, 80, 160, 160] },
          { id: 'ANOMALY_452', type: 'Clone Signature', confidence: 0.891, bbox: [200, 40, 120, 100] }
        ]
      }
    },
    {
      id: 'SI-4421-LV',
      filename: 'healthy_neural_tissue.jpg',
      size: 512400,
      risk: 'CLEAN',
      date: '2026.05.22 // 09:45',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPuyZM7WQ_HvclzMX7__1PEEIanXB-YMoREHXah3GgXT3c1aS1YQKpbOIun2K3dcpvsP1Xh3Mzn0aOjBPlo1vY1ffS1veANscP8auY7wzRJJCL8N6OPjC6p4rmFjlErcJK234yhhfhAkN6xuk7fDuULWt9pXwmcCX62F6tPTqnTGScyh6J99SlzCeoU55gGDYDxSEmQoKR8gWQoBc2aALYA1yqEzzUKd0Xipu1HsDDbt3QhioNzy1BQoIMZB3ZvnzKa0A7dslkCAHw',
      detected: '',
      mockResults: {
        filename: 'healthy_neural_tissue.jpg',
        filesize: 512400,
        overall_score: 0.98,
        findings: []
      }
    },
    {
      id: 'SI-0092-QR',
      filename: 'crystalline_geometry.jpg',
      size: 321800,
      risk: 'ANOMALY',
      date: '2026.05.20 // 22:18',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWwlSWqGHgH4xZ4y4d-9soKTGgZ96WjhdkLHA4krxbv7vt05LaFn6p9ZuzGTkB6tDFMiugZeW96LiijUrRnpiQlreiAuLd3F9Zz4lPkDhU-h2c2FkqiV05VKB_ct9mhFVWYfn_WaYJ-XcuFBzil0WZ5bTOHLO7oAagyq6-rL2jJBkNV16mgOszq-yOuwQIF7kcbxaMXEsM-MbIa7OtkOUNHhfKaLEM4H6B3CWVZzKZPHmjxKaA2WYCdEDdh5Fu6jUwO4xX_Sc9WR9Q',
      detected: '',
      mockResults: {
        filename: 'crystalline_geometry.jpg',
        filesize: 321800,
        overall_score: 0.74,
        findings: [
          { id: 'ANOMALY_908', type: 'Error Level Discrepancy', confidence: 0.812, bbox: [120, 150, 180, 140] }
        ]
      }
    },
    {
      id: 'SI-5531-OP',
      filename: 'protein_lattice_structures.jpg',
      size: 289300,
      risk: 'CLEAN',
      date: '2026.05.18 // 11:30',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRliSRz4u7YPdye-ct8U5zGBn7pUNQuxpk7tf6TqhVyPoyXxAEFjz5YnyBKepeB-FDqtNbCXHlAU8AaGbaZDEAzkNwgPrUcCV38UYs-wq2FsipbnMrQMbiNHMrm60MJE6K2sAlsWv1gve5jCJitUJwvjeU7ntf7KGcAuylfrqX5KTyWBabRg8WgM-WxsP1pz9JsjVQGpm0pOUa6ydcVQTMkZKuLlI9xBuXivIYO_yepdueWliC3g88bPbJP4DNBG9SMPh91P6dbM0D',
      detected: '',
      mockResults: {
        filename: 'protein_lattice_structures.jpg',
        filesize: 289300,
        overall_score: 0.95,
        findings: []
      }
    },
    {
      id: 'SI-9912-BX',
      filename: 'synthetic_dna_splicing.jpg',
      size: 614000,
      risk: 'TAMPERED',
      date: '2026.05.15 // 16:50',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyeONPrBN3geUf4hhPhmzb44yKUwvmq_SetYrnovOi_AzGKVTIfELKNKtQ2MfoxGVPvqSWQO0wV4QCBS_gfk3i53hz7sZrDBmZZh-8Nu2pnW-Hl069VgGQoEU3RX6xjwpykwwVlW_1m9fG-1vx4gNW3MeL-kgPPcrZ2UW-C9BwnaExLiL7fujqM2pry35vyaWf_y0vQMdUf0-F6JAINkKe-8KE4QzXLQ7x7b1P-HoKRFv7SJHWTNV1RgUld3dC3tTLe7QqIcJAEkcW',
      detected: 'CORRUPTION_DETECTED',
      mockResults: {
        filename: 'synthetic_dna_splicing.jpg',
        filesize: 614000,
        overall_score: 0.12,
        findings: [
          { id: 'ANOMALY_201', type: 'Image Manipulation', confidence: 0.985, bbox: [80, 50, 210, 180] },
          { id: 'ANOMALY_881', type: 'Splicing Artifact', confidence: 0.914, bbox: [30, 200, 100, 80] }
        ]
      }
    },
    {
      id: 'SI-2211-MM',
      filename: 'cellular_membranes_iridescence.jpg',
      size: 442900,
      risk: 'ANOMALY',
      date: '2026.05.11 // 03:12',
      imageSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMAKsRz3QyBD_6-jK9Nf397xZusJxtss0808CVQaJ97kZH8VoJPFz6eBKra_DG5AuoWYm5eZs_mPvLgbnWnqTChy6ojxfKTdG7Tr7h1Q8mz4gfl3jt3V5U4HueTqEfuvIPRGiAPnSpV0RW1wOlNS9oMpzbRHYiKNX1BWfVuWjOhwboDqF9Br0zOmFrlmxxYWyHZocmDi8qgenFkzsDAqVuswT6QW5yRQIOp8jAK-WL2gNj7LYQYkgwOryr9lJfCZyI_HZMW432Pc0-',
      detected: '',
      mockResults: {
        filename: 'cellular_membranes_iridescence.jpg',
        filesize: 442900,
        overall_score: 0.81,
        findings: [
          { id: 'ANOMALY_334', type: 'Clone Detection', confidence: 0.795, bbox: [150, 110, 110, 130] }
        ]
      }
    }
  ];

  // Filtering Archive Specimens
  const filteredArchive = useMemo(() => {
    if (archiveFilter === 'ALL') return archiveSpecimens;
    return archiveSpecimens.filter((specimen) => specimen.risk === archiveFilter);
  }, [archiveFilter]);

  // Telemetry View Simulations
  const [telemetryLogs, setTelemetryLogs] = useState([
    '[08:42:01] INITIALIZING_CORE_SERVICES...',
    '[08:42:02] HANDSHAKE_PROTOCOL_V9: SUCCESS',
    '[08:42:02] MOUNTING_ENCRYPTED_VOLUME: /dev/nvme0n1p2',
    '[08:42:03] AUTHENTICATING_USER: CHIEF_ANALYST',
    '[08:42:04] NEURAL_SYNC_ESTABLISHED',
    '[08:42:05] SCANNING_PERIMETER_FOR_LEAKS...',
    '[08:42:06] NO_LEAKS_DETECTED'
  ]);
  const [uptimeCounter, setUptimeCounter] = useState(76509);
  const [neuralBars, setNeuralBars] = useState([60, 45, 75, 30, 85, 55, 95, 40, 65, 20, 80, 50]);

  // Simulation loop for Telemetry tab
  useEffect(() => {
    if (activeTab !== 'telemetry') return;

    // Increment Uptime
    const uptimeTimer = setInterval(() => {
      setUptimeCounter((prev) => prev + 1);
    }, 1000);

    // Randomize Neural Bars
    const neuralTimer = setInterval(() => {
      setNeuralBars((prev) => prev.map(() => 20 + Math.floor(Math.random() * 75)));
    }, 1500);

    // Simulate Telemetry Logs
    const logMessages = [
      "MONITORING_PACKET_THROUGHPUT...",
      "ENCRYPTION_KEY_ROTATION_PENDING",
      "REDUNDANT_BUFFER_OVERFLOW_CHECK: OK",
      "SYNCING_NODE_7_WITH_CENTRAL_CORE",
      "ANOMALY_DETECTION_ALGORITHM_ACTIVE",
      "UPDATING_HEURISTIC_DATABASE...",
      "RECV_TELEMETRY_DATA_BLOCK_928",
      "EXECUTING_AUTO_RECOVERY_PROTOCOL",
      "STRESS_TEST_COMPLETED: PASS"
    ];

    const logTimer = setInterval(() => {
      const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setTelemetryLogs((prev) => [
        ...prev.slice(-15),
        `[${time}] ${msg}`
      ]);
    }, 2500);

    return () => {
      clearInterval(uptimeTimer);
      clearInterval(neuralTimer);
      clearInterval(logTimer);
    };
  }, [activeTab]);

  // Format Uptime Seconds to HH:MM:SS
  const formatUptime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const ms = (totalSeconds * 137) % 100;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <AnimatePresence>
        {!isAppLoaded && (
          <SplashScreen key="splash" onComplete={() => setIsAppLoaded(true)} />
        )}
      </AnimatePresence>

      <div className="relative min-h-screen overflow-x-hidden theme-bg theme-text">

      
      

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -left-[10%] -top-[20%] z-0 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.08)_0%,_rgba(0,0,0,0)_70%)]" />
      <div className="pointer-events-none fixed -right-[10%] -bottom-[20%] z-0 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.05)_0%,_rgba(0,0,0,0)_70%)]" />

      {/* ─── Top Navigation Bar ────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between theme-border-b theme-bg px-6 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-4">
          <span
            onClick={() => setActiveTab('intake')}
            className="cursor-pointer font-['Space_Grotesk'] text-xl font-bold tracking-tighter text-on-surface hover:theme-text transition-colors"
          >
            SCIENTIFIC_INTEGRITY_SLEUTH
          </span>
          <div className="hidden h-4 w-[1px] theme-bg md:block" />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] theme-text md:inline">
            {file ? `CASE_FILE: ${file.name.toUpperCase().substring(0, 16)}` : 'OP_UNIT_01 // ACTIVE'}
          </span>
        </div>

        {/* Center Links */}
        <div className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-widest md:flex">
          <button
            onClick={() => setActiveTab('intake')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'intake'
                ? 'theme-text border-b border-primary font-bold'
                : 'theme-text-muted hover:theme-text'
              }`}
          >
            Intake
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'archive'
                ? 'theme-text border-b border-primary font-bold'
                : 'theme-text-muted hover:theme-text'
              }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'telemetry'
                ? 'theme-text border-b border-primary font-bold'
                : 'theme-text-muted hover:theme-text'
              }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'developer'
                ? 'theme-text border-b border-primary font-bold'
                : 'theme-text-muted hover:theme-text'
              }`}
          >
            About
          </button>
        </div>

        {/* Right side Profile & settings */}
        <div className="flex items-center gap-4 theme-text">
          <span className="material-symbols-outlined hidden cursor-pointer hover:scale-105 transition-transform sm:inline">monitor_heart</span>
          <span
            onClick={() => setActiveTab('developer')}
            className="material-symbols-outlined cursor-pointer hover:scale-105 transition-transform"
          >
            settings
          </span>
          <div
            onClick={() => setActiveTab('developer')}
            className="relative h-8 w-8 overflow-hidden rounded-full theme-theme-border cursor-pointer hover:border-primary transition-colors"
          >
            <img
              alt="Operator Profile"
              className="h-full w-full object-cover grayscale brightness-90 hover:grayscale-0"
              src={githubData?.avatar_url || "https://github.com/yadavnikhil03.png"}
            />
          </div>
        </div>
      </nav>

      {/* ─── Side Navigation Bar ────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-20 pb-12 flex-col overflow-x-hidden overflow-y-auto theme-border-r theme-bg pt-20 transition-all duration-500 hover:w-64 backdrop-blur-2xl group xl:flex">
        <div className="flex flex-1 flex-col justify-center space-y-4">
          <div
            onClick={() => setActiveTab('intake')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'intake'
                ? 'theme-bg theme-text border-l-2 border-primary'
                : 'theme-text-muted hover:theme-bg hover:theme-text'
              }`}
          >
            <span className="material-symbols-outlined">biotech</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Intake</span>
          </div>

          <div
            onClick={() => setActiveTab('intake')}
            className={`flex items-center p-4 cursor-pointer transition-all theme-text-muted hover:theme-bg hover:theme-text`}
          >
            <span className="material-symbols-outlined">radar</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Scan</span>
          </div>

          <div
            onClick={() => setActiveTab('intake')}
            className="flex items-center p-4 cursor-pointer theme-text-muted hover:theme-bg hover:theme-text"
          >
            <span className="material-symbols-outlined">query_stats</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Analyze</span>
          </div>

          <div
            onClick={() => setActiveTab('archive')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'archive'
                ? 'theme-bg theme-text border-l-2 border-primary'
                : 'theme-text-muted hover:theme-bg hover:theme-text'
              }`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Archive</span>
          </div>

          <div
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'telemetry'
                ? 'theme-bg theme-text border-l-2 border-primary'
                : 'theme-text-muted hover:theme-bg hover:theme-text'
              }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Telemetry</span>
          </div>
        </div>

        <div className="p-4 space-y-4 theme-border-t font-mono text-[10px]">
          <div
            onClick={() => setActiveTab('telemetry')}
            className="flex items-center p-2 theme-text-muted hover:theme-text cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span className="ml-4 opacity-0 transition-opacity group-hover:opacity-100 uppercase">System_Log</span>
          </div>
          <div
            onClick={() => setActiveTab('developer')}
            className="flex items-center p-2 theme-text-muted hover:theme-text cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span className="ml-4 opacity-0 transition-opacity group-hover:opacity-100 uppercase">Developer</span>
          </div>
        </div>
      
        <div className="mt-auto theme-border-t">
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center p-4 cursor-pointer theme-text-muted hover:theme-bg hover:theme-text transition-colors"
          >
            <span className="material-symbols-outlined">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>
        </div>
      </aside>


      {/* ─── Main Content Views ─────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'intake' && (
          <motion.main
            key="intake-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex min-h-screen flex-col pt-16 pb-20 xl:pl-20"
          >
            <div className="grid flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)_400px]">
              {/* Left Column: Specimen Intake & Telemetry */}
              <section className="flex flex-col gap-4">
                {/* File Dropzone Panel */}
                <div className=" p-6 rounded-xl theme-theme-border relative overflow-hidden theme-bg">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[10px] font-bold theme-text uppercase tracking-[0.25em]">SPECIMEN_INTAKE</span>
                    <span className="text-[8px] theme-text-muted font-mono">REF: 7G-01</span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
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
                    className={`scan-dropzone theme-border rounded-xl h-44 flex flex-col items-center justify-center space-y-2 hover:theme-theme-border transition-colors cursor-pointer group theme-bg ${file ? 'theme-theme-border theme-bg' : 'theme-border'
                      }`}
                  >
                    {!file && (
                      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ border: '1px solid rgba(56,189,248,0.15)', animation: 'ring-pulse 3s ease-out infinite' }} />
                    )}
                    <span className="material-symbols-outlined theme-text/60 group-hover:scale-105 transition-transform text-3xl">upload_file</span>
                    <span className="font-mono text-[9px] theme-text-muted uppercase tracking-widest">
                      {file ? 'Sample Loaded' : 'Drag & Drop Specimen'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(event) => handleFile(event.target.files?.[0])}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <button
                    disabled={!file || isAnalyzing}
                    onClick={runAnalysis}
                    className={`w-full mt-4 py-3 theme-border font-mono text-[10px] uppercase tracking-widest transition-all ${(!file || isAnalyzing)
                        ? 'theme-theme-border theme-bg theme-text-muted cursor-not-allowed'
                        : 'theme-theme-border theme-text hover:theme-bg active:scale-95'
                      }`}
                  >
                    {isAnalyzing ? 'RUNNING_FORENSICS...' : 'INITIATE_SPLICING_SCAN'}
                  </button>
                  {error && (
                    <div className="w-full mt-4 p-3 theme-border border-danger/30 bg-danger/10 theme-text text-[10px] font-mono rounded">
                      [ERROR] {error}
                    </div>
                  )}
                </div>

                {/* File Metadata display */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className=" p-4 rounded-xl theme-theme-border theme-bg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold theme-text">{file.name}</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider theme-text-muted">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'image/*'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-amber-500 text-lg">crisis_alert</span>
                    </div>
                    <button
                      onClick={reset}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg theme-border border-danger/20 bg-danger/5 px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] theme-text hover:bg-danger/12 transition"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      purged_specimen
                    </button>
                  </motion.div>
                )}

                {/* Left Telemetry Panel */}
                <div className=" p-6 flex-grow rounded-xl theme-theme-border theme-bg flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[10px] font-bold theme-text uppercase tracking-[0.25em]">LIVE_TELEMETRY</span>
                  </div>
                  <div className="space-y-6 flex-grow flex flex-col justify-center">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="theme-text-muted">CPU_LOAD</span>
                        <span className="theme-text">{metrics.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full theme-bg h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full  transition-all duration-1000" style={{ width: `${metrics.cpu}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="theme-text-muted">GPU_RENDER</span>
                        <span className="text-secondary">{metrics.gpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full theme-bg h-1 rounded-full overflow-hidden">
                        <div className="theme-inverted h-full  transition-all duration-1000" style={{ width: `${metrics.gpu}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="theme-text-muted">RAM_STRESS</span>
                        <span className="theme-text">{metrics.mem.toFixed(2)} GB</span>
                      </div>
                      <div className="w-full theme-bg h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full  transition-all duration-1000" style={{ width: `${(metrics.mem / 16) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 theme-border-t mt-6">
                    <div className="flex items-center space-x-2 ">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="font-mono text-[9px] theme-text uppercase tracking-widest">SYSTEM_NOMINAL</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Center Column: Viewport */}
              <section className=" relative rounded-2xl theme-theme-border theme-bg min-h-[480px] flex flex-col">
                {isAnalyzing && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent  z-20"
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Viewport Toolbar */}
                <div className="flex items-center justify-between theme-border-b px-5 py-3 font-mono text-[9px] uppercase tracking-[0.25em] theme-text-muted">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full theme-border border-primary/20 theme-bg px-2.5 py-0.5 theme-text">
                      Viewport
                    </span>
                    <span>Ops_Cam_01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="h-3 w-3 theme-text" />
                    <span>inspection grid active</span>
                  </div>
                </div>

                {/* Main Viewport Content */}
                <div className="relative flex flex-1 items-center justify-center p-6 min-h-[380px]">
                  {/* Grid overlays */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

                  {/* Crosshair Overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
                    <div className="w-48 h-48 theme-theme-border rounded-full flex items-center justify-center">
                      <div className="w-[0.5px] h-full theme-bg0"></div>
                      <div className="h-[0.5px] w-full theme-bg0 absolute"></div>
                      <div className="w-24 h-24 theme-border border-primary/20 rounded-full absolute animate-spin-slow"></div>
                    </div>
                  </div>

                  {/* Corner stats */}
                  <div className="absolute top-4 left-4 font-mono text-[9px] theme-text/60 tracking-wider">
                    MAG: 400x <br /> SPEC: ISO_7G
                  </div>
                  <div className="absolute bottom-4 right-4 font-mono text-[9px] theme-text-muted tracking-wider">
                    FPS: 60.0 <br /> {clock.toLocaleTimeString()}
                  </div>

                  <AnimatePresence mode="wait">
                    {!preview ? (
                      <motion.div
                        key="empty-stage"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 flex max-w-md flex-col items-center text-center p-6"
                      >
                        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full theme-border border-primary/15 theme-bg ">
                          <div className="absolute inset-0 animate-ping rounded-full theme-border border-primary/20" />
                          <Binary className="h-10 w-10 theme-text/30 animate-float" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight theme-text uppercase font-['Space_Grotesk']">
                          {typewriterText}
                          {!typewriterDone && <span className="typewriter-cursor h-4 w-1 bg-primary inline-block  ml-0.5" />}
                        </h2>
                        <p className="mt-3 text-xs leading-5 theme-text-muted">
                          Load a biological microscopy image or select one from the Archive to initiate molecular splicing analysis.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview-stage"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 max-w-full"
                      >
                        <div className="relative rounded-xl overflow-hidden theme-theme-border theme-bg p-1.5 ">
                          <img
                            src={preview}
                            alt="Forensic specimen analysis"
                            className="max-h-[62vh] max-w-full rounded-lg object-contain transition-all hover:scale-[1.02] duration-700"
                          />

                          {/* Bounding box annotations */}
                          {results?.findings?.map((finding, _idx) => (
                            <motion.div
                              key={finding.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: _idx * 0.08 }}
                              className="absolute theme-border "
                              style={{
                                borderColor: _idx % 2 === 0 ? '#38BDF8' : '#818CF8',
                                background: _idx % 2 === 0 ? 'rgba(56,189,248,0.08)' : 'rgba(129,140,248,0.08)',
                                left: `${finding.bbox[0] / 5}%`, // Scale mockup pixel coordinates
                                top: `${finding.bbox[1] / 4}%`,
                                width: `${finding.bbox[2] / 5}%`,
                                height: `${finding.bbox[3] / 4}%`,
                                boxShadow: _idx % 2 === 0 ? '0 0 10px rgba(56,189,248,0.15)' : '0 0 10px rgba(129,140,248,0.15)',
                              }}
                            >
                              <div
                                className="absolute -top-5 left-0 px-2 py-0.5 text-[8px] font-mono font-bold theme-text flex items-center gap-1 whitespace-nowrap rounded-t"
                                style={{
                                  background: _idx % 2 === 0 ? 'linear-gradient(90deg, #38BDF8, #004f54)' : 'linear-gradient(90deg, #818CF8, #6900b3)'
                                }}
                              >
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

                {/* Viewport Footer */}
                <div className="flex items-center justify-between theme-border-t px-5 py-3 font-mono text-[9px] uppercase tracking-[0.25em] theme-text-muted">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 theme-text" />
                    <span>ENCRYPTED LAB STREAM</span>
                  </div>
                  <span>{preview ? 'SPECIMEN_MOUNTED' : 'NO_SAMPLE_LOADED'}</span>
                </div>
              </section>

              {/* Right Column: Intel Findings Report */}
              <section className="flex flex-col gap-4">
                {/* Score Widget */}
                <div className=" p-6 rounded-xl theme-theme-border theme-bg text-center flex flex-col justify-center items-center">
                  <span className="font-mono text-[10px] theme-text-muted uppercase tracking-[0.3em] mb-4">ANOMALY_DETECTION</span>
                  {results ? (
                    <>
                      <div className="text-5xl font-bold font-['Space_Grotesk'] theme-text">
                        {animatedScore.toFixed(1)}<span className="text-xl opacity-50">%</span>
                      </div>
                      <div className="w-12 h-[1px] theme-bg my-4" />
                      <p className="font-mono text-[9px] uppercase tracking-widest leading-relaxed theme-text/80">
                        {results.overall_score < 0.6
                          ? 'CRITICAL_VARIANCE_DETECTED_IN_SAMPLE_CORE. RECOMMEND_IMMEDIATE_EXPORT.'
                          : results.overall_score < 0.85
                            ? 'MILD_ANOMALIES_DETECTED. CORE_STABILIZATION_PROTOCOL_ARMED.'
                            : 'SPECIMEN_INTEGRITY_INDEX_EXCELLENT. COMPLIES_WITH_STANDARDS.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Zap className="h-10 w-10 theme-text/20 animate-float" />
                      <p className="mt-3 font-mono text-[9px] theme-text-muted uppercase tracking-widest">
                        AWAITING_SCAN_EXECUTION
                      </p>
                    </>
                  )}
                </div>

                {/* Findings List Log */}
                <div className=" p-6 rounded-xl theme-theme-border theme-bg flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-2 theme-border-b">
                    <span className="font-mono text-[10px] font-bold theme-text uppercase tracking-[0.25em]">FINDINGS_LOG</span>
                    {results && (
                      <span className="font-mono text-[8px] theme-bg theme-text theme-border border-primary/20 px-2 py-0.5 rounded">
                        {results.findings.length} HITS
                      </span>
                    )}
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-4 max-h-[340px] pr-1">
                    {results ? (
                      results.findings.map((finding, _idx) => (
                        <div
                          key={finding.id}
                          className="p-3 border-l theme-theme-border hover:border-primary hover:theme-bg transition duration-300 cursor-pointer group"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-wider theme-text">{finding.type}</span>
                            <span className="theme-text font-mono text-[9px]">{finding.id}</span>
                          </div>
                          <p className="text-[9px] theme-text-muted font-mono">
                            CONFIDENCE: {finding.confidence.toFixed(3)} // BOX: {finding.bbox.join(' • ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-6">
                        <div>
                          <Zap className="mx-auto h-8 w-8 theme-text/10 " />
                          <p className="mt-2 text-xs font-semibold theme-text-muted">No Intelligence Generated</p>
                          <p className="text-[9px] theme-text-muted mt-1 max-w-[14rem]">Select a microscopy image and run the scanner to populate this integrity ledger.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Report button */}
                <button
                  disabled={!results}
                  onClick={() => setShowReceipt(true)}
                  className={`w-full py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden group ${results
                      ? 'theme-inverted theme-inverted  active:scale-95'
                      : 'theme-bg theme-theme-border theme-text-muted cursor-not-allowed'
                    }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  GENERATE_LAB_REPORT
                </button>
              </section>
            </div>

            {/* Scrolling logs at footer */}
            <div className="theme-border-t theme-bg theme-border-t px-6 py-2 flex items-center gap-6 font-mono text-[9px] uppercase tracking-wider theme-text-muted overflow-x-auto whitespace-nowrap">
              <span className="theme-text">SYSTEM_LOG:</span>
              {logs.slice(-4).map((log, index) => (
                <span key={`${log}-${index}`} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <span className={log.includes('SUCCESS') ? 'theme-text' : log.includes('FAILURE') ? 'theme-text' : 'theme-text-muted'}>{log}</span>
                </span>
              ))}
            </div>
          </motion.main>
        )}

        {/* ─── Archive Tab View ──────────────────────── */}
        {activeTab === 'archive' && (
          <motion.main
            key="archive-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 min-h-screen pt-24 pb-20 px-6 md:px-12 xl:pl-32"
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between theme-border-b pb-6 mb-12 gap-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] theme-text mb-2 block">DATABASE_ACCESS: AUTHORIZED</span>
                  <h1 className="text-4xl font-bold tracking-tight theme-text font-['Space_Grotesk'] uppercase">SPECIMEN_ARCHIVE</h1>
                  <p className="mt-3 text-sm theme-text-muted max-w-lg">Historical repository of scanned biological specimens. All data is cryptographically signed and stored in cold storage.</p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap gap-4 items-end font-mono text-[10px]">
                  <div className="space-y-2">
                    <span className="theme-text-muted uppercase tracking-wider block">Risk Filter</span>
                    <div className="flex gap-2">
                      {['ALL', 'CLEAN', 'ANOMALY', 'TAMPERED'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setArchiveFilter(filter)}
                          className={` px-4 py-2 theme-border transition-all ${archiveFilter === filter
                              ? 'border-primary theme-text'
                              : 'theme-theme-border theme-text-muted hover:theme-bg hover:theme-text'
                            }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specimen Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArchive.map((specimen, idx) => (
                  <div
                    key={specimen.id}
                    className=" group relative overflow-hidden flex flex-col p-6 theme-theme-border theme-bg rounded-xl hover:border-primary/60 transition-all duration-500"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-widest theme-text-muted block mb-1">SPECIMEN_ID</span>
                        <span className="font-mono text-xs font-semibold theme-text">{specimen.id}</span>
                      </div>
                      <span
                        className={`px-3 py-1 font-bold text-[9px] tracking-[0.15em] theme-border ${specimen.risk === 'TAMPERED'
                            ? 'bg-danger/10 theme-text border-danger/20'
                            : specimen.risk === 'ANOMALY'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                      >
                        {specimen.risk}
                      </span>
                    </div>

                    <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-6 bg-slate-900 theme-border">
                      <img
                        alt={specimen.filename}
                        className="w-full h-full object-cover grayscale brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                        src={specimen.imageSrc}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      {specimen.detected && (
                        <div className="absolute top-2 right-2 font-mono text-[9px] theme-text font-bold  theme-bg px-2 py-0.5 theme-border border-danger/30 rounded">
                          {specimen.detected}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-auto">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-widest theme-text-muted block mb-1">SCAN_DATE</span>
                        <span className="font-mono text-[10px] theme-text">{specimen.date}</span>
                      </div>
                      <button
                        onClick={() => loadArchiveSpecimen(specimen)}
                        className="h-10 w-10 theme-theme-border rounded-lg flex items-center justify-center hover:bg-primary hover:theme-inverted hover:border-primary transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">north_east</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.main>
        )}

        {/* ─── Telemetry Tab View ────────────────────── */}
        {activeTab === 'telemetry' && (
          <motion.main
            key="telemetry-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 min-h-screen pt-24 pb-20 px-6 md:px-12 xl:pl-32"
          >
            <div className="max-w-[1400px] mx-auto">
              <section className="py-8 flex flex-col md:flex-row justify-between items-end theme-border-b pb-6 mb-12">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] theme-text mb-2 block">DATA_NODE_7</span>
                  <h1 className="text-4xl font-bold tracking-tight theme-text font-['Space_Grotesk'] uppercase">SYSTEM_TELEMETRY</h1>
                  <p className="mt-2 font-mono text-[9px] theme-text-muted tracking-[0.4em] uppercase">Status: Operating_Within_Parameters // Latency: 4ms</p>
                </div>
                <div className="text-right mt-6 md:mt-0">
                  <div className="text-secondary font-mono text-[10px] uppercase tracking-widest mb-1">Active_Uptime</div>
                  <div className="theme-text font-mono text-2xl font-semibold tracking-wide">{formatUptime(uptimeCounter)}</div>
                </div>
              </section>

              {/* HUD Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                {/* Circle CPU Gauge */}
                <div className="md:col-span-4  p-6 rounded-xl theme-theme-border theme-bg flex flex-col items-center justify-center min-h-[280px]">
                  <div className="font-mono text-[9px] theme-text-muted uppercase tracking-widest mb-4">Core CPU Stress</div>
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="theme-text/5" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="2"></circle>
                      <circle
                        className="theme-text transition-all duration-1000 ease-in-out"
                        cx="80"
                        cy="80"
                        fill="transparent"
                        r="70"
                        stroke="currentColor"
                        strokeDasharray="440"
                        strokeDashoffset={440 - (metrics.cpu / 100) * 440}
                        strokeWidth="4"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold theme-text font-mono">{metrics.cpu.toFixed(0)}%</span>
                      <span className="font-mono text-[8px] theme-text-muted uppercase">SYS_LOAD</span>
                    </div>
                  </div>
                </div>

                {/* Neural Sync Bar chart */}
                <div className="md:col-span-8  p-6 rounded-xl theme-theme-border theme-bg flex flex-col justify-between min-h-[280px]">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-secondary font-['Space_Grotesk'] uppercase tracking-widest">Neural_Sync</h3>
                      <p className="font-mono text-[9px] theme-text-muted">Synthetic Intelligence Integrity Coefficient</p>
                    </div>
                    <div className="text-right">
                      <div className="theme-text font-mono text-lg font-bold">0.9982</div>
                      <div className="theme-text-muted font-mono text-[8px] uppercase">PRECISION_INDEX</div>
                    </div>
                  </div>

                  <div className="h-28 w-full flex items-end gap-1.5 px-2">
                    {neuralBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-grow rounded-t transition-all duration-500 ease-in-out"
                        style={{
                          height: `${h}%`,
                          background: i % 2 === 0 ? 'rgba(56,189,248,0.2)' : 'rgba(129,140,248,0.2)',
                          borderTop: i % 2 === 0 ? '1px solid #38BDF8' : '1px solid #818CF8'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Throughput metrics */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className=" p-6 rounded-xl theme-theme-border theme-bg flex items-center justify-between group hover:theme-theme-border transition-colors">
                    <div>
                      <div className="font-mono text-[9px] theme-text-muted uppercase mb-1">Secure_Data_In</div>
                      <div className="text-2xl font-bold font-mono theme-text">12.4 GB/s</div>
                    </div>
                    <span className="material-symbols-outlined theme-text text-3xl group-hover:scale-105 transition-transform">cloud_download</span>
                  </div>

                  <div className=" p-6 rounded-xl theme-theme-border theme-bg flex items-center justify-between group hover:border-secondary/30 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] theme-text-muted uppercase mb-1">Encrypted_Out</div>
                      <div className="text-2xl font-bold font-mono theme-text">8.92 GB/s</div>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-3xl group-hover:scale-105 transition-transform">cloud_upload</span>
                  </div>

                  <div className=" p-6 rounded-xl theme-theme-border theme-bg flex items-center justify-between group hover:border-red-500/30 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] theme-text-muted uppercase mb-1">Packet_Loss</div>
                      <div className="text-2xl font-bold font-mono theme-text">0.0004%</div>
                    </div>
                    <span className="material-symbols-outlined theme-text text-3xl group-hover:scale-105 transition-transform">error_outline</span>
                  </div>
                </div>

                {/* Blueprint Render stressing */}
                <div className="md:col-span-7  min-h-[380px] rounded-xl theme-theme-border theme-bg flex flex-col overflow-hidden relative">
                  <div className="absolute top-4 left-4 font-mono text-[9px] theme-text-muted uppercase tracking-widest z-10">VISUAL_ENGINE_STRESS</div>

                  <div className="flex-grow relative bg-black/90">
                    <img
                      alt="futuristic server hud"
                      className="w-full h-full object-cover opacity-15 mix-blend-screen grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxhHGcYgrvQP7ckWHSuEveFl6qYxaJaRVus2TGnDYY1Xa5NhMS3Mn5QeKSXsUEgAyiKku0VKm5gofWylIFsZ8V4lTq_1zhz3A9DlJPD1GV2h1PK5ieHP_T5uiWrcAckKGMVzIsd7DKtbArIh0QuZa725nlyzyLDYP5rQe4cuuTm2EcKTkaxSkdD08vAhk3qoxQR8b9BanijT9sTMYo5de1bZS0ZgK9GPwYl1SKdW9A5_TAK5qrTBQai_1-cLfHW2sq-yy1ajiexUo-"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-[85%] h-[1px] bg-primary/30 absolute top-1/2 -translate-y-1/2"></div>
                      <div className="h-[85%] w-[1px] bg-primary/30 absolute left-1/2 -translate-x-1/2"></div>
                      <div className="theme-theme-border p-16 rounded-full animate-ping absolute"></div>
                      <div className="theme-border border-secondary/20 p-32 rounded-full  absolute"></div>
                    </div>
                  </div>

                  <div className="p-6 theme-border-t flex justify-between items-center theme-bg theme-border-t z-10">
                    <div>
                      <span className="font-mono text-[9px] theme-text-muted uppercase">GPU_STRESS_TEMP</span>
                      <div className="theme-text font-mono text-xl font-bold">54°C</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1.5 h-5 bg-primary"></div>
                      <div className="w-1.5 h-5 bg-primary"></div>
                      <div className="w-1.5 h-5 theme-inverted"></div>
                      <div className="w-1.5 h-5 theme-bg0"></div>
                      <div className="w-1.5 h-5 theme-bg"></div>
                    </div>
                  </div>
                </div>

                {/* Telemetry scrolling logs */}
                <div className="md:col-span-5  h-[380px] rounded-xl theme-theme-border bg-bg-app/60 flex flex-col relative overflow-hidden">
                  <div className="theme-bg px-4 py-2 theme-border-b flex justify-between items-center shrink-0">
                    <span className="font-mono text-[9px] theme-text uppercase font-bold">TELEMETRY_LOG</span>
                    <span className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-danger"></div>
                      <div className="w-1.5 h-1.5 rounded-full theme-inverted"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    </span>
                  </div>

                  <div className="flex-grow p-4 font-mono text-[10px] leading-relaxed overflow-y-auto space-y-1.5">
                    {telemetryLogs.map((logMsg, i) => (
                      <div
                        key={i}
                        className={
                          logMsg.includes('SUCCESS') || logMsg.includes('NOMINAL')
                            ? 'theme-text'
                            : logMsg.includes('NEURAL')
                              ? 'text-secondary'
                              : logMsg.includes('LEAKS')
                                ? 'theme-text'
                                : 'theme-text-muted'
                        }
                      >
                        {logMsg}
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.main>
        )}

        {/* ─── Developer / About Tab View ─────────────── */}
        {activeTab === 'developer' && (
          <motion.main
            key="developer-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 min-h-screen pt-24 pb-20 px-6 md:px-12 xl:pl-32"
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Profile panel */}
                <div className="lg:col-span-4  rounded-xl p-1.5 relative overflow-hidden h-[480px] theme-bg theme-border border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 pointer-events-none " />
                  <div className="w-full h-full overflow-hidden rounded-lg relative">
                    <img
                      alt="Nikhil Yadav Profile"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      src={githubData?.avatar_url || "https://github.com/yadavnikhil03.png"}
                    />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="theme-bg theme-border p-4">
                      <h1 className="text-2xl font-bold tracking-tight theme-text font-['Space_Grotesk'] mb-1">@yadavnikhil03</h1>
                      <div className="flex items-center gap-2 font-mono text-[9px] theme-text uppercase tracking-widest">
                        
                        LEAD_DEVELOPER // SIS_CORE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio info panel */}
                <div className="lg:col-span-8 space-y-6">
                  <div className=" p-8 rounded-xl theme-theme-border theme-bg">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="w-12 h-[3px] bg-primary rounded"></span>
                      <h2 className="text-xl font-bold tracking-wider theme-text font-['Space_Grotesk'] uppercase">System Architect</h2>
                    </div>
                    <p className="font-mono text-xs theme-text leading-relaxed mb-8">
                      The <span className="font-bold">Scientific Integrity Sleuth</span> (SIS) is a high-throughput, latency-optimized forensic data processing engine. Architected for strict analytical rigor, the system ingests raw graphical metadata and leverages deterministic anomaly detection algorithms to isolate synthetic manipulations in academic assets. The architecture emphasizes 0-trust verification, immutable event logging, and rapid forensic data extraction for institutional compliance.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-bg-app/60 border-l border-primary rounded-r">
                        <div className="font-mono text-[9px] theme-text opacity-60 uppercase mb-1">LATENCY</div>
                        <div className="text-base font-bold font-mono theme-text">0.002ms</div>
                      </div>
                      <div className="p-4 bg-bg-app/60 border-l border-primary rounded-r">
                        <div className="font-mono text-[9px] theme-text opacity-60 uppercase mb-1">UPTIME</div>
                        <div className="text-base font-bold font-mono theme-text">99.99%</div>
                      </div>
                      <div className="p-4 bg-bg-app/60 border-l border-primary rounded-r">
                        <div className="font-mono text-[9px] theme-text opacity-60 uppercase mb-1">NODES</div>
                        <div className="text-base font-bold font-mono theme-text">1,024</div>
                      </div>
                      <div className="p-4 bg-bg-app/60 border-l border-primary rounded-r">
                        <div className="font-mono text-[9px] theme-text opacity-60 uppercase mb-1">ENCRYPTION</div>
                        <div className="text-base font-bold font-mono theme-text">AES-256</div>
                      </div>
                    </div>
                  </div>

                  {/* Core contributions & Commit timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className=" p-6 rounded-xl theme-theme-border theme-bg">
                      <h3 className="text-sm font-bold theme-text mb-4 uppercase tracking-wide">
                        [ SYSTEM_ARCHITECTURE ]
                      </h3>
                      <ul className="space-y-3 font-mono text-[10px] theme-text-muted">
                        <li className="flex items-start gap-2.5 p-1.5 transition-colors">
                          <span className="font-bold">&gt;</span>
                          <span>Engineered the deterministic Forensic Parsing Engine for structural metadata cross-referencing.</span>
                        </li>
                        <li className="flex items-start gap-2.5 p-1.5 transition-colors">
                          <span className="font-bold">&gt;</span>
                          <span>Implemented stark, low-latency, strictly-monospace rendering interfaces for brutalist data presentation.</span>
                        </li>
                        <li className="flex items-start gap-2.5 p-1.5 transition-colors">
                          <span className="font-bold">&gt;</span>
                          <span>Optimized RESTful telemetry pipelines for sub-millisecond anomaly detection and PDF report generation.</span>
                        </li>
                      </ul>
                    </div>

                    <div className=" p-6 rounded-xl theme-border border-primary/20 theme-bg flex flex-col justify-between">
                      <h3 className="text-sm font-bold theme-text mb-4 uppercase tracking-wide">
                        [ GITHUB_GLOBAL_STATUS ]
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="font-mono text-[9px] theme-text-muted uppercase">Public_Repos</span>
                          <span className="text-2xl font-bold font-mono theme-text">{githubData ? githubData.public_repos : '...'}</span>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="font-mono text-[9px] theme-text-muted uppercase">Followers</span>
                          <span className="text-2xl font-bold font-mono theme-text">{githubData ? githubData.followers : '...'}</span>
                        </div>
                        <div className="h-10 flex items-end gap-1.5 px-1 pb-1">
                          <div className="flex-grow h-4 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-7 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-9 bg-primary hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-6 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-10 bg-primary hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-5 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-8 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                          <div className="flex-grow h-3 bg-primary/20 hover:bg-primary rounded-t transition-all"></div>
                        </div>
                        <div className="flex justify-between font-mono text-[8px] theme-text-muted uppercase">
                          <span>JAN_2026</span>
                          <span>PRESENT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats & stack footer grid */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className=" p-6 rounded-xl theme-theme-border theme-bg">
                    <div className="flex items-center gap-3 mb-4">
                      
                      <h4 className="font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider">Technical Stack</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Rust', 'TypeScript', 'Python', 'WASM', 'PostgreSQL', 'K8s'].map((tech) => (
                        <span key={tech} className="px-2 py-1 theme-bg theme-text font-mono text-[9px] theme-theme-border uppercase rounded">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div className=" p-6 rounded-xl theme-theme-border theme-bg">
                    <div className="flex items-center gap-3 mb-4">
                      
                      <h4 className="font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider">Focus Areas</h4>
                    </div>
                    <div className="space-y-3 font-mono text-[9px]">
                      <div className="flex justify-between items-center">
                        <span className="theme-text-muted">Data Forensic</span>
                        <span className="w-1/2 h-1 theme-bg rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[95%]"></div>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="theme-text-muted">UX Science</span>
                        <span className="w-1/2 h-1 theme-bg rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[88%]"></div>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="theme-text-muted">Distributed Sys</span>
                        <span className="w-1/2 h-1 theme-bg rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[92%]"></div>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className=" p-6 rounded-xl theme-theme-border theme-bg flex flex-col justify-between">
                    <div>
                      <h4 className="font-mono text-sm font-bold uppercase tracking-wider mb-4">[ REFERENCES_&_DOCS ]</h4>
                      <div className="grid grid-cols-1 gap-2 font-mono text-[9px] uppercase tracking-widest theme-text">
                        <a className="flex items-center gap-2 hover:theme-inverted transition-colors border-b border-dashed border-transparent hover:border-black dark:hover:border-white p-1" href="https://github.com/yadavnikhil03/Scientifc_Integrity_sleuth" target="_blank">
                          <span>[↗] SIS_Source_Repository</span>
                        </a>
                        <a className="flex items-center gap-2 hover:theme-inverted transition-colors border-b border-dashed border-transparent hover:border-black dark:hover:border-white p-1" href="https://github.com/yadavnikhil03" target="_blank">
                          <span>[↗] Author_Profile</span>
                        </a>
                        <a className="flex items-center gap-2 hover:theme-inverted transition-colors border-b border-dashed border-transparent hover:border-black dark:hover:border-white p-1" href="#" onClick={(e) => e.preventDefault()}>
                          <span>[↗] Technical_Whitepaper.pdf</span>
                        </a>
                        <a className="flex items-center gap-2 hover:theme-inverted transition-colors border-b border-dashed border-transparent hover:border-black dark:hover:border-white p-1" href="#" onClick={(e) => e.preventDefault()}>
                          <span>[↗] Forensic_Compliance_Specs</span>
                        </a>
                      </div>
                    </div>
                    <button className="w-full mt-6 py-2 theme-border border-primary theme-text font-mono text-[9px] uppercase tracking-widest hover:bg-primary hover:theme-inverted transition-colors rounded-lg">
                      ESTABLISH_COMM_LINK
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ─── Global Sticky Footer ───────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-12 items-center justify-between theme-border-t theme-bg px-6 font-mono text-[9px] uppercase tracking-widest theme-text-muted md:px-12">
        <div>
          ©2026 S.I.SLEUTH // <span className="theme-text font-bold ">SYSTEM_STABLE</span> // NO_LEAKS_DETECTED
        </div>
        <div className="hidden gap-6 sm:flex">
          <a className="hover:theme-text transition-colors" href="#">Log_Dump</a>
          <a className="hover:theme-text transition-colors" href="#">Encrypted_Export</a>
          <a className="hover:theme-text transition-colors" href="#">Protocol_v9</a>
        </div>
      </footer>
      {showReceipt && <ReceiptModal results={results} file={file} onClose={() => setShowReceipt(false)} />}
      </div>
    </>
  );
};

export default App;
