import { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, Sparkles, AlertCircle, XCircle, ChevronRight, Filter, Search, UserCheck, Loader2 } from 'lucide-react';
import { api } from '../api';
import CandidateDetailModal from './CandidateDetailModal';

export default function CandidateLeaderboard({ selectedJobId, refreshTrigger }) {
  const [candidates, setCandidates] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterRec, setFilterRec] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectCandidateId, setInspectCandidateId] = useState(null);

  const fetchCandidates = async () => {
    if (!selectedJobId) {
      setCandidates([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await api.listCandidates(selectedJobId, 0, 100);
      setCandidates(data.candidates || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to list candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, refreshTrigger]);

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

  const getRecommendationBadge = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'SHORTLIST':
      case 'STRONG_MATCH':
        return <span className="badge badge-shortlist"><CheckCircle2 size={12} /> Shortlist</span>;
      case 'GOOD_MATCH':
        return <span className="badge badge-good"><Sparkles size={12} /> Good Match</span>;
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return <span className="badge badge-review"><AlertCircle size={12} /> Review</span>;
      default:
        return <span className="badge badge-reject"><XCircle size={12} /> Reject</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#34d399';
    if (score >= 60) return '#38bdf8';
    if (score >= 40) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-amber)" /> Candidate Leaderboard
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({filteredCandidates.length} of {totalCount})
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ranked deterministically + semantically evaluated candidates
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search candidate or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '30px', width: '220px', padding: '6px 10px 6px 30px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Recommendation Filter Buttons */}
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

      {/* Candidate Leaderboard List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
          Loading ranked candidate results...
        </div>
      ) : !selectedJobId ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Select a job description above to view screened candidates.
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UserCheck size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '4px' }}>No Candidates Found</h4>
          <p style={{ fontSize: '0.85rem' }}>
            Upload resumes above to screen candidates for this job description.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredCandidates.map((c, index) => {
            const rank = index + 1;
            const scoreColor = getScoreColor(c.final_score);
            return (
              <div
                key={c.id}
                onClick={() => setInspectCandidateId(c.id)}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Rank & Candidate Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                rank === 3 ? 'linear-gradient(135deg, #b45309, #78350f)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    #{rank}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.candidate_name || 'Unnamed Candidate'}
                      </span>
                      {getRecommendationBadge(c.recommendation)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      File: {c.resume_filename}
                    </div>
                  </div>
                </div>

                {/* Score Progress Bar & Numbers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                  <div style={{ width: '130px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Skill: <strong style={{ color: 'var(--text-main)' }}>{Math.round(c.skill_score)}%</strong>
                    </div>
                    {/* Score Bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(c.final_score)}%`, background: scoreColor, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', minWidth: '55px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor }}>
                      {Math.round(c.final_score)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Match</div>
                  </div>

                  <ChevronRight size={18} color="var(--text-dim)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Inspection Drawer/Modal */}
      {inspectCandidateId && (
        <CandidateDetailModal
          candidateId={inspectCandidateId}
          onClose={() => setInspectCandidateId(null)}
        />
      )}
    </div>
  );
}
