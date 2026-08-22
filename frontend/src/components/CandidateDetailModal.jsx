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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> SHORTLIST
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" /> GOOD MATCH
          </span>
        );
      case 'REVIEW':
      case 'PARTIAL_MATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-4 h-4" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
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
    const text = `${main.degree || ''} ${main.field || ''}`.trim() || 'Degree specified';
    const isCsStem = /computer|software|engineering|it|data|stem|cs/i.test(text);
    return { text, valid: isCsStem };
  };

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Fetching Candidate Inspection Data...
              </div>
            ) : detail ? (
              <div>
                <h2 className="text-lg font-bold text-slate-100">{detail.candidate_name || 'Anonymous Candidate'}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                  {detail.candidate_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {detail.candidate_email}</span>}
                  {detail.candidate_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {detail.candidate_phone}</span>}
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-500" /> {detail.resume_filename}</span>
                </div>
              </div>
            ) : (
              <h3 className="text-sm font-bold text-slate-100">Candidate Inspection</h3>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Match Score & Recommendation Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AI Recruiter Evaluation</span>
                  <div>{renderBadge(detail.recommendation)}</div>
                </div>

                {/* Score Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Overall Match Score</span>
                    <span className="text-xl font-extrabold" style={{ color: getScoreColor(detail.scores?.final_score) }}>
                      {Math.round(detail.scores?.final_score || 0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
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
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Skill Match (40%)</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.skill_score) }}>
                      {Math.round(detail.scores?.skill_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Semantic (30%)</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.semantic_score) }}>
                      {Math.round(detail.scores?.semantic_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Experience (20%)</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.experience_score) }}>
                      {Math.round(detail.scores?.experience_score || 0)}%
                    </div>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Education (10%)</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: getScoreColor(detail.scores?.education_score) }}>
                      {Math.round(detail.scores?.education_score || 0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Checklist & Experience / Education Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Skills Checklist Card */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" /> Skill Overlap Breakdown
                  </h4>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {detail.match_details?.skill_details?.matched_required?.map((sk, idx) => (
                      <div key={`mreq-${idx}`} className="flex items-center gap-2 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.matched_preferred?.map((sk, idx) => (
                      <div key={`mpref-${idx}`} className="flex items-center gap-2 text-cyan-400 text-xs">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk} (Preferred)</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.missing_required?.map((sk, idx) => (
                      <div key={`missreq-${idx}`} className="flex items-center gap-2 text-rose-400 text-xs">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk}</span>
                      </div>
                    ))}

                    {detail.match_details?.skill_details?.missing_preferred?.map((sk, idx) => (
                      <div key={`misspref-${idx}`} className="flex items-center gap-2 text-slate-500 text-xs">
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span>{sk} (Preferred missing)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience & Education Summary */}
                <div className="space-y-4">
                  {/* Experience */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> Relevant Work Experience
                    </h4>
                    {(() => {
                      const exp = getExperienceDisplay(detail.match_details, detail.full_profile);
                      return (
                        <div className="flex gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Relevant: </span>
                            <strong className="text-emerald-400">{exp.relevant} yrs</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Total: </span>
                            <strong className="text-slate-200">{exp.total} yrs</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Education */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" /> Educational Qualification
                    </h4>
                    {(() => {
                      const edu = getEducationDisplay(detail.full_profile);
                      return (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-200">{edu.text}</span>
                          {edu.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps AI Reasoning */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" /> AI Recruiter Explainability & Insights
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                    </span>
                    <ul className="space-y-1 text-slate-300 text-xs">
                      {detail.reasoning?.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span> {s}
                        </li>
                      )) || <li className="text-slate-500">None noted</li>}
                    </ul>
                  </div>

                  {/* Gaps */}
                  <div className="space-y-2">
                    <span className="font-semibold text-rose-400 flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" /> Gaps & Missing Requirements
                    </span>
                    <ul className="space-y-1 text-slate-300 text-xs">
                      {detail.reasoning?.gaps?.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span> {g}
                        </li>
                      )) || <li className="text-slate-500">None noted</li>}
                    </ul>
                  </div>
                </div>

                {detail.reasoning?.reasoning && (
                  <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-200">Summary: </strong>{detail.reasoning.reasoning}
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
