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
  color: Math.random() > 0.5 ? 'rgba(0,219,233,0.14)' : 'rgba(221,183,255,0.12)',
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
  const [logs, setLogs] = useState([
    'BOOT_SEQUENCE_COMPLETE',
    'FORENSIC_CORE_READY',
    'AWAITING_SAMPLE',
  ]);
  const [metrics, setMetrics] = useState({ cpu: 42, gpu: 78, mem: 5.4 });
  const [backendStatus, setBackendStatus] = useState('checking');
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
    const ms = Math.floor(Math.random() * 99);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#000000] text-[#e2e2e2] font-['Space_Grotesk',_sans-serif]">
      {/* Particle Background */}
      <ParticleField />

      {/* Futuristic Grid Background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(0,219,233,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,219,233,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -left-[10%] -top-[20%] z-0 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(0,219,233,0.08)_0%,_rgba(0,0,0,0)_70%)]" />
      <div className="pointer-events-none fixed -right-[10%] -bottom-[20%] z-0 h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,_rgba(221,183,255,0.05)_0%,_rgba(0,0,0,0)_70%)]" />

      {/* ─── Top Navigation Bar ────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-black/60 px-6 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-4">
          <span
            onClick={() => setActiveTab('intake')}
            className="cursor-pointer font-['Space_Grotesk'] text-xl font-bold tracking-tighter text-on-surface hover:text-[#00dbe9] transition-colors"
          >
            SCIENTIFIC_INTEGRITY_SLEUTH
          </span>
          <div className="hidden h-4 w-[1px] bg-white/10 md:block" />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-[#00dbe9] md:inline">
            {file ? `CASE_FILE: ${file.name.toUpperCase().substring(0, 16)}` : 'OP_UNIT_01 // ACTIVE'}
          </span>
        </div>

        {/* Center Links */}
        <div className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-widest md:flex">
          <button
            onClick={() => setActiveTab('intake')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'intake'
                ? 'text-[#00dbe9] border-b border-[#00dbe9] font-bold'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Intake
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'archive'
                ? 'text-[#00dbe9] border-b border-[#00dbe9] font-bold'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'telemetry'
                ? 'text-[#00dbe9] border-b border-[#00dbe9] font-bold'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`transition-colors cursor-crosshair pb-1 ${activeTab === 'developer'
                ? 'text-[#00dbe9] border-b border-[#00dbe9] font-bold'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            About
          </button>
        </div>

        {/* Right side Profile & settings */}
        <div className="flex items-center gap-4 text-[#00dbe9]">
          <span className="material-symbols-outlined hidden cursor-pointer hover:scale-105 transition-transform sm:inline">monitor_heart</span>
          <span
            onClick={() => setActiveTab('developer')}
            className="material-symbols-outlined cursor-pointer hover:scale-105 transition-transform"
          >
            settings
          </span>
          <div
            onClick={() => setActiveTab('developer')}
            className="relative h-8 w-8 overflow-hidden rounded-full border border-[#00dbe9]/30 cursor-pointer hover:border-[#00dbe9] transition-colors"
          >
            <img
              alt="Operator Profile"
              className="h-full w-full object-cover grayscale brightness-90 hover:grayscale-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHEK-b8Mqb6oLfnPcicclnzU_9whw8onn7lKepXTaJoxkM9f8UfKJGIqv6AbpLetbjT9I7LVFfl0uA8bCvPp3PQalkeug0MCyEuljyRIv_cuzasI5fqb18TE_Kk8pTJOuBX7vKnL_QGKG-QlGfU4NxhxwQEXSnjgaqywufmhsmDCGygY6-pFPTkzdrXR3kgkednnWs0OqbVOkfCGupyveZ1wv1MLoNTnw-FaHOnwiRUw-_YE6OCNNCS_LZFE1_FIaSuXPZ4O3xaYP-"
            />
          </div>
        </div>
      </nav>

      {/* ─── Side Navigation Bar ────────────────────── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-20 flex-col border-r border-white/5 bg-black/40 pt-20 transition-all duration-500 hover:w-64 backdrop-blur-2xl group xl:flex">
        <div className="flex flex-1 flex-col justify-center space-y-4">
          <div
            onClick={() => setActiveTab('intake')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'intake'
                ? 'bg-[#00dbe9]/10 text-[#00dbe9] border-l-2 border-[#00dbe9]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">biotech</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Intake</span>
          </div>

          <div
            onClick={() => setActiveTab('intake')}
            className={`flex items-center p-4 cursor-pointer transition-all text-slate-400 hover:bg-white/5 hover:text-white`}
          >
            <span className="material-symbols-outlined">radar</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Scan</span>
          </div>

          <div
            onClick={() => setActiveTab('intake')}
            className="flex items-center p-4 cursor-pointer text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <span className="material-symbols-outlined">query_stats</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Analyze</span>
          </div>

          <div
            onClick={() => setActiveTab('archive')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'archive'
                ? 'bg-[#00dbe9]/10 text-[#00dbe9] border-l-2 border-[#00dbe9]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Archive</span>
          </div>

          <div
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center p-4 cursor-pointer transition-all ${activeTab === 'telemetry'
                ? 'bg-[#00dbe9]/10 text-[#00dbe9] border-l-2 border-[#00dbe9]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="ml-4 font-mono text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Telemetry</span>
          </div>
        </div>

        <div className="p-4 space-y-4 border-t border-white/5 font-mono text-[10px]">
          <div
            onClick={() => setActiveTab('telemetry')}
            className="flex items-center p-2 text-slate-400 hover:text-[#00dbe9] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span className="ml-4 opacity-0 transition-opacity group-hover:opacity-100 uppercase">System_Log</span>
          </div>
          <div
            onClick={() => setActiveTab('developer')}
            className="flex items-center p-2 text-slate-400 hover:text-[#00dbe9] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span className="ml-4 opacity-0 transition-opacity group-hover:opacity-100 uppercase">Developer</span>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Views ─────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'intake' && (
          <motion.main
            key="intake-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex min-h-screen flex-col pt-16 xl:pl-20"
          >
            <div className="grid flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[320px_minmax(0,1fr)_400px]">
              {/* Left Column: Specimen Intake & Telemetry */}
              <section className="flex flex-col gap-4">
                {/* File Dropzone Panel */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden bg-black/40">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[10px] font-bold text-[#00dbe9] uppercase tracking-[0.25em]">SPECIMEN_INTAKE</span>
                    <span className="text-[8px] text-slate-500 font-mono">REF: 7G-01</span>
                  </div>

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
                    className={`scan-dropzone border border-dashed rounded-xl h-44 flex flex-col items-center justify-center space-y-2 hover:border-[#00dbe9]/50 transition-colors cursor-pointer group bg-white/[0.02] ${file ? 'border-[#00dbe9]/40 bg-[#00dbe9]/5' : 'border-white/10'
                      }`}
                  >
                    {!file && (
                      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ border: '1px solid rgba(0,219,233,0.15)', animation: 'ring-pulse 3s ease-out infinite' }} />
                    )}
                    <span className="material-symbols-outlined text-[#00dbe9]/60 group-hover:scale-105 transition-transform text-3xl">upload_file</span>
                    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
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
                    className={`w-full mt-4 py-3 border font-mono text-[10px] uppercase tracking-widest transition-all ${!file || isAnalyzing
                        ? 'border-white/5 bg-white/2 text-slate-600 cursor-not-allowed'
                        : 'border-[#00dbe9]/30 text-[#00dbe9] hover:bg-[#00dbe9]/10 shadow-[0_0_15px_rgba(0,219,233,0.05)] active:scale-95'
                      }`}
                  >
                    {isAnalyzing ? 'RUNNING_FORENSICS...' : 'INITIATE_SPLICING_SCAN'}
                  </button>
                </div>

                {/* File Metadata display */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{file.name}</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'image/*'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-amber-500 text-lg">crisis_alert</span>
                    </div>
                    <button
                      onClick={reset}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#ff6f7e]/20 bg-[#ff6f7e]/5 px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#ff6f7e] hover:bg-[#ff6f7e]/12 transition"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      purged_specimen
                    </button>
                  </motion.div>
                )}

                {/* Left Telemetry Panel */}
                <div className="glass-panel p-6 flex-grow rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[10px] font-bold text-[#00dbe9] uppercase tracking-[0.25em]">LIVE_TELEMETRY</span>
                  </div>
                  <div className="space-y-6 flex-grow flex flex-col justify-center">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">CPU_LOAD</span>
                        <span className="text-[#00dbe9]">{metrics.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#00dbe9] h-full shadow-[0_0_8px_#00dbe9] transition-all duration-1000" style={{ width: `${metrics.cpu}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">GPU_RENDER</span>
                        <span className="text-[#ddb7ff]">{metrics.gpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#ddb7ff] h-full shadow-[0_0_8px_#ddb7ff] transition-all duration-1000" style={{ width: `${metrics.gpu}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">RAM_STRESS</span>
                        <span className="text-slate-200">{metrics.mem.toFixed(2)} GB</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-white h-full shadow-[0_0_8px_white] transition-all duration-1000" style={{ width: `${(metrics.mem / 16) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 mt-6">
                    <div className="flex items-center space-x-2 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-[#00dbe9] rounded-full"></div>
                      <span className="font-mono text-[9px] text-[#00dbe9] uppercase tracking-widest">SYSTEM_NOMINAL</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Center Column: Viewport */}
              <section className="glass-panel relative rounded-2xl border border-white/5 bg-black/40 min-h-[480px] flex flex-col">
                {isAnalyzing && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00dbe9] to-transparent shadow-[0_0_15px_#00dbe9] z-20"
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Viewport Toolbar */}
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-2.5 py-0.5 text-[#00dbe9]">
                      Viewport
                    </span>
                    <span>Ops_Cam_01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="h-3 w-3 text-[#00dbe9]" />
                    <span>inspection grid active</span>
                  </div>
                </div>

                {/* Main Viewport Content */}
                <div className="relative flex flex-1 items-center justify-center p-6 min-h-[380px]">
                  {/* Grid overlays */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,219,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,219,233,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

                  {/* Crosshair Overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
                    <div className="w-48 h-48 border border-white/10 rounded-full flex items-center justify-center">
                      <div className="w-[0.5px] h-full bg-white/20"></div>
                      <div className="h-[0.5px] w-full bg-white/20 absolute"></div>
                      <div className="w-24 h-24 border border-[#00dbe9]/20 rounded-full absolute animate-spin-slow"></div>
                    </div>
                  </div>

                  {/* Corner stats */}
                  <div className="absolute top-4 left-4 font-mono text-[9px] text-[#00dbe9]/60 tracking-wider">
                    MAG: 400x <br /> SPEC: ISO_7G
                  </div>
                  <div className="absolute bottom-4 right-4 font-mono text-[9px] text-slate-600 tracking-wider">
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
                        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#00dbe9]/15 bg-[#00dbe9]/5 shadow-[0_0_50px_rgba(0,219,233,0.05)]">
                          <div className="absolute inset-0 animate-ping rounded-full border border-[#00dbe9]/20" />
                          <Binary className="h-10 w-10 text-[#00dbe9]/30 animate-float" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-['Space_Grotesk']">
                          {typewriterText}
                          {!typewriterDone && <span className="typewriter-cursor h-4 w-1 bg-[#00dbe9] inline-block animate-pulse ml-0.5" />}
                        </h2>
                        <p className="mt-3 text-xs leading-5 text-slate-400">
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
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          <img
                            src={preview}
                            alt="Forensic specimen analysis"
                            className="max-h-[62vh] max-w-full rounded-lg object-contain mix-blend-screen opacity-90 transition-all hover:scale-[1.02] duration-700"
                          />

                          {/* Bounding box annotations */}
                          {results?.findings?.map((finding, idx) => (
                            <motion.div
                              key={finding.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.08 }}
                              className="absolute border border-dashed"
                              style={{
                                borderColor: idx % 2 === 0 ? '#00dbe9' : '#ddb7ff',
                                background: idx % 2 === 0 ? 'rgba(0,219,233,0.08)' : 'rgba(221,183,255,0.08)',
                                left: `${finding.bbox[0] / 5}%`, // Scale mockup pixel coordinates
                                top: `${finding.bbox[1] / 4}%`,
                                width: `${finding.bbox[2] / 5}%`,
                                height: `${finding.bbox[3] / 4}%`,
                                boxShadow: idx % 2 === 0 ? '0 0 10px rgba(0,219,233,0.15)' : '0 0 10px rgba(221,183,255,0.15)',
                              }}
                            >
                              <div
                                className="absolute -top-5 left-0 px-2 py-0.5 text-[8px] font-mono font-bold text-white flex items-center gap-1 whitespace-nowrap rounded-t"
                                style={{
                                  background: idx % 2 === 0 ? 'linear-gradient(90deg, #00dbe9, #004f54)' : 'linear-gradient(90deg, #ddb7ff, #6900b3)'
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
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#00dbe9]" />
                    <span>ENCRYPTED LAB STREAM</span>
                  </div>
                  <span>{preview ? 'SPECIMEN_MOUNTED' : 'NO_SAMPLE_LOADED'}</span>
                </div>
              </section>

              {/* Right Column: Intel Findings Report */}
              <section className="flex flex-col gap-4">
                {/* Score Widget */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 text-center flex flex-col justify-center items-center">
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.3em] mb-4">ANOMALY_DETECTION</span>
                  {results ? (
                    <>
                      <div className="text-5xl font-bold font-['Space_Grotesk'] text-[#00dbe9]">
                        {animatedScore.toFixed(1)}<span className="text-xl opacity-50">%</span>
                      </div>
                      <div className="w-12 h-[1px] bg-white/10 my-4" />
                      <p className="font-mono text-[9px] uppercase tracking-widest leading-relaxed text-[#ff6f7e]/80">
                        {results.overall_score < 0.6
                          ? 'CRITICAL_VARIANCE_DETECTED_IN_SAMPLE_CORE. RECOMMEND_IMMEDIATE_EXPORT.'
                          : results.overall_score < 0.85
                            ? 'MILD_ANOMALIES_DETECTED. CORE_STABILIZATION_PROTOCOL_ARMED.'
                            : 'SPECIMEN_INTEGRITY_INDEX_EXCELLENT. COMPLIES_WITH_STANDARDS.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Zap className="h-10 w-10 text-[#00dbe9]/20 animate-float" />
                      <p className="mt-3 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                        AWAITING_SCAN_EXECUTION
                      </p>
                    </>
                  )}
                </div>

                {/* Findings List Log */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                    <span className="font-mono text-[10px] font-bold text-[#00dbe9] uppercase tracking-[0.25em]">FINDINGS_LOG</span>
                    {results && (
                      <span className="font-mono text-[8px] bg-[#00dbe9]/10 text-[#00dbe9] border border-[#00dbe9]/20 px-2 py-0.5 rounded">
                        {results.findings.length} HITS
                      </span>
                    )}
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-4 max-h-[340px] pr-1">
                    {results ? (
                      results.findings.map((finding, idx) => (
                        <div
                          key={finding.id}
                          className="p-3 border-l border-white/10 hover:border-[#00dbe9] hover:bg-white/[0.02] transition duration-300 cursor-pointer group"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">{finding.type}</span>
                            <span className="text-[#00dbe9] font-mono text-[9px]">{finding.id}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            CONFIDENCE: {finding.confidence.toFixed(3)} // BOX: {finding.bbox.join(' • ')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-6">
                        <div>
                          <Zap className="mx-auto h-8 w-8 text-[#00dbe9]/10 animate-pulse" />
                          <p className="mt-2 text-xs font-semibold text-slate-400">No Intelligence Generated</p>
                          <p className="text-[9px] text-slate-500 mt-1 max-w-[14rem]">Select a microscopy image and run the scanner to populate this integrity ledger.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Report button */}
                <button
                  disabled={!results}
                  className={`w-full py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all relative overflow-hidden group ${results
                      ? 'bg-[#ddb7ff] text-black shadow-[0_0_20px_rgba(221,183,255,0.15)] active:scale-95'
                      : 'bg-white/2 border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  GENERATE_LAB_REPORT
                </button>
              </section>
            </div>

            {/* Scrolling logs at footer */}
            <div className="border-t border-white/5 bg-black/80 px-6 py-2 flex items-center gap-6 font-mono text-[9px] uppercase tracking-wider text-slate-500 overflow-x-auto whitespace-nowrap">
              <span className="text-[#00dbe9]">SYSTEM_LOG:</span>
              {logs.slice(-4).map((log, index) => (
                <span key={`${log}-${index}`} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe9]/40" />
                  <span className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('FAILURE') ? 'text-[#ff6f7e]' : 'text-slate-400'}>{log}</span>
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
              <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/10 pb-6 mb-12 gap-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00dbe9] mb-2 block">DATABASE_ACCESS: AUTHORIZED</span>
                  <h1 className="text-4xl font-bold tracking-tight text-white font-['Space_Grotesk'] uppercase">SPECIMEN_ARCHIVE</h1>
                  <p className="mt-3 text-sm text-slate-400 max-w-lg">Historical repository of scanned biological specimens. All data is cryptographically signed and stored in cold storage.</p>
                </div>

                {/* Filter controls */}
                <div className="flex flex-wrap gap-4 items-end font-mono text-[10px]">
                  <div className="space-y-2">
                    <span className="text-slate-500 uppercase tracking-wider block">Risk Filter</span>
                    <div className="flex gap-2">
                      {['ALL', 'CLEAN', 'ANOMALY', 'TAMPERED'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setArchiveFilter(filter)}
                          className={`glass-panel px-4 py-2 border transition-all ${archiveFilter === filter
                              ? 'border-[#00dbe9] text-[#00dbe9]'
                              : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'
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
                    className="glass-panel group relative overflow-hidden flex flex-col p-6 border border-white/5 bg-black/40 rounded-xl hover:border-[#00dbe9]/60 transition-all duration-500"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 block mb-1">SPECIMEN_ID</span>
                        <span className="font-mono text-xs font-semibold text-white">{specimen.id}</span>
                      </div>
                      <span
                        className={`px-3 py-1 font-bold text-[9px] tracking-[0.15em] border ${specimen.risk === 'TAMPERED'
                            ? 'bg-[#ff6f7e]/10 text-[#ff6f7e] border-[#ff6f7e]/20'
                            : specimen.risk === 'ANOMALY'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                      >
                        {specimen.risk}
                      </span>
                    </div>

                    <div className="relative w-full aspect-video overflow-hidden rounded-lg mb-6 bg-slate-900 border border-white/5">
                      <img
                        alt={specimen.filename}
                        className="w-full h-full object-cover grayscale brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                        src={specimen.imageSrc}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      {specimen.detected && (
                        <div className="absolute top-2 right-2 font-mono text-[9px] text-[#ff6f7e] font-bold animate-pulse bg-black/60 px-2 py-0.5 border border-[#ff6f7e]/30 rounded">
                          {specimen.detected}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end mt-auto">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 block mb-1">SCAN_DATE</span>
                        <span className="font-mono text-[10px] text-slate-300">{specimen.date}</span>
                      </div>
                      <button
                        onClick={() => loadArchiveSpecimen(specimen)}
                        className="h-10 w-10 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#00dbe9] hover:text-black hover:border-[#00dbe9] transition-all"
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
              <section className="py-8 flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 mb-12">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#00dbe9] mb-2 block">DATA_NODE_7</span>
                  <h1 className="text-4xl font-bold tracking-tight text-white font-['Space_Grotesk'] uppercase">SYSTEM_TELEMETRY</h1>
                  <p className="mt-2 font-mono text-[9px] text-slate-500 tracking-[0.4em] uppercase">Status: Operating_Within_Parameters // Latency: 4ms</p>
                </div>
                <div className="text-right mt-6 md:mt-0">
                  <div className="text-[#ddb7ff] font-mono text-[10px] uppercase tracking-widest mb-1">Active_Uptime</div>
                  <div className="text-white font-mono text-2xl font-semibold tracking-wide">{formatUptime(uptimeCounter)}</div>
                </div>
              </section>

              {/* HUD Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                {/* Circle CPU Gauge */}
                <div className="md:col-span-4 glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-4">Core CPU Stress</div>
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle className="text-white/5" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="2"></circle>
                      <circle
                        className="text-[#00dbe9] transition-all duration-1000 ease-in-out"
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
                      <span className="text-3xl font-bold text-white font-mono">{metrics.cpu.toFixed(0)}%</span>
                      <span className="font-mono text-[8px] text-slate-500 uppercase">SYS_LOAD</span>
                    </div>
                  </div>
                </div>

                {/* Neural Sync Bar chart */}
                <div className="md:col-span-8 glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between min-h-[280px]">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-[#ddb7ff] font-['Space_Grotesk'] uppercase tracking-widest">Neural_Sync</h3>
                      <p className="font-mono text-[9px] text-slate-500">Synthetic Intelligence Integrity Coefficient</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00dbe9] font-mono text-lg font-bold">0.9982</div>
                      <div className="text-slate-500 font-mono text-[8px] uppercase">PRECISION_INDEX</div>
                    </div>
                  </div>

                  <div className="h-28 w-full flex items-end gap-1.5 px-2">
                    {neuralBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-grow rounded-t transition-all duration-500 ease-in-out"
                        style={{
                          height: `${h}%`,
                          background: i % 2 === 0 ? 'rgba(0,219,233,0.2)' : 'rgba(221,183,255,0.2)',
                          borderTop: i % 2 === 0 ? '1px solid #00dbe9' : '1px solid #ddb7ff'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Throughput metrics */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between group hover:border-[#00dbe9]/30 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] text-slate-500 uppercase mb-1">Secure_Data_In</div>
                      <div className="text-2xl font-bold font-mono text-white">12.4 GB/s</div>
                    </div>
                    <span className="material-symbols-outlined text-[#00dbe9] text-3xl group-hover:scale-105 transition-transform">cloud_download</span>
                  </div>

                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between group hover:border-[#ddb7ff]/30 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] text-slate-500 uppercase mb-1">Encrypted_Out</div>
                      <div className="text-2xl font-bold font-mono text-white">8.92 GB/s</div>
                    </div>
                    <span className="material-symbols-outlined text-[#ddb7ff] text-3xl group-hover:scale-105 transition-transform">cloud_upload</span>
                  </div>

                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between group hover:border-red-500/30 transition-colors">
                    <div>
                      <div className="font-mono text-[9px] text-slate-500 uppercase mb-1">Packet_Loss</div>
                      <div className="text-2xl font-bold font-mono text-white">0.0004%</div>
                    </div>
                    <span className="material-symbols-outlined text-red-500 text-3xl group-hover:scale-105 transition-transform">error_outline</span>
                  </div>
                </div>

                {/* Blueprint Render stressing */}
                <div className="md:col-span-7 glass-panel min-h-[380px] rounded-xl border border-white/5 bg-black/40 flex flex-col overflow-hidden relative">
                  <div className="absolute top-4 left-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest z-10">VISUAL_ENGINE_STRESS</div>

                  <div className="flex-grow relative bg-black/90">
                    <img
                      alt="futuristic server hud"
                      className="w-full h-full object-cover opacity-15 mix-blend-screen grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxhHGcYgrvQP7ckWHSuEveFl6qYxaJaRVus2TGnDYY1Xa5NhMS3Mn5QeKSXsUEgAyiKku0VKm5gofWylIFsZ8V4lTq_1zhz3A9DlJPD1GV2h1PK5ieHP_T5uiWrcAckKGMVzIsd7DKtbArIh0QuZa725nlyzyLDYP5rQe4cuuTm2EcKTkaxSkdD08vAhk3qoxQR8b9BanijT9sTMYo5de1bZS0ZgK9GPwYl1SKdW9A5_TAK5qrTBQai_1-cLfHW2sq-yy1ajiexUo-"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-[85%] h-[1px] bg-[#00dbe9]/30 absolute top-1/2 -translate-y-1/2"></div>
                      <div className="h-[85%] w-[1px] bg-[#00dbe9]/30 absolute left-1/2 -translate-x-1/2"></div>
                      <div className="border border-[#00dbe9]/40 p-16 rounded-full animate-ping absolute"></div>
                      <div className="border border-[#ddb7ff]/20 p-32 rounded-full animate-pulse absolute"></div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/5 flex justify-between items-center bg-black/80 z-10">
                    <div>
                      <span className="font-mono text-[9px] text-slate-500 uppercase">GPU_STRESS_TEMP</span>
                      <div className="text-[#00dbe9] font-mono text-xl font-bold">54°C</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1.5 h-5 bg-[#00dbe9]"></div>
                      <div className="w-1.5 h-5 bg-[#00dbe9]"></div>
                      <div className="w-1.5 h-5 bg-[#ddb7ff]"></div>
                      <div className="w-1.5 h-5 bg-white/20"></div>
                      <div className="w-1.5 h-5 bg-white/10"></div>
                    </div>
                  </div>
                </div>

                {/* Telemetry scrolling logs */}
                <div className="md:col-span-5 glass-panel h-[380px] rounded-xl border border-white/5 bg-[#0a0a0a]/60 flex flex-col relative overflow-hidden">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center shrink-0">
                    <span className="font-mono text-[9px] text-[#00dbe9] uppercase font-bold">TELEMETRY_LOG</span>
                    <span className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff6f7e]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ddb7ff]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00dbe9]"></div>
                    </span>
                  </div>

                  <div className="flex-grow p-4 font-mono text-[10px] leading-relaxed overflow-y-auto space-y-1.5">
                    {telemetryLogs.map((logMsg, i) => (
                      <div
                        key={i}
                        className={
                          logMsg.includes('SUCCESS') || logMsg.includes('NOMINAL')
                            ? 'text-emerald-400'
                            : logMsg.includes('NEURAL')
                              ? 'text-[#ddb7ff]'
                              : logMsg.includes('LEAKS')
                                ? 'text-[#00dbe9]'
                                : 'text-slate-400'
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
                <div className="lg:col-span-4 glass-panel rounded-xl p-1.5 relative overflow-hidden h-[480px] bg-black/40 border border-[#00dbe9]/10">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00dbe9]/30 pointer-events-none animate-pulse" />
                  <div className="w-full h-full overflow-hidden rounded-lg relative">
                    <img
                      alt="Nikhil Yadav Profile"
                      className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-700"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHEK-b8Mqb6oLfnPcicclnzU_9whw8onn7lKepXTaJoxkM9f8UfKJGIqv6AbpLetbjT9I7LVFfl0uA8bCvPp3PQalkeug0MCyEuljyRIv_cuzasI5fqb18TE_Kk8pTJOuBX7vKnL_QGKG-QlGfU4NxhxwQEXSnjgaqywufmhsmDCGygY6-pFPTkzdrXR3kgkednnWs0OqbVOkfCGupyveZ1wv1MLoNTnw-FaHOnwiRUw-_YE6OCNNCS_LZFE1_FIaSuXPZ4O3xaYP-"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="bg-black/80 backdrop-blur-md p-4 border border-[#00dbe9]/25 rounded-lg">
                      <h1 className="text-2xl font-bold tracking-tight text-[#00dbe9] font-['Space_Grotesk'] mb-1">@yadavnikhil03</h1>
                      <div className="flex items-center gap-2 font-mono text-[9px] text-slate-300 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[12px] text-[#00dbe9]">terminal</span>
                        LEAD_DEVELOPER // SIS_CORE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio info panel */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="glass-panel p-8 rounded-xl border border-white/5 bg-black/40">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="w-12 h-[3px] bg-[#00dbe9] rounded"></span>
                      <h2 className="text-xl font-bold tracking-wider text-[#00dbe9] font-['Space_Grotesk'] uppercase">System Architect</h2>
                    </div>
                    <p className="font-['Space_Grotesk'] text-base text-slate-300 leading-relaxed mb-8">
                      Architecting the <span className="text-[#00dbe9] font-semibold">Scientific Integrity Sleuth</span> (SIS) platform required a fusion of high-performance data processing and forensic-grade UI clarity. My focus lies at the intersection of automated anomaly detection and visual intelligence, ensuring researchers can navigate petabytes of technical metadata with surgical precision.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#0a0a0a]/60 border-l border-[#00dbe9] rounded-r">
                        <div className="font-mono text-[9px] text-[#00dbe9] opacity-60 uppercase mb-1">LATENCY</div>
                        <div className="text-base font-bold font-mono text-white">0.002ms</div>
                      </div>
                      <div className="p-4 bg-[#0a0a0a]/60 border-l border-[#00dbe9] rounded-r">
                        <div className="font-mono text-[9px] text-[#00dbe9] opacity-60 uppercase mb-1">UPTIME</div>
                        <div className="text-base font-bold font-mono text-white">99.99%</div>
                      </div>
                      <div className="p-4 bg-[#0a0a0a]/60 border-l border-[#00dbe9] rounded-r">
                        <div className="font-mono text-[9px] text-[#00dbe9] opacity-60 uppercase mb-1">NODES</div>
                        <div className="text-base font-bold font-mono text-white">1,024</div>
                      </div>
                      <div className="p-4 bg-[#0a0a0a]/60 border-l border-[#00dbe9] rounded-r">
                        <div className="font-mono text-[9px] text-[#00dbe9] opacity-60 uppercase mb-1">ENCRYPTION</div>
                        <div className="text-base font-bold font-mono text-white">AES-256</div>
                      </div>
                    </div>
                  </div>

                  {/* Core contributions & Commit timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-3 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[#00dbe9] text-lg">troubleshoot</span> Core Contributions
                      </h3>
                      <ul className="space-y-3 font-mono text-[10px]">
                        <li className="flex items-start gap-2.5 p-1.5 hover:bg-white/[0.02] rounded transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-[#00dbe9] text-sm mt-0.5">check_circle</span>
                          <span>Developed the SIS Forensic Engine for cross-reference validation.</span>
                        </li>
                        <li className="flex items-start gap-2.5 p-1.5 hover:bg-white/[0.02] rounded transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-[#00dbe9] text-sm mt-0.5">check_circle</span>
                          <span>Implemented Glassmorphic HUD rendering protocol for high-density analysis.</span>
                        </li>
                        <li className="flex items-start gap-2.5 p-1.5 hover:bg-white/[0.02] rounded transition-colors text-slate-400">
                          <span className="material-symbols-outlined text-[#00dbe9] text-sm mt-0.5">check_circle</span>
                          <span>Optimized real-time telemetry pipelines for distributed forensic nodes.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="glass-panel p-6 rounded-xl border border-[#00dbe9]/20 bg-[#00dbe9]/5 flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-3 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[#00dbe9] text-lg">hub</span> GitHub_Global_Status
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="font-mono text-[9px] text-slate-400 uppercase">Commits_LTM</span>
                          <span className="text-2xl font-bold font-mono text-[#00dbe9]">1,482</span>
                        </div>
                        <div className="h-10 flex items-end gap-1.5 px-1 pb-1">
                          <div className="flex-grow h-4 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-7 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-9 bg-[#00dbe9] hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-6 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-10 bg-[#00dbe9] hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-5 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-8 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                          <div className="flex-grow h-3 bg-[#00dbe9]/20 hover:bg-[#00dbe9] rounded-t transition-all"></div>
                        </div>
                        <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase">
                          <span>JAN_2026</span>
                          <span>PRESENT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats & stack footer grid */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-[#00dbe9] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                      <h4 className="font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider">Technical Stack</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Rust', 'TypeScript', 'Python', 'WASM', 'PostgreSQL', 'K8s'].map((tech) => (
                        <span key={tech} className="px-2 py-1 bg-white/5 text-[#00dbe9] font-mono text-[9px] border border-white/5 uppercase rounded">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-[#00dbe9] text-lg">visibility</span>
                      <h4 className="font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider">Focus Areas</h4>
                    </div>
                    <div className="space-y-3 font-mono text-[9px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Data Forensic</span>
                        <span className="w-1/2 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00dbe9] w-[95%]"></div>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">UX Science</span>
                        <span className="w-1/2 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00dbe9] w-[88%]"></div>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Distributed Sys</span>
                        <span className="w-1/2 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00dbe9] w-[92%]"></div>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-[#00dbe9] text-lg">share</span>
                        <h4 className="font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider">Connect</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 font-mono text-[9px] uppercase tracking-widest text-[#00dbe9]">
                        <a className="flex items-center gap-2 text-[#00dbe9] hover:opacity-80 transition-opacity" href="https://github.com/yadavnikhil03">
                          <span className="material-symbols-outlined text-[16px]">code</span>
                          <span>GitHub</span>
                        </a>
                        <a className="flex items-center gap-2 text-[#00dbe9] hover:opacity-80 transition-opacity" href="#">
                          <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                          <span>X / Web</span>
                        </a>
                      </div>
                    </div>
                    <button className="w-full mt-6 py-2 border border-[#00dbe9] text-[#00dbe9] font-mono text-[9px] uppercase tracking-widest hover:bg-[#00dbe9] hover:text-black transition-colors rounded-lg">
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
      <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-12 items-center justify-between border-t border-white/5 bg-black px-6 font-mono text-[9px] uppercase tracking-widest text-slate-500 md:px-12">
        <div>
          ©2026 S.I.SLEUTH // <span className="text-[#00dbe9] font-bold animate-pulse">SYSTEM_STABLE</span> // NO_LEAKS_DETECTED
        </div>
        <div className="hidden gap-6 sm:flex">
          <a className="hover:text-[#00dbe9] transition-colors" href="#">Log_Dump</a>
          <a className="hover:text-[#00dbe9] transition-colors" href="#">Encrypted_Export</a>
          <a className="hover:text-[#00dbe9] transition-colors" href="#">Protocol_v9</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
