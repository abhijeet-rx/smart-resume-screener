import { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Sparkles, AlertCircle, XCircle, ChevronRight, Search, UserCheck, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../api';
import { getScoreColor, formatYears } from '../utils';
import { NumberTicker } from '@/components/ui/number-ticker';
import CandidateDetailModal from './CandidateDetailModal';

export default function CandidateLeaderboard({ selectedJobId, refreshTrigger }) {
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterRec, setFilterRec] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [inspectCandidateId, setInspectCandidateId] = useState(null);

  const fetchCandidates = async () => {
    if (!selectedJobId) {
      setCandidates([]);
      setTotalCount(0);
      setJobTitle('');
      return;
    }

    setLoading(true);
    try {
      const data = await api.listCandidates(selectedJobId, 0, 100);
      setCandidates(data.candidates || []);
      setTotalCount(data.total || 0);
      setJobTitle(data.job_title || '');
    } catch (err) {
      console.error('Failed to list candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, refreshTrigger]);

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> SHORTLIST
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3 h-3" /> GOOD MATCH
          </span>
        );
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> REJECT
          </span>
        );
    }
  };

  return (
    <div id="leaderboard-section" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Candidate Leaderboard {jobTitle ? `for ${jobTitle}` : ''}
            <span className="text-xs font-normal text-slate-400">({sortedCandidates.length} of {totalCount})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Ranked candidate recommendations evaluated by deterministic matching + semantic LLM analysis.</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-medium">
            {['ALL', 'SHORTLIST', 'GOOD_MATCH', 'REVIEW', 'REJECT'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRec(r)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterRec === r ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'GOOD_MATCH' ? 'GOOD' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <span className="text-xs">Loading candidate rankings...</span>
        </div>
      ) : !selectedJobId ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Select a target job description above to view candidate rankings.
        </div>
      ) : sortedCandidates.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200 mb-1">No Screened Candidates Found</h4>
          <p className="text-xs text-slate-400">Upload candidate resumes in the Screening Hub to generate matches for this role.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer select-none hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    Candidate {sortBy === 'name' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-600" />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 w-44"
                >
                  <div className="flex items-center gap-1.5">
                    Match Score {sortBy === 'score' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-600" />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('experience')}
                  className="py-3 px-4 cursor-pointer select-none hover:text-slate-200 w-32"
                >
                  <div className="flex items-center gap-1.5">
                    Relevant Exp {sortBy === 'experience' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />) : <ArrowUpDown className="w-3 h-3 text-slate-600" />}
                  </div>
                </th>
                <th className="py-3 px-4 w-36">Recommendation</th>
                <th className="py-3 px-4 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedCandidates.map((c, index) => {
                const rank = index + 1;
                const scoreColor = getScoreColor(c.final_score);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setInspectCandidateId(c.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-bold">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs ${
                        rank === 1 ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20' :
                        rank === 2 ? 'bg-slate-300 text-slate-950 font-extrabold' :
                        rank === 3 ? 'bg-amber-700 text-white font-extrabold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rank}
                      </div>
                    </td>

                    {/* Candidate Name & File */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{c.candidate_name || 'Unnamed Candidate'}</div>
                      <div className="text-[11px] text-slate-400">{c.resume_filename}</div>
                    </td>

                    {/* Score Bar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm w-10 text-right" style={{ color: scoreColor }}>
                          <NumberTicker value={Math.round(c.final_score)} />%
                        </span>
                        <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(c.final_score)}%`, backgroundColor: scoreColor }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Relevant Experience */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {formatYears(c.relevant_experience_months ?? c.total_experience_months)}
                    </td>

                    {/* Badge */}
                    <td className="py-3 px-4">
                      {renderBadge(c.recommendation)}
                    </td>

                    {/* Arrow */}
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
