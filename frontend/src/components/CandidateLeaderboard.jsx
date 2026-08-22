import { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Sparkles, AlertCircle, XCircle, ChevronRight, Search, UserCheck, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../api';
import CandidateDetailModal from './CandidateDetailModal';

export default function CandidateLeaderboard({ selectedJobId, refreshTrigger }) {
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterRec, setFilterRec] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'experience' | 'name'
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
      valA = a.total_experience_months || 0;
      valB = b.total_experience_months || 0;
    } else if (sortBy === 'name') {
      valA = (a.candidate_name || '').toLowerCase();
      valB = (b.candidate_name || '').toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const getRecommendationBadge = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'SHORTLIST':
      case 'STRONG_MATCH':
        return <span className="badge badge-shortlist"><CheckCircle2 size={12} /> SHORTLIST</span>;
      case 'GOOD_MATCH':
        return <span className="badge badge-good"><Sparkles size={12} /> GOOD MATCH</span>;
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return <span className="badge badge-review"><AlertCircle size={12} /> REVIEW</span>;
      default:
        return <span className="badge badge-reject"><XCircle size={12} /> REJECT</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#38bdf8';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  };

  const formatYears = (months) => {
    if (!months) return '0.0 yrs';
    return (months / 12).toFixed(1) + ' yrs';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-amber)" /> Candidates {jobTitle ? `for ${jobTitle}` : ''}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({sortedCandidates.length} of {totalCount})
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Deterministic matching & semantic LLM candidate ranking
          </p>
        </div>

        {/* Filters & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '30px', width: '200px', padding: '6px 10px 6px 30px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Recommendation Filter Tabs */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {['ALL', 'SHORTLIST', 'GOOD_MATCH', 'REVIEW', 'REJECT'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRec(r)}
                style={{
                  background: filterRec === r ? 'var(--primary)' : 'transparent',
                  color: filterRec === r ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {r === 'GOOD_MATCH' ? 'GOOD' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Leaderboard Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
          Loading candidate leaderboard...
        </div>
      ) : !selectedJobId ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Select a job description above to view candidates.
        </div>
      ) : sortedCandidates.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UserCheck size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>No Screened Candidates Found</h4>
          <p style={{ fontSize: '0.85rem' }}>
            Upload resumes above to screen candidates for this job description.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>#</th>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Candidate {sortBy === 'name' ? (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} color="var(--text-dim)" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('score')}
                  style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none', width: '180px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Match Score {sortBy === 'score' ? (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} color="var(--text-dim)" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('experience')}
                  style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none', width: '140px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Relevant Exp {sortBy === 'experience' ? (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} color="var(--text-dim)" />}
                  </div>
                </th>
                <th style={{ padding: '12px 14px', width: '140px' }}>Status</th>
                <th style={{ padding: '12px 14px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((c, index) => {
                const rank = index + 1;
                const scoreColor = getScoreColor(c.final_score);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setInspectCandidateId(c.id)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Rank */}
                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                    rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                    rank === 3 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255, 255, 255, 0.06)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                      }}>
                        {rank}
                      </div>
                    </td>

                    {/* Candidate Name & File */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {c.candidate_name || 'Unnamed Candidate'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.resume_filename}
                      </div>
                    </td>

                    {/* Score Bar & % */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, color: scoreColor, width: '42px', fontSize: '1rem' }}>
                          {Math.round(c.final_score)}%
                        </span>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(c.final_score)}%`, background: scoreColor, borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>

                    {/* Relevant Experience */}
                    <td style={{ padding: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatYears(c.total_experience_months)}
                    </td>

                    {/* Status Recommendation Pill */}
                    <td style={{ padding: '14px' }}>
                      {getRecommendationBadge(c.recommendation)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <ChevronRight size={18} color="var(--text-dim)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Detail Inspection Modal */}
      {inspectCandidateId && (
        <CandidateDetailModal
          candidateId={inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
        />
      )}
    </div>
  );
}
