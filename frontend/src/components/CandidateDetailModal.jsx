import { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, XCircle, FileText, Mail, Phone, Sparkles, Brain, Check, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function CandidateDetailModal({ candidateId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('match'); // 'match' | 'profile' | 'raw'

  useEffect(() => {
    if (!candidateId) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getCandidateDetail(candidateId);
        setDetail(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch candidate details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [candidateId]);

  if (!candidateId) return null;

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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in" 
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="spin" /> Loading Candidate Details...
              </div>
            ) : detail ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{detail.candidate_name || 'Anonymous Candidate'}</h2>
                  {getRecommendationBadge(detail.recommendation)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {detail.candidate_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={13} /> {detail.candidate_email}
                    </span>
                  )}
                  {detail.candidate_phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} /> {detail.candidate_phone}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={13} /> {detail.resume_filename}
                  </span>
                </div>
              </div>
            ) : (
              <h3>Candidate Inspection</h3>
            )}
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {error ? (
            <div style={{ color: '#f87171', background: 'rgba(244,63,94,0.1)', padding: '16px', borderRadius: '8px' }}>
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Score Gauge & Metric Bar */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: '12px',
                marginBottom: '24px' 
              }}>
                {/* Final Score Pill */}
                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', uppercase: 'true' }}>Final Match Score</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(detail.scores.final_score) }}>
                    {Math.round(detail.scores.final_score)}<span style={{ fontSize: '1rem' }}>/100</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Skill Match (40%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(detail.scores.skill_score) }}>
                    {Math.round(detail.scores.skill_score)}%
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Semantic Relevance (30%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(detail.scores.semantic_score) }}>
                    {Math.round(detail.scores.semantic_score)}%
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Experience (20%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(detail.scores.experience_score) }}>
                    {Math.round(detail.scores.experience_score)}%
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Education (10%)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: getScoreColor(detail.scores.education_score) }}>
                    {Math.round(detail.scores.education_score)}%
                  </div>
                </div>
              </div>

              {/* LLM Semantic Reasoning Box */}
              {detail.reasoning && (
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.7)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                    <Brain size={18} /> AI Recruiter Reasoning
                  </h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {detail.reasoning.reasoning}
                  </p>

                  {/* Strengths & Gaps */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Key Strengths
                      </div>
                      <ul style={{ listStyle: 'none', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {detail.reasoning.strengths?.map((s, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>• {s}</li>
                        )) || <li>None noted</li>}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Key Gaps
                      </div>
                      <ul style={{ listStyle: 'none', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {detail.reasoning.gaps?.map((g, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>• {g}</li>
                        )) || <li>None noted</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Analysis */}
              {detail.match_details && detail.match_details.skill_details && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color="var(--primary)" /> Skills Breakdown
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Matched Required */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399', marginBottom: '8px' }}>
                        Matched Required ({detail.match_details.skill_details.matched_required?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {detail.match_details.skill_details.matched_required?.map((sk, idx) => (
                          <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Required */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', marginBottom: '8px' }}>
                        Missing Required ({detail.match_details.skill_details.missing_required?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {detail.match_details.skill_details.missing_required?.map((sk, idx) => (
                          <span key={idx} style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matched Preferred */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                        Matched Preferred ({detail.match_details.skill_details.matched_preferred?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {detail.match_details.skill_details.matched_preferred?.map((sk, idx) => (
                          <span key={idx} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bonus Skills */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a855f7', marginBottom: '8px' }}>
                        Bonus Skills ({detail.match_details.skill_details.bonus?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {detail.match_details.skill_details.bonus?.map((sk, idx) => (
                          <span key={idx} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
