import { useState, useEffect } from 'react';
import { Trophy, Users, CheckCircle2, AlertTriangle, Sparkles, TrendingUp, Award, Layers, Target, BarChart2 } from 'lucide-react';
import { api } from '../api';
import { getScoreColor } from '../utils';

export default function AnalyticsView({ selectedJobId }) {
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedJobId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await api.listCandidates(selectedJobId, 0, 100);
        setCandidates(data.candidates || []);
        setJobTitle(data.job_title || '');
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedJobId]);

  if (!selectedJobId) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center text-slate-400">
        <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">No Job Selected</h3>
        <p className="text-xs text-slate-400">Select a target job description to inspect pool analytics and candidate insights.</p>
      </div>
    );
  }

  const totalCandidates = candidates.length;
  const shortlistCount = candidates.filter((c) => ['SHORTLIST', 'STRONG_MATCH'].includes(c.recommendation?.toUpperCase())).length;
  const goodMatchCount = candidates.filter((c) => c.recommendation?.toUpperCase() === 'GOOD_MATCH').length;
  const reviewCount = candidates.filter((c) => ['REVIEW', 'PARTIAL_MATCH'].includes(c.recommendation?.toUpperCase())).length;
  const rejectCount = candidates.filter((c) => ['REJECT', 'NO_MATCH'].includes(c.recommendation?.toUpperCase())).length;

  const avgScore = totalCandidates > 0
    ? Math.round(candidates.reduce((acc, c) => acc + (c.final_score || 0), 0) / totalCandidates)
    : 0;

  const shortlistRate = totalCandidates > 0 ? Math.round((shortlistCount / totalCandidates) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" /> Screening Analytics for <span className="text-indigo-400">{jobTitle || 'Selected Job'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">High-level talent pool distribution, qualification rates, and scoring statistics.</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          Total Candidates Evaluated: <span className="font-bold text-slate-200">{totalCandidates}</span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Match Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2" style={{ color: getScoreColor(avgScore) }}>
            {avgScore}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all evaluated resumes</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortlist Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {shortlistRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{shortlistCount} of {totalCandidates} candidates qualified</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Good Matches</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2">
            {goodMatchCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Strong potential candidates</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {reviewCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Borderline fit candidates</div>
        </div>
      </div>

      {/* Recommendation Breakdown Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Recommendation Distribution</h3>
        {totalCandidates === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">No screened candidates available yet.</div>
        ) : (
          <div className="space-y-4">
            <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {shortlistCount > 0 && (
                <div style={{ width: `${(shortlistCount / totalCandidates) * 100}%` }} className="bg-emerald-500 h-full transition-all" title={`Shortlist: ${shortlistCount}`} />
              )}
              {goodMatchCount > 0 && (
                <div style={{ width: `${(goodMatchCount / totalCandidates) * 100}%` }} className="bg-cyan-500 h-full transition-all" title={`Good Match: ${goodMatchCount}`} />
              )}
              {reviewCount > 0 && (
                <div style={{ width: `${(reviewCount / totalCandidates) * 100}%` }} className="bg-amber-500 h-full transition-all" title={`Review: ${reviewCount}`} />
              )}
              {rejectCount > 0 && (
                <div style={{ width: `${(rejectCount / totalCandidates) * 100}%` }} className="bg-rose-500 h-full transition-all" title={`Reject: ${rejectCount}`} />
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Shortlist: <strong className="text-slate-200">{shortlistCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-slate-400">Good Match: <strong className="text-slate-200">{goodMatchCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">Review: <strong className="text-slate-200">{reviewCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-400">Reject: <strong className="text-slate-200">{rejectCount}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
