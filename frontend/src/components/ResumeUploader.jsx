import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
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
        errs.push(`${file.name}: Exceeds 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
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
      alert('Please select or post a job first.');
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
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} color="var(--accent-cyan)" /> Batch Resume Screening
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload PDF, DOCX, or TXT resumes to evaluate against the selected job description.
          </p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '36px 20px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '16px'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.12)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <UploadCloud size={28} />
        </div>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
          Drag & Drop Resumes Here
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          or click to browse from your computer (PDF, DOCX, TXT — max 10MB per file)
        </p>
      </div>

      {/* Client-side Validation Error Messages */}
      {fileErrors.length > 0 && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f87171',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <AlertTriangle size={16} /> File Validation Warnings
          </div>
          <ul style={{ paddingLeft: '20px' }}>
            {fileErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* File Staging List */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Staged Resumes ({selectedFiles.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem'
                }}
              >
                <FileText size={14} color="var(--primary)" />
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                  ({(file.size / 1024).toFixed(0)}KB)
                </span>
                <X
                  size={14}
                  color="var(--text-muted)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => removeFile(idx)}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleUploadAndScreen}
              disabled={uploading || !targetJobId}
              className="btn btn-primary"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Screening {selectedFiles.length} Resumes...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run AI Screening ({selectedFiles.length} files)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Batch Result Report */}
      {batchResult && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
            <CheckCircle size={18} /> Screening Complete!
          </div>
          <p style={{ color: 'var(--text-main)' }}>
            Successfully evaluated <strong>{batchResult.screened}</strong> candidate(s). 
            {batchResult.errors > 0 && <span style={{ color: '#f87171' }}> ({batchResult.errors} errors)</span>}
          </p>
          {batchResult.error_details && batchResult.error_details.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#f87171' }}>
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
