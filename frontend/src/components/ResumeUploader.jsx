import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.docx', '.txt'];

export default function ResumeUploader({ targetJobId, onScreeningComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const fileInputRef = useRef(null);

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
      alert('Please select or post a target job first.');
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
      <div>
        <h3 className="font-serif text-xl text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#7b39fc]" /> Batch Resume Screening <em>Hub</em>
        </h3>
        <p className="text-xs text-white/50 font-inter mt-1">
          Upload PDF, DOCX, or TXT candidate resumes to score and rank against your selected job role.
        </p>
      </div>

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
        <p className="text-xs text-white/50 font-inter">or click to browse from your computer (PDF, DOCX, TXT — max 10MB per file)</p>
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
