import { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, XCircle, FileText, Mail, Phone, Sparkles, Brain, Check, AlertCircle, Loader2, Briefcase, GraduationCap } from 'lucide-react';
import { api } from '../api';
import { getScoreColor } from '../utils';

export default function CandidateDetailModal({ candidateId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        return <span className="badge badge-shortlist" style={{ padding: '6px 14px', fontSize: '0.85rem' }}><CheckCircle2 size={14} /> SHORTLIST</span>;
      case 'GOOD_MATCH':
        return <span className="badge badge-good" style={{ padding: '6px 14px', fontSize: '0.85rem' }}><Sparkles size={14} /> GOOD MATCH</span>;
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return <span className="badge badge-review" style={{ padding: '6px 14px', fontSize: '0.85rem' }}><AlertCircle size={14} /> REVIEW</span>;
      default:
        return <span className="badge badge-reject" style={{ padding: '6px 14px', fontSize: '0.85rem' }}><XCircle size={14} /> REJECT</span>;
    }
  };



  const renderProgressBar = (score) => {
    const percent = Math.round(score || 0);
    const color = getScoreColor(percent);
    return (
      <div style={{ margin: '10px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Match Score</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{percent}%</span>
        </div>
        <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, background: `linear-gradient(90deg, ${color} 0%, #6366f1 100%)`, borderRadius: '6px', transition: 'width 0.5s ease' }} />
        </div>
      </div>
    );
  };

  // Helper to extract candidate education line
  const getEducationDisplay = (profile) => {
    if (!profile || !profile.education || profile.education.length === 0) {
      return { text: 'No education data specified', valid: false };
    }
    const main = profile.education[0];
    const text = `${main.degree || ''} ${main.field || ''}`.trim() || 'Degree specified';
    const isCsStem = /computer|software|engineering|it|data|stem|cs/i.test(text);
    return { text, valid: isCsStem };
  };

  // Helper to extract total vs relevant experience years
  const getExperienceDisplay = (matchDetails, profile) => {
    const relMonths = matchDetails?.relevant_experience_months ?? matchDetails?.total_experience_months ?? 0;
    let totMonths = matchDetails?.total_experience_months ?? 0;
    if (profile && profile.experience) {
      const sum = profile.experience.reduce((acc, exp) => acc + (exp.duration_months || 0), 0);
      if (sum > totMonths) totMonths = sum;
    }
    return {
      relevant: (relMonths / 12).toFixed(1),
      total: (totMonths / 12).toFixed(1),
    };
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
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
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="spin" /> Fetching Candidate Inspection Data...
              </div>
            ) : detail ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Candidate: {detail.candidate_name || 'Anonymous Candidate'}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {detail.candidate_email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {detail.candidate_email}</span>}
                  {detail.candidate_phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {detail.candidate_phone}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={13} /> {detail.resume_filename}</span>
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
              {/* Match Score & Recommendation Badge Bar */}
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    AI Recommendation
                  </div>
                  <div>
                    {getRecommendationBadge(detail.recommendation)}
                  </div>
                </div>

                {renderProgressBar(detail.scores?.final_score)}

                {/* Score Breakdown Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Skill (40%)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: getScoreColor(detail.scores?.skill_score) }}>{Math.round(detail.scores?.skill_score)}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Semantic (30%)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: getScoreColor(detail.scores?.semantic_score) }}>{Math.round(detail.scores?.semantic_score)}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Experience (20%)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: getScoreColor(detail.scores?.experience_score) }}>{Math.round(detail.scores?.experience_score)}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Education (10%)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: getScoreColor(detail.scores?.education_score) }}>{Math.round(detail.scores?.education_score)}%</div>
                  </div>
                </div>
              </div>

              {/* Skills Checklist & Experience/Education Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* Skills Checklist */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} color="var(--primary)" /> Skills Checklist
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Matched Required Skills */}
                    {detail.match_details?.skill_details?.matched_required?.map((sk, idx) => (
                      <div key={`mreq-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.88rem' }}>
                        <CheckCircle2 size={16} color="#34d399" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {/* Matched Preferred Skills */}
                    {detail.match_details?.skill_details?.matched_preferred?.map((sk, idx) => (
                      <div key={`mpref-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.88rem' }}>
                        <Sparkles size={16} color="#38bdf8" />
                        <span>{sk} (Preferred)</span>
                      </div>
                    ))}

                    {/* Missing Required Skills */}
                    {detail.match_details?.skill_details?.missing_required?.map((sk, idx) => (
                      <div key={`missreq-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.88rem' }}>
                        <XCircle size={16} color="#f87171" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {/* Missing Preferred Skills */}
                    {detail.match_details?.skill_details?.missing_preferred?.map((sk, idx) => (
                      <div key={`misspref-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <X size={15} color="var(--text-dim)" />
                        <span>{sk} (Preferred missing)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience & Education Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Experience Card */}
                  <div className="glass-panel" style={{ padding: '16px 20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                      <Briefcase size={16} /> Experience Breakdown
                    </h4>
                    {(() => {
                      const exp = getExperienceDisplay(detail.match_details, detail.full_profile);
                      return (
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Relevant: </span>
                            <strong style={{ color: '#34d399' }}>{exp.relevant} years</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Total: </span>
                            <strong style={{ color: 'var(--text-main)' }}>{exp.total} years</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Education Card */}
                  <div className="glass-panel" style={{ padding: '16px 20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}>
                      <GraduationCap size={16} /> Education
                    </h4>
                    {(() => {
                      const edu = getEducationDisplay(detail.full_profile);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                          <span>{edu.text}</span>
                          {edu.valid ? (
                            <CheckCircle2 size={16} color="#34d399" />
                          ) : (
                            <AlertCircle size={16} color="#fbbf24" />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps Explanations */}
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Brain size={18} color="var(--primary)" /> AI Recruiter Explainability & Insights
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Strengths */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Strengths
                    </div>
                    <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {detail.reasoning?.strengths?.map((s, idx) => (
                        <li key={idx} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#34d399' }}>•</span> {s}
                        </li>
                      )) || <li style={{ color: 'var(--text-muted)' }}>None noted</li>}
                    </ul>
                  </div>

                  {/* Gaps */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> Gaps & Missing Requirements
                    </div>
                    <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {detail.reasoning?.gaps?.map((g, idx) => (
                        <li key={idx} style={{ marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#f87171' }}>•</span> {g}
                        </li>
                      )) || <li style={{ color: 'var(--text-muted)' }}>None noted</li>}
                    </ul>
                  </div>
                </div>

                {detail.reasoning?.reasoning && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-main)' }}>Summary: </strong>{detail.reasoning.reasoning}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
