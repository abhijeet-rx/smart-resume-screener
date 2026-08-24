import { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle2, Loader2, Sparkles, Globe, Briefcase, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];

export default function ResumeUploader({ targetJobId, onSelectJob, onScreeningComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close job dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available job roles
  const fetchJobs = async () => {
    try {
      const data = await api.listJobs(0, 100);
      const list = data.jobs || [];
      setJobs(list);
      // Auto-select first job if none is selected
      if (!targetJobId && list.length > 0 && onSelectJob) {
        onSelectJob(list[0].id);
      }
    } catch (err) {
      console.error('Failed to list jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleJobSelect = (jobId) => {
    setIsJobDropdownOpen(false);
    if (onSelectJob) {
      onSelectJob(jobId);
    }
  };

  const selectedJob = jobs.find((j) => j.id === targetJobId);
  const targetTitle = selectedJob ? selectedJob.title : '';

  const validateAndAddFiles = (fileList) => {
    const valid = [];
    const errs = [];

    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        errs.push(`${file.name}: Unsupported type '${ext}'. Allowed: .pdf, .docx, .txt`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errs.push(`${file.name}: Exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
        return;
      }
      if (file.size === 0) {
        errs.push(`${file.name}: File is empty (0 bytes)`);
        return;
      }
      valid.push(file);
    });

    setFileErrors(errs);
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndScreen = async () => {
    if (!targetJobId) {
      alert('Please select a target job role first.');
      return;
    }
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setBatchResult(null);

    try {
      const res = await api.screenResumes(targetJobId, selectedFiles);
      setBatchResult(res);
      setSelectedFiles([]);
      if (onScreeningComplete) {
        onScreeningComplete(res);
      }
    } catch (err) {
      setFileErrors([err.message || 'Batch screening failed']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="batch-screener-section" className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header Bar with Target Job Selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[rgba(164,132,215,0.15)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-xl text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#7b39fc]" /> Batch Resume Screening <em>Hub</em>
            </h3>

            {/* Target Job Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-inter font-medium transition-all shadow-[0_2px_10px_rgba(123,57,252,0.15)] cursor-pointer group ${
                  targetJobId
                    ? 'bg-[#261c42] hover:bg-[#322557] border border-[#7b39fc]/40 hover:border-[#7b39fc] text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 animate-pulse'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="max-w-[200px] truncate">
                  {targetTitle ? `Target Job: ${targetTitle}` : 'Select Target Job Role'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 group-hover:text-white transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Animated Dropdown Menu */}
              <AnimatePresence>
                {isJobDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute left-0 top-full mt-2 w-72 bg-[#160d2e]/95 backdrop-blur-xl border border-[rgba(164,132,215,0.3)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 p-2 overflow-hidden"
                  >
                    <div className="px-3 py-2 text-[10px] font-manrope font-semibold uppercase tracking-wider text-white/40 border-b border-white/10 flex items-center justify-between">
                      <span>Select Target Job Role</span>
                      <span>Resumes</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
                      {jobs.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-white/40 text-center">No target jobs created yet.</div>
                      ) : (
                        jobs.map((j) => {
                          const isSelected = j.id === targetJobId;
                          return (
                            <button
                              key={j.id}
                              onClick={() => handleJobSelect(j.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-inter transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#7b39fc] text-white font-semibold shadow-[0_2px_8px_rgba(123,57,252,0.4)]'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="truncate pr-2">{j.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-[#2b2344] text-white/50'
                              }`}>
                                {j.candidate_count ?? 0}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs text-white/50 font-inter mt-1.5">
            Upload PDF, DOCX, or TXT candidate resumes to score and rank against {targetTitle ? <strong className="text-white">{targetTitle}</strong> : 'your selected job role'}.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/25 px-3 py-1.5 rounded-full font-inter font-medium">
          <Globe className="w-3.5 h-3.5" /> English Resumes Only
        </div>
      </div>

      {/* Quick Job Switch Pills Bar */}
      {jobs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 border-b border-[rgba(164,132,215,0.1)] custom-scrollbar">
          <span className="text-[11px] text-white/40 font-inter uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#a78bfa]" /> Target Role:
          </span>
          {jobs.map((j) => {
            const isSelected = j.id === targetJobId;
            return (
              <button
                key={j.id}
                onClick={() => handleJobSelect(j.id)}
                className={`px-3 py-1 rounded-full text-xs font-inter transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#7b39fc] text-white font-medium shadow-[0_2px_10px_rgba(123,57,252,0.35)] scale-102'
                    : 'bg-[#1e1735] text-white/60 hover:text-white hover:bg-[#2b2344] border border-[rgba(164,132,215,0.15)]'
                }`}
              >
                <span>{j.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                  {j.candidate_count ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#7b39fc]/40 hover:border-[#7b39fc] bg-[#2b2344]/30 backdrop-blur-md rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-14 h-14 rounded-full bg-[#7b39fc]/20 text-[#7b39fc] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform border border-[#7b39fc]/40">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h4 className="font-serif text-lg text-white mb-1">Drop Candidate Resumes <em>Here</em></h4>
        <p className="text-xs text-white/50 font-inter">or click to browse from your computer (English PDF, DOCX, TXT — max 10MB per file)</p>
      </div>

      {/* Validation Errors */}
      {fileErrors.length > 0 && (
        <div className="bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.35)] text-[#f87171] rounded-xl p-4 text-xs font-inter space-y-1">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" /> File Validation Warnings
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {fileErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Staged File Queue */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-white/50 font-inter">
            <span className="font-manrope font-semibold text-white/80">Staged Resumes ({selectedFiles.length})</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-[11px] text-[#f87171] hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-[#1a1333] border border-[rgba(164,132,215,0.2)] px-3 py-1.5 rounded-lg text-xs font-inter"
              >
                <FileText className="w-3.5 h-3.5 text-[#7b39fc]" />
                <span className="max-w-[160px] truncate text-white/80 font-medium">{file.name}</span>
                <span className="text-[11px] text-white/40">({(file.size / 1024).toFixed(0)}KB)</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-white/30 hover:text-white/70 ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleUploadAndScreen}
              disabled={uploading || !targetJobId}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-xs font-cabin font-semibold bg-[#7b39fc] text-white hover:bg-[#6a2ee6] shadow-[0_4px_14px_rgba(123,57,252,0.3)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Screening {selectedFiles.length} Resumes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run AI Screening ({selectedFiles.length} files)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Batch Result Report */}
      {batchResult && (
        <div className="bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)] rounded-xl p-4 text-xs font-inter space-y-1">
          <div className="flex items-center gap-2 text-[#34d399] font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Batch Screening Complete!
          </div>
          <p className="text-white/70">
            Successfully evaluated <strong className="text-white">{batchResult.screened}</strong> candidate(s).
            {batchResult.errors > 0 && <span className="text-[#f87171]"> ({batchResult.errors} errors)</span>}
          </p>
          {batchResult.error_details && batchResult.error_details.length > 0 && (
            <div className="text-[#f87171] pt-1 text-[11px]">
              {batchResult.error_details.map((err, idx) => (
                <div key={idx}>• {err.file}: {err.error}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
