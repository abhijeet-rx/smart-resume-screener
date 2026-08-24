import { useState, useEffect } from 'react';
import { Plus, Briefcase, FileText, Upload, Users, Calendar, Check, Loader2, Sparkles, AlertCircle, Trash2, X, Globe } from 'lucide-react';
import { api } from '../api';

export default function JobManager({ selectedJobId, onSelectJob, onJobCreated, refreshTrigger }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [createMode, setCreateMode] = useState('text');
  const [customTitle, setCustomTitle] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdFiles, setJdFiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [createError, setCreateError] = useState('');

  // Delete state
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);

  const resetForm = () => {
    setCustomTitle('');
    setRequiredSkills('');
    setPreferredSkills('');
    setExperienceRequired('');
    setCustomRequirements('');
    setJdText('');
    setJdFiles([]);
    setCreateError('');
  };

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
  }, [refreshTrigger]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (createMode === 'text' && !jdText.trim() && !requiredSkills.trim() && !customTitle.trim()) {
      setCreateError('Please enter job description text or specify required skills / title.');
      return;
    }
    if (createMode === 'file' && jdFiles.length === 0) {
      setCreateError('Please select at least one JD file (.pdf, .docx, .txt).');
      return;
    }

    setCreating(true);
    setCreationProgress('');
    try {
      if (createMode === 'file') {
        let lastCreatedJob = null;
        for (let i = 0; i < jdFiles.length; i++) {
          setCreationProgress(`Extracting requirements ${i + 1} of ${jdFiles.length}: ${jdFiles[i].name}...`);
          const newJob = await api.createJob({
            jdFile: jdFiles[i],
            customTitle,
            requiredSkills,
            preferredSkills,
            experienceRequired,
            customRequirements,
          });
          lastCreatedJob = newJob;
        }
        resetForm();
        setShowCreateModal(false);
        await fetchJobs();
        if (lastCreatedJob) {
          onSelectJob(lastCreatedJob.id);
          if (onJobCreated) onJobCreated(lastCreatedJob);
        }
      } else {
        const newJob = await api.createJob({
          jdText: jdText.trim(),
          customTitle,
          requiredSkills,
          preferredSkills,
          experienceRequired,
          customRequirements,
        });
        resetForm();
        setShowCreateModal(false);
        await fetchJobs();
        onSelectJob(newJob.id);
        if (onJobCreated) onJobCreated(newJob);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to extract job profile.');
    } finally {
      setCreating(false);
      setCreationProgress('');
    }
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation(); // prevent card selection
    if (confirmDeleteJobId !== jobId) {
      setConfirmDeleteJobId(jobId);
      return;
    }

    setDeletingJobId(jobId);
    try {
      await api.deleteJob(jobId);
      const updatedJobs = jobs.filter((j) => j.id !== jobId);
      setJobs(updatedJobs);

      if (selectedJobId === jobId) {
        const nextJobId = updatedJobs.length > 0 ? updatedJobs[0].id : null;
        onSelectJob(nextJobId);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete job role.');
    } finally {
      setDeletingJobId(null);
      setConfirmDeleteJobId(null);
    }
  };

  const removeJdFile = (index) => {
    setJdFiles((prev) => prev.filter((_, i) => i !== index));
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
            Specify target skill sets, experience requirements, or upload job description files to screen candidate resumes.
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
            const isDeleting = deletingJobId === job.id;
            const isConfirming = confirmDeleteJobId === job.id;

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative backdrop-blur-md hover:scale-[1.01] group ${
                  isSelected
                    ? 'bg-[#2b2344]/70 border-[#7b39fc] ring-2 ring-[#7b39fc]/50 shadow-[0_4px_20px_rgba(123,57,252,0.2)]'
                    : 'bg-[#2b2344]/40 border-[rgba(164,132,215,0.25)] hover:border-[#7b39fc]/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`text-sm font-manrope font-bold truncate pr-6 ${isSelected ? 'text-white' : 'text-white/90'}`}>
                    {job.title || 'Untitled Role'}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#7b39fc] flex items-center justify-center shadow-[0_2px_8px_rgba(123,57,252,0.4)]">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}

                    {/* Delete Job Button */}
                    <button
                      onClick={(e) => handleDeleteJob(job.id, e)}
                      disabled={isDeleting}
                      title={isConfirming ? "Click again to confirm delete" : "Delete this job role"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isConfirming
                          ? 'bg-[#f87171] text-white animate-pulse'
                          : 'text-white/30 hover:text-[#f87171] hover:bg-white/10 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isConfirming && (
                  <div className="text-[10px] text-[#f87171] font-inter mb-2 font-medium">
                    ⚠️ Click delete icon again to permanently remove role & candidates.
                  </div>
                )}

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
          <div className="bg-[#1a1333] border border-[rgba(164,132,215,0.3)] border-t-[#7b39fc] rounded-2xl max-w-lg w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#7b39fc]/15 text-[#7b39fc] flex items-center justify-center border border-[#7b39fc]/30 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-manrope font-bold text-white">Post Job Role & Screening Criteria</h3>
                <p className="text-[11px] text-white/50 font-inter">Define target skill sets, experience, and custom requirements to screen candidate resumes.</p>
              </div>
            </div>

            {/* Input Mode Selector */}
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
                <FileText className="w-4 h-4" /> Text / Skill Form
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
                <Upload className="w-4 h-4" /> Upload Files
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5">
              {/* Job Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-manrope font-medium text-white/70">Job Title / Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Python Engineer, Product Manager"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 placeholder:text-white/30"
                />
              </div>

              {/* Target Skill Set */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-manrope font-medium text-[#7b39fc]">
                    Required Skill Set <span className="text-white/40">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React, TypeScript, Tailwind, Git"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 placeholder:text-white/30 border-[#7b39fc]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-manrope font-medium text-white/70">
                    Preferred / Bonus Skills <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, GraphQL, AWS"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Experience Years */}
              <div className="space-y-1">
                <label className="text-[11px] font-manrope font-medium text-white/70">Minimum Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  placeholder="e.g. 2"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 placeholder:text-white/30"
                />
              </div>

              {/* Custom Screening Criteria / Requirements */}
              <div className="space-y-1">
                <label className="text-[11px] font-manrope font-medium text-white/70">
                  Custom Requirements & Screening Criteria <span className="text-white/40">(optional)</span>
                </label>
                <textarea
                  placeholder="Specify any custom requirements (e.g. Must have experience building scalable APIs, strong problem solving, or specific domain background)..."
                  rows={3}
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 resize-y placeholder:text-white/30"
                />
              </div>

              {createMode === 'text' ? (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-manrope font-medium text-white/50">
                    Full Job Description Text <span className="text-white/30">(optional if skills/title entered)</span>
                  </label>
                  <textarea
                    placeholder="Paste full job description details here..."
                    rows={4}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 resize-y placeholder:text-white/30"
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-manrope font-medium text-white/70">
                      Upload Documents (.pdf, .docx, .txt)
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#34d399] bg-[#34d399]/10 px-2 py-0.5 rounded-md border border-[#34d399]/20 font-inter">
                      <Globe className="w-3 h-3" /> English Documents Only
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setJdFiles(Array.from(e.target.files || []))}
                    className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 cursor-pointer"
                  />
                  <p className="text-[10px] text-white/40 font-inter italic">
                    ℹ️ Only English language Job Descriptions and resumes are supported for AI requirement extraction and screening.
                  </p>

                  {/* List of selected JD files */}
                  {jdFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-white/60 font-inter font-semibold">
                        Selected Files ({jdFiles.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {jdFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-[#0e091b] border border-[rgba(164,132,215,0.2)] px-2.5 py-1 rounded-md text-[11px] font-inter text-white/80"
                          >
                            <FileText className="w-3 h-3 text-[#7b39fc]" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeJdFile(idx)}
                              className="text-white/40 hover:text-white ml-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {creationProgress && (
                <div className="flex items-center gap-2 p-3 bg-[#7b39fc]/10 border border-[#7b39fc]/30 text-[#7b39fc] rounded-xl text-xs font-inter">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{creationProgress}</span>
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
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
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
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Job Criteria...
                    </>
                  ) : (
                    `Save Job Role & Requirements`
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
