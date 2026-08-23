import { useState, useEffect } from 'react';
import { Plus, Briefcase, FileText, Upload, Users, Calendar, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function JobManager({ selectedJobId, onSelectJob, onJobCreated }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [createMode, setCreateMode] = useState('text');
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
      setCreateError('Please enter job description text.');
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
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[rgba(164,132,215,0.15)]">
        <div>
          <h2 className="font-serif text-xl text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#7b39fc]" /> Active <em>Target</em> Job Roles
          </h2>
          <p className="text-xs text-white/50 font-inter mt-1">Select an active job role to screen candidates or view ranked leaderboards.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-cabin font-semibold bg-[#7b39fc] text-white hover:bg-[#6a2ee6] shadow-[0_4px_14px_rgba(123,57,252,0.3)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-white/50">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7b39fc]" />
          <span className="text-xs font-inter">Loading target job descriptions...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Briefcase className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-sm font-manrope font-semibold text-white mb-1">No Jobs Posted Yet</h3>
          <p className="text-xs text-white/50 font-inter mb-4 max-w-sm mx-auto">
            Paste a Job Description or upload a document to let our AI engine extract requirements and create a target role.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-cabin font-semibold bg-[#7b39fc] text-white hover:bg-[#6a2ee6] shadow-[0_4px_14px_rgba(123,57,252,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post First Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative backdrop-blur-md hover:scale-[1.01] ${
                  isSelected
                    ? 'bg-[#2b2344]/70 border-[#7b39fc] ring-2 ring-[#7b39fc]/50 shadow-[0_4px_20px_rgba(123,57,252,0.2)]'
                    : 'bg-[#2b2344]/40 border-[rgba(164,132,215,0.25)] hover:border-[#7b39fc]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-sm font-manrope font-bold truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
                    {job.title || 'Untitled Role'}
                  </h3>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#7b39fc] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(123,57,252,0.4)]">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-white/50 font-inter">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#7b39fc]/70" /> {job.candidate_count || 0} candidates
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white/30" /> {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post New Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0e091b]/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1333] border border-[rgba(164,132,215,0.3)] border-t-[#7b39fc] rounded-2xl max-w-lg w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#7b39fc]/15 text-[#7b39fc] flex items-center justify-center border border-[#7b39fc]/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-manrope font-bold text-white">Post New Job Description</h3>
                <p className="text-[11px] text-white/50 font-inter">Extracts skills, experience thresholds, and education requirements automatically.</p>
              </div>
            </div>

            {/* Selector — segmented pill */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreateMode('text')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-cabin font-semibold border transition-all cursor-pointer ${
                  createMode === 'text'
                    ? 'bg-[#7b39fc] text-white border-[#7b39fc]/30 shadow-[0_4px_14px_rgba(123,57,252,0.3)]'
                    : 'bg-[#0e091b] text-white/50 border-[rgba(164,132,215,0.2)] hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" /> Paste Text
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('file')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-cabin font-semibold border transition-all cursor-pointer ${
                  createMode === 'file'
                    ? 'bg-[#7b39fc] text-white border-[#7b39fc]/30 shadow-[0_4px_14px_rgba(123,57,252,0.3)]'
                    : 'bg-[#0e091b] text-white/50 border-[rgba(164,132,215,0.2)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              {createMode === 'text' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-manrope font-medium text-white/50">Job Description Text</label>
                  <textarea
                    placeholder="Paste the full job description text here..."
                    rows={7}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 resize-y placeholder:text-white/30"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-manrope font-medium text-white/50">Upload Document (.pdf, .docx, .txt)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setJdFile(e.target.files[0] || null)}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90"
                  />
                  {jdFile && (
                    <p className="text-[11px] text-[#34d399] font-inter">Selected: {jdFile.name} ({(jdFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>
              )}

              {createError && (
                <div className="flex items-center gap-2 p-3 bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.35)] text-[#f87171] rounded-xl text-xs font-inter">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-cabin font-medium text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-cabin font-semibold bg-[#7b39fc] text-white hover:bg-[#6a2ee6] shadow-[0_4px_14px_rgba(123,57,252,0.3)] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Extracting Requirements...
                    </>
                  ) : (
                    'Extract & Save Job'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
