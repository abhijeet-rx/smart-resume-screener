import { useState, useEffect } from 'react';
import { Trophy, Users, CheckCircle2, AlertTriangle, Sparkles, TrendingUp, Award, Layers, Target, BarChart2 } from 'lucide-react';
import { api } from '../api';
import { getScoreColor } from '../utils';
import { NumberTicker } from '@/components/ui/number-ticker';

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
      <div className="glass-card rounded-2xl p-12 text-center text-white/50">
        <Target className="w-12 h-12 text-white/15 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-white mb-1">No Job Selected</h3>
        <p className="text-xs text-white/50 font-inter">Select a target job description to inspect pool analytics and candidate insights.</p>
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
      <div className="flex items-center justify-between border-b border-[rgba(164,132,215,0.15)] pb-4">
        <div>
          <h2 className="font-serif text-xl text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#7b39fc]" /> Screening Analytics <em>for</em> <span className="text-[#7b39fc]">{jobTitle || 'Selected Job'}</span>
          </h2>
          <p className="text-xs text-white/50 font-inter mt-1">High-level talent pool distribution, qualification rates, and scoring statistics.</p>
        </div>
        <div className="text-xs text-white/50 font-inter bg-[#2b2344]/50 px-3 py-1.5 rounded-lg border border-[rgba(164,132,215,0.2)]">
          Total Candidates Evaluated: <span className="font-manrope font-bold text-white"><NumberTicker value={totalCandidates} /></span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7b39fc]/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-manrope font-semibold text-white/40 uppercase tracking-wider">Avg Match Score</span>
              <TrendingUp className="w-4 h-4 text-[#34d399]" />
            </div>
            <div className="text-3xl font-serif font-extrabold mt-2" style={{ color: getScoreColor(avgScore) }}>
              <NumberTicker value={avgScore} />%
            </div>
            <div className="text-[11px] text-white/40 font-inter mt-1">Across all evaluated resumes</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#34d399]/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-manrope font-semibold text-white/40 uppercase tracking-wider">Shortlist Rate</span>
              <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
            </div>
            <div className="text-3xl font-serif font-extrabold text-[#34d399] mt-2">
              <NumberTicker value={shortlistRate} />%
            </div>
            <div className="text-[11px] text-white/40 font-inter mt-1">{shortlistCount} of {totalCandidates} candidates qualified</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-manrope font-semibold text-white/40 uppercase tracking-wider">Good Matches</span>
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div className="text-3xl font-serif font-extrabold text-[#38bdf8] mt-2">
              <NumberTicker value={goodMatchCount} />
            </div>
            <div className="text-[11px] text-white/40 font-inter mt-1">Strong potential candidates</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-manrope font-semibold text-white/40 uppercase tracking-wider">Review Required</span>
              <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
            </div>
            <div className="text-3xl font-serif font-extrabold text-[#fbbf24] mt-2">
              <NumberTicker value={reviewCount} />
            </div>
            <div className="text-[11px] text-white/40 font-inter mt-1">Borderline fit candidates</div>
          </div>
        </div>
      </div>

      {/* Recommendation Breakdown Bar */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-manrope font-semibold text-white mb-3">Recommendation Distribution</h3>
        {totalCandidates === 0 ? (
          <div className="text-xs text-white/40 font-inter py-4 text-center">No screened candidates available yet.</div>
        ) : (
          <div className="space-y-4">
            <div className="h-4 bg-[#0e091b] rounded-full overflow-hidden flex border border-[rgba(164,132,215,0.15)]">
              {shortlistCount > 0 && (
                <div style={{ width: `${(shortlistCount / totalCandidates) * 100}%` }} className="bg-[#34d399] h-full transition-all" title={`Shortlist: ${shortlistCount}`} />
              )}
              {goodMatchCount > 0 && (
                <div style={{ width: `${(goodMatchCount / totalCandidates) * 100}%` }} className="bg-[#38bdf8] h-full transition-all" title={`Good Match: ${goodMatchCount}`} />
              )}
              {reviewCount > 0 && (
                <div style={{ width: `${(reviewCount / totalCandidates) * 100}%` }} className="bg-[#fbbf24] h-full transition-all" title={`Review: ${reviewCount}`} />
              )}
              {rejectCount > 0 && (
                <div style={{ width: `${(rejectCount / totalCandidates) * 100}%` }} className="bg-[#f87171] h-full transition-all" title={`Reject: ${rejectCount}`} />
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-inter">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#34d399]" />
                <span className="text-white/50">Shortlist: <strong className="text-white/90">{shortlistCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                <span className="text-white/50">Good Match: <strong className="text-white/90">{goodMatchCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
                <span className="text-white/50">Review: <strong className="text-white/90">{reviewCount}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f87171]" />
                <span className="text-white/50">Reject: <strong className="text-white/90">{rejectCount}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
