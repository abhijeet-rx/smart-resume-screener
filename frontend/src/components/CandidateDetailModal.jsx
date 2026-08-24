import { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, XCircle, FileText, Mail, Phone, Sparkles, Brain, AlertCircle, Loader2, Briefcase, GraduationCap } from 'lucide-react';
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

  const renderBadge = (rec) => {
    switch (rec?.toUpperCase()) {
      case 'SHORTLIST':
      case 'STRONG_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cabin font-bold tracking-wide uppercase bg-[rgba(16,185,129,0.15)] text-[#34d399] border border-[rgba(16,185,129,0.35)]">
            <CheckCircle2 className="w-4 h-4" /> SHORTLIST
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cabin font-bold tracking-wide uppercase bg-[rgba(6,182,212,0.15)] text-[#38bdf8] border border-[rgba(6,182,212,0.35)]">
            <Sparkles className="w-4 h-4" /> GOOD MATCH
          </span>
        );
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cabin font-bold tracking-wide uppercase bg-[rgba(245,158,11,0.15)] text-[#fbbf24] border border-[rgba(245,158,11,0.35)]">
            <AlertCircle className="w-4 h-4" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cabin font-bold tracking-wide uppercase bg-[rgba(244,63,94,0.15)] text-[#f87171] border border-[rgba(244,63,94,0.35)]">
            <XCircle className="w-4 h-4" /> REJECT
          </span>
        );
    }
  };

  const getEducationDisplay = (profile) => {
    if (!profile || !profile.education || profile.education.length === 0) {
      return { text: 'No education specified', valid: false };
    }
    const main = profile.education[0];
    const degreeField = `${main.degree || ''} ${main.field || ''}`.trim();
    const inst = main.institution ? `at ${main.institution}` : '';
    const gradYear = main.graduation_year ? `(${main.graduation_year})` : '';

    const text = [degreeField, inst, gradYear].filter(Boolean).join(' ') || main.institution || 'Degree specified';
    const isCsStem = /computer|software|engineering|it|data|stem|cs|b\.tech|m\.tech|b\.s|m\.s|b\.e|bca|mca/i.test(text);
    return { text, valid: isCsStem };
  };

  const getExperienceDisplay = (matchDetails, profile) => {
    const relMonths = matchDetails?.relevant_experience_months ?? matchDetails?.total_experience_months ?? 0;
    let totMonths = matchDetails?.total_experience_months ?? 0;
    if (profile && profile.experience && profile.experience.length > 0) {
      const sum = profile.experience.reduce((acc, exp) => acc + (exp.duration_months || 0), 0);
      if (sum > totMonths) totMonths = sum;
    }
    return {
      relevant: (relMonths / 12).toFixed(1),
      total: (totMonths / 12).toFixed(1),
    };
  };

  return (
    <div className="fixed inset-0 bg-[#0e091b]/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1333] border border-[rgba(164,132,215,0.3)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[rgba(164,132,215,0.15)] flex items-center justify-between bg-[#0e091b]/50">
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-white/50 font-inter">
                <Loader2 className="w-4 h-4 animate-spin text-[#7b39fc]" /> Fetching Candidate Inspection Data...
              </div>
            ) : detail ? (
              <div>
                <h2 className="text-lg font-serif text-white">{detail.candidate_name || 'Anonymous Candidate'}</h2>
                <div className="flex items-center gap-4 text-xs text-white/50 font-inter mt-1 flex-wrap">
                  {detail.candidate_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-white/30" /> {detail.candidate_email}</span>}
                  {detail.candidate_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-white/30" /> {detail.candidate_phone}</span>}
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-white/30" /> {detail.resume_filename}</span>
                </div>
              </div>
            ) : (
              <h3 className="text-sm font-manrope font-bold text-white">Candidate Inspection</h3>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error ? (
            <div className="p-4 bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.35)] text-[#f87171] rounded-xl font-inter">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Match Score & Recommendation Card */}
              <div className="bg-[#0e091b]/60 border border-[rgba(164,132,215,0.2)] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-manrope font-semibold uppercase tracking-wider text-white/40">AI Recruiter Evaluation</span>
                  <div>{renderBadge(detail.recommendation)}</div>
                </div>

                {/* Score Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-inter font-semibold text-white/50">Overall Match Score</span>
                    <span className="text-xl font-serif font-extrabold" style={{ color: getScoreColor(detail.scores?.final_score) }}>
                      {Math.round(detail.scores?.final_score || 0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-[#0e091b] rounded-full overflow-hidden border border-[rgba(164,132,215,0.15)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(detail.scores?.final_score || 0)}%`,
                        backgroundColor: getScoreColor(detail.scores?.final_score),
                      }}
                    />
                  </div>
                </div>

                {/* Score Component Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-white/40 font-manrope font-medium">Skill Match (40%)</div>
                    <div className="text-sm font-serif font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.skill_score) }}>
                      {Math.round(detail.scores?.skill_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-white/40 font-manrope font-medium">Semantic (30%)</div>
                    <div className="text-sm font-serif font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.semantic_score) }}>
                      {Math.round(detail.scores?.semantic_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-white/40 font-manrope font-medium">Experience (20%)</div>
                    <div className="text-sm font-serif font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.experience_score) }}>
                      {Math.round(detail.scores?.experience_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-white/40 font-manrope font-medium">Education (10%)</div>
                    <div className="text-sm font-serif font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.education_score) }}>
                      {Math.round(detail.scores?.education_score || 0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Checklist & Experience / Education Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Skills Checklist Card */}
                <div className="bg-[#0e091b]/60 border border-[rgba(164,132,215,0.2)] rounded-xl p-4 space-y-3">
                  <h4 className="font-manrope font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#7b39fc]" /> Skill Overlap Breakdown
                  </h4>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {detail.match_details?.skill_details?.matched_required?.map((sk, idx) => (
                      <div key={`mreq-${idx}`} className="flex items-center gap-2 text-[#34d399] text-xs font-inter">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.matched_preferred?.map((sk, idx) => (
                      <div key={`mpref-${idx}`} className="flex items-center gap-2 text-[#38bdf8] text-xs font-inter">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk} (Preferred)</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.missing_required?.map((sk, idx) => (
                      <div key={`missreq-${idx}`} className="flex items-center gap-2 text-[#f87171] text-xs font-inter">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.missing_preferred?.map((sk, idx) => (
                      <div key={`misspref-${idx}`} className="flex items-center gap-2 text-white/30 text-xs font-inter">
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk} (Preferred missing)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience & Education Summary */}
                <div className="space-y-4">
                  {/* Experience */}
                  <div className="bg-[#0e091b]/60 border border-[rgba(164,132,215,0.2)] rounded-xl p-4 space-y-2">
                    <h4 className="font-manrope font-bold text-[#38bdf8] flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> Relevant Work Experience
                    </h4>
                    {(() => {
                      const exp = getExperienceDisplay(detail.match_details, detail.full_profile);
                      return (
                        <div className="flex gap-4 text-xs font-inter">
                          <div>
                            <span className="text-white/50">Relevant: </span>
                            <strong className="text-[#34d399]">{exp.relevant} yrs</strong>
                          </div>
                          <div>
                            <span className="text-white/50">Total: </span>
                            <strong className="text-white/90">{exp.total} yrs</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Education */}
                  <div className="bg-[#0e091b]/60 border border-[rgba(164,132,215,0.2)] rounded-xl p-4 space-y-2">
                    <h4 className="font-manrope font-bold text-[#fbbf24] flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" /> Educational Qualification
                    </h4>
                    {detail.full_profile?.education && detail.full_profile.education.length > 0 ? (
                      <div className="space-y-2">
                        {detail.full_profile.education.map((edu, idx) => {
                          const degreeField = `${edu.degree || ''} ${edu.field || ''}`.trim() || 'Degree';
                          return (
                            <div key={idx} className="text-xs font-inter space-y-0.5 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-semibold flex items-center gap-1.5">
                                  {degreeField}
                                </span>
                                {edu.graduation_year && (
                                  <span className="text-white/40 font-mono text-[11px]">{edu.graduation_year}</span>
                                )}
                              </div>
                              {edu.institution && (
                                <div className="text-[#38bdf8] font-medium text-[11px]">at {edu.institution}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-inter text-white/50">
                        <span>No education specified</span>
                        <AlertCircle className="w-4 h-4 text-[#fbbf24] shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps AI Reasoning */}
              <div className="bg-[#0e091b]/60 border border-[rgba(164,132,215,0.2)] rounded-xl p-5 space-y-4">
                <h4 className="font-manrope font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#7b39fc]" /> AI Recruiter Explainability & Insights
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <span className="font-cabin font-semibold text-[#34d399] flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                    </span>
                    <ul className="space-y-1 text-white/70 text-xs font-inter">
                      {detail.reasoning?.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#34d399]">•</span> {s}
                        </li>
                      )) || <li className="text-white/30">None noted</li>}
                    </ul>
                  </div>

                  {/* Gaps */}
                  <div className="space-y-2">
                    <span className="font-cabin font-semibold text-[#f87171] flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" /> Gaps & Missing Requirements
                    </span>
                    <ul className="space-y-1 text-white/70 text-xs font-inter">
                      {detail.reasoning?.gaps?.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#f87171]">•</span> {g}
                        </li>
                      )) || <li className="text-white/30">None noted</li>}
                    </ul>
                  </div>
                </div>

                {detail.reasoning?.reasoning && (
                  <div className="pt-3 border-t border-[rgba(164,132,215,0.15)] text-xs text-white/60 font-inter leading-relaxed">
                    <strong className="text-white/90">Summary: </strong>{detail.reasoning.reasoning}
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
