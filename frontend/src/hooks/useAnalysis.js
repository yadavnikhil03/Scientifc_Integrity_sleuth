import { useState, useCallback } from 'react';

export const useAnalysis = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState(["SYSTEM_READY", "CONNECTING_TO_BACKEND..."]);

  const addLog = useCallback((msg) => {
    setLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleFileChange = useCallback((selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults(null);
      setError(null);
      addLog(`SOURCE_LOADED: ${selectedFile.name}`);
    }
  }, [addLog]);

  const runAnalysis = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    addLog("STARTING_DEEP_SCAN...");

    const formData = new FormData();
    formData.append('file', file);

    try {
      const startTime = performance.now();
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'FORENSIC_CORE_FAULT');
      }
      
      const data = await response.json();
      const endTime = performance.now();
      
      setResults(data);
      addLog(`ANALYSIS_COMPLETE (${(endTime - startTime).toFixed(0)}ms)`);
      addLog(`ANOMALIES_FOUND: ${data.findings.length}`);
    } catch (err) {
      setError(err.message);
      addLog(`CRITICAL_ERROR: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, addLog]);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setIsAnalyzing(false);
    setError(null);
    addLog("STATE_CLEARED");
  }, [addLog]);

  return {
    file,
    preview,
    isAnalyzing,
    results,
    error,
    logs,
    addLog,
    handleFileChange,
    runAnalysis,
    reset
  };
};
