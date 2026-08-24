import { useState, useEffect, useRef } from 'react';
import {
  Trophy, CheckCircle2, Sparkles, AlertCircle, XCircle, ChevronRight, Search,
  UserCheck, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Briefcase, ChevronDown, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { getScoreColor, formatYears } from '../utils';
import { NumberTicker } from '@/components/ui/number-ticker';
import CandidateDetailModal from './CandidateDetailModal';

export default function CandidateLeaderboard({ selectedJobId, onSelectJob, refreshTrigger }) {
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [filterRec, setFilterRec] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [inspectCandidateId, setInspectCandidateId] = useState(null);

  const dropdownRef = useRef(null);
  const cacheRef = useRef({});

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all available job roles
  const fetchJobs = async () => {
    try {
      const data = await api.listJobs(0, 100);
      const list = data.jobs || [];
      setJobs(list);
      // Auto-select first job if none is selected
      if (!selectedJobId && list.length > 0 && onSelectJob) {
        onSelectJob(list[0].id);
      }
    } catch (err) {
      console.error('Failed to list jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);

  // Fetch candidates for current selected job with instant cache lookup
  const fetchCandidates = async (isBackground = false) => {
    if (!selectedJobId) {
      setCandidates([]);
      setTotalCount(0);
      setJobTitle('');
      return;
    }

    if (cacheRef.current[selectedJobId] && !isBackground) {
      const cached = cacheRef.current[selectedJobId];
      setCandidates(cached.candidates);
      setTotalCount(cached.total);
      setJobTitle(cached.job_title);
      setLoading(false);
      // Revalidate in background
      fetchCandidates(true);
      return;
    }

    if (!isBackground) setLoading(true);
    try {
      const data = await api.listCandidates(selectedJobId, 0, 100);
      const resCandidates = data.candidates || [];
      const resTotal = data.total || 0;
      const resTitle = data.job_title || '';

      cacheRef.current[selectedJobId] = {
        candidates: resCandidates,
        total: resTotal,
        job_title: resTitle,
      };

      setCandidates(resCandidates);
      setTotalCount(resTotal);
      setJobTitle(resTitle);
    } catch (err) {
      console.error('Failed to list candidates:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, refreshTrigger]);

  const handleJobSelect = (jobId) => {
    setIsJobDropdownOpen(false);
    if (onSelectJob) {
      onSelectJob(jobId);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterRec !== 'ALL') {
      const rec = c.recommendation?.toUpperCase();
      if (filterRec === 'SHORTLIST' && rec !== 'SHORTLIST' && rec !== 'STRONG_MATCH') return false;
      if (filterRec === 'GOOD_MATCH' && rec !== 'GOOD_MATCH') return false;
      if (filterRec === 'REVIEW' && rec !== 'REVIEW' && rec !== 'PARTIAL_MATCH') return false;
      if (filterRec === 'REJECT' && rec !== 'REJECT' && rec !== 'NO_MATCH') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.candidate_name || '').toLowerCase();
      const file = (c.resume_filename || '').toLowerCase();
      if (!name.includes(q) && !file.includes(q)) return false;
    }
    return true;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'score') {
      valA = a.final_score || 0;
      valB = b.final_score || 0;
    } else if (sortBy === 'experience') {
      valA = a.relevant_experience_months ?? a.total_experience_months ?? 0;
      valB = b.relevant_experience_months ?? b.total_experience_months ?? 0;
    } else if (sortBy === 'name') {
      valA = (a.candidate_name || '').toLowerCase();
      valB = (b.candidate_name || '').toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const renderBadge = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'SHORTLIST':
      case 'STRONG_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cabin font-bold tracking-wide uppercase bg-[rgba(16,185,129,0.15)] text-[#34d399] border border-[rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-3 h-3" /> SHORTLIST
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cabin font-bold tracking-wide uppercase bg-[rgba(6,182,212,0.15)] text-[#38bdf8] border border-[rgba(6,182,212,0.35)]">
            <Sparkles className="w-3 h-3" /> GOOD MATCH
          </span>
        );
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cabin font-bold tracking-wide uppercase bg-[rgba(245,158,11,0.15)] text-[#fbbf24] border border-[rgba(245,158,11,0.35)]">
            <AlertCircle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-cabin font-bold tracking-wide uppercase bg-[rgba(244,63,94,0.15)] text-[#f87171] border border-[rgba(244,63,94,0.35)]">
            <XCircle className="w-3 h-3" /> REJECT
          </span>
        );
    }
  };

  return (
    <div id="leaderboard-section" className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[rgba(164,132,215,0.15)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-xl text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Candidate <em>Rankings</em> & Matches
            </h3>

            {/* Interactive Job Role Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#261c42] hover:bg-[#322557] border border-[#7b39fc]/40 hover:border-[#7b39fc] text-xs font-inter font-medium text-white transition-all shadow-[0_2px_10px_rgba(123,57,252,0.15)] cursor-pointer group"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="max-w-[200px] truncate">
                  {jobTitle || 'Select Job Role'}
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
                      <span>Target Job Roles</span>
                      <span>Candidates</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
                      {jobs.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-white/40 text-center">No job roles created yet.</div>
                      ) : (
                        jobs.map((j) => {
                          const isSelected = j.id === selectedJobId;
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

            <span className="text-xs font-inter font-normal text-white/40">
              ({sortedCandidates.length} of {totalCount})
            </span>
          </div>
          <p className="text-xs text-white/50 font-inter mt-1.5">
            Ranked candidate recommendations evaluated by deterministic matching + semantic LLM analysis.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-inter glass-input rounded-lg text-white/90 w-48 placeholder:text-white/30"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-[#18112b] p-1 rounded-lg border border-[rgba(164,132,215,0.2)] text-[11px] font-cabin font-medium">
            {['ALL', 'SHORTLIST', 'GOOD_MATCH', 'REVIEW', 'REJECT'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRec(r)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterRec === r
                    ? 'bg-[#7b39fc] text-white font-semibold shadow-[0_2px_8px_rgba(123,57,252,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {r === 'GOOD_MATCH' ? 'GOOD' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Role Switcher Pills Bar */}
      {jobs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 border-b border-[rgba(164,132,215,0.1)] custom-scrollbar">
          <span className="text-[11px] text-white/40 font-inter uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#a78bfa]" /> Switch Role:
          </span>
          {jobs.map((j) => {
            const isSelected = j.id === selectedJobId;
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

      {/* Animated Table Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedJobId || 'no-job'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {loading ? (
            <div className="py-12 text-center text-white/50">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7b39fc]" />
              <span className="text-xs font-inter">Loading candidate rankings...</span>
            </div>
          ) : !selectedJobId ? (
            <div className="py-12 text-center text-white/50 text-xs font-inter space-y-1">
              <p>Please select an active role above or from the <strong className="text-white">Target Job Roles</strong> page to view candidate rankings.</p>
            </div>
          ) : sortedCandidates.length === 0 ? (
            <div className="py-12 text-center text-white/50">
              <UserCheck className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <h4 className="text-sm font-manrope font-semibold text-white mb-1">No Screened Candidates Found</h4>
              <p className="text-xs text-white/50 font-inter">Upload candidate resumes in the Screening Hub to generate matches for this role.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(164,132,215,0.15)] text-white/40 uppercase tracking-wider text-[10px] font-manrope font-semibold">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th
                      onClick={() => handleSort('name')}
                      className="py-3 px-4 cursor-pointer select-none hover:text-white/70 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Candidate {sortBy === 'name' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7b39fc]" /> : <ArrowDown className="w-3 h-3 text-[#7b39fc]" />) : <ArrowUpDown className="w-3 h-3 text-white/20" />}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('score')}
                      className="py-3 px-4 cursor-pointer select-none hover:text-white/70 w-44 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Match Score {sortBy === 'score' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7b39fc]" /> : <ArrowDown className="w-3 h-3 text-[#7b39fc]" />) : <ArrowUpDown className="w-3 h-3 text-white/20" />}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('experience')}
                      className="py-3 px-4 cursor-pointer select-none hover:text-white/70 w-32 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Relevant Exp {sortBy === 'experience' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7b39fc]" /> : <ArrowDown className="w-3 h-3 text-[#7b39fc]" />) : <ArrowUpDown className="w-3 h-3 text-white/20" />}
                      </div>
                    </th>
                    <th className="py-3 px-4 w-36">Recommendation</th>
                    <th className="py-3 px-4 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(164,132,215,0.1)]">
                  {sortedCandidates.map((c, index) => {
                    const rank = index + 1;
                    const scoreColor = getScoreColor(c.final_score);
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.3) }}
                        onClick={() => setInspectCandidateId(c.id)}
                        className="hover:bg-[#3d3460]/40 cursor-pointer transition-colors"
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center font-bold">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs ${
                            rank === 1 ? 'bg-[#f59e0b] text-[#0e091b] font-extrabold shadow-[0_2px_8px_rgba(245,158,11,0.4)]' :
                            rank === 2 ? 'bg-[#cbd5e1] text-[#0e091b] font-extrabold' :
                            rank === 3 ? 'bg-[#b45309] text-white font-extrabold' : 'bg-[#2b2344] text-white/50 border border-[rgba(164,132,215,0.2)]'
                          }`}>
                            {rank}
                          </div>
                        </td>

                        {/* Candidate Name & File */}
                        <td className="py-3 px-4">
                          <div className="font-manrope font-bold text-white">{c.candidate_name || 'Unnamed Candidate'}</div>
                          <div className="text-[11px] text-white/40 font-inter">{c.resume_filename}</div>
                        </td>

                        {/* Score Bar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm w-10 text-right" style={{ color: scoreColor }}>
                              <NumberTicker value={Math.round(c.final_score)} />%
                            </span>
                            <div className="flex-1 h-2 bg-[#0e091b] rounded-full overflow-hidden border border-[rgba(164,132,215,0.15)]">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.round(c.final_score)}%`, backgroundColor: scoreColor }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Relevant Experience */}
                        <td className="py-3 px-4 font-inter font-semibold text-white/80">
                          {formatYears(c.relevant_experience_months ?? c.total_experience_months)}
                        </td>

                        {/* Badge */}
                        <td className="py-3 px-4">
                          {renderBadge(c.recommendation)}
                        </td>

                        {/* Arrow */}
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-white/20" />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Candidate Inspection Drawer Modal */}
      {inspectCandidateId && (
        <CandidateDetailModal
          candidateId={inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
        />
      )}
    </div>
  );
}
