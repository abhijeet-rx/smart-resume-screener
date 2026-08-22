import { useState, useEffect } from 'react';
import { Plus, Briefcase, FileText, Upload, Users, Calendar, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';
import { api } from '../api';

export default function JobManager({ selectedJobId, onSelectJob, onJobCreated }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Job Creation Form State
  const [createMode, setCreateMode] = useState('text'); // 'text' | 'file'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.listJobs(0, 50);
      setJobs(data.jobs || []);
      if (data.jobs && data.jobs.length > 0 && !selectedJobId) {
        onSelectJob(data.jobs[0].id);
      }
    } catch (err) {
      console.error('Failed to list jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (createMode === 'text' && !jdText.trim()) {
      setCreateError('Please enter a job description.');
      return;
    }
    if (createMode === 'file' && !jdFile) {
      setCreateError('Please select a JD file (.pdf, .docx, .txt).');
      return;
    }

    setCreating(true);
    try {
      const newJob = await api.createJob({
        jdText: createMode === 'text' ? jdText : null,
        jdFile: createMode === 'file' ? jdFile : null,
      });

      setJdText('');
      setJdFile(null);
      setShowCreateModal(false);
      await fetchJobs();
      onSelectJob(newJob.id);
      if (onJobCreated) onJobCreated(newJob);
    } catch (err) {
      setCreateError(err.message || 'Failed to extract job profile.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} color="var(--primary)" /> Target Job Descriptions
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select a job to view ranked candidates or screen new resumes
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn btn-primary"
        >
          <Plus size={16} /> Post New Job
        </button>
      </div>

      {/* Jobs Carousel / Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Briefcase size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>No Job Descriptions Posted Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Paste a Job Description or upload a file to extract structured requirements.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> Post First Job
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '14px' 
        }}>
          {jobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''}`}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : 'var(--text-main)', lineHeight: 1.3 }}>
                    {job.title || 'Untitled Role'}
                  </h3>
                  {isSelected && (
                    <span style={{ background: 'var(--primary)', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                      <Check size={12} color="#fff" />
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} color="var(--accent-cyan)" /> {job.candidate_count || 0} Candidates
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--primary)" /> Post New Job Description
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Our AI extracts required skills, experience thresholds, and education requirements.
            </p>

            {/* Input Mode Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setCreateMode('text')}
                className={`btn ${createMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
              >
                <FileText size={16} /> Paste Text
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('file')}
                className={`btn ${createMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px' }}
              >
                <Upload size={16} /> Upload Document
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              {createMode === 'text' ? (
                <div className="form-group">
                  <label className="form-label">Job Description Text</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Paste the full job description text here..."
                    rows={8}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Upload JD File (.pdf, .docx, .txt)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="form-input"
                    onChange={(e) => setJdFile(e.target.files[0] || null)}
                  />
                  {jdFile && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                      Selected: {jdFile.name} ({(jdFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

              {createError && (
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {createError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? <><Loader2 size={16} className="spin" /> Extracting Profile...</> : 'Extract & Save Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
