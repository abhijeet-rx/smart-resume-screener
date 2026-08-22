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
    <div id="batch-screener-section" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" /> Batch Resume Screening Hub
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload PDF, DOCX, or TXT candidate resumes to score and rank against your selected job role.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform border border-indigo-500/20">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-200 mb-1">Drag & Drop Resumes Here</h4>
        <p className="text-xs text-slate-400">or click to browse from your computer (PDF, DOCX, TXT — max 10MB per file)</p>
      </div>

      {/* Validation Errors */}
      {fileErrors.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-xs space-y-1">
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
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Staged Resumes ({selectedFiles.length})</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-[11px] text-rose-400 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[160px] truncate text-slate-200 font-medium">{file.name}</span>
                <span className="text-[11px] text-slate-500">({(file.size / 1024).toFixed(0)}KB)</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-slate-500 hover:text-slate-300 ml-1"
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all"
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
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Batch Screening Complete!
          </div>
          <p className="text-slate-300">
            Successfully evaluated <strong>{batchResult.screened}</strong> candidate(s).
            {batchResult.errors > 0 && <span className="text-rose-400"> ({batchResult.errors} errors)</span>}
          </p>
          {batchResult.error_details && batchResult.error_details.length > 0 && (
            <div className="text-rose-400 pt-1 text-[11px]">
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
