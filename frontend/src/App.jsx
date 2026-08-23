import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import JobManager from './components/JobManager';
import ResumeUploader from './components/ResumeUploader';
import CandidateLeaderboard from './components/CandidateLeaderboard';
import AnalyticsView from './components/AnalyticsView';

function App() {
  const [showHero, setShowHero] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [refreshCandidatesTrigger, setRefreshCandidatesTrigger] = useState(0);

  const handleJobCreated = (newJob) => {
    setSelectedJobId(newJob.id);
  };

  const handleScreeningComplete = () => {
    setRefreshCandidatesTrigger((prev) => prev + 1);
  };

  /* ── Hero Landing Page ── */
  if (showHero) {
    return <LandingPage onEnterApp={() => setShowHero(false)} />;
  }

  /* ── Dashboard App (existing, untouched) ── */
  return (
    <div className="min-h-screen flex flex-col bg-[#0e091b] text-slate-100 font-inter selection:bg-[#7b39fc] selection:text-white">
      {/* Top Navigation Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <JobManager
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onJobCreated={handleJobCreated}
            />

            <CandidateLeaderboard
              selectedJobId={selectedJobId}
              refreshTrigger={refreshCandidatesTrigger}
            />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fade-in">
            <JobManager
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onJobCreated={handleJobCreated}
            />
          </div>
        )}

        {activeTab === 'screener' && (
          <div className="space-y-6 animate-fade-in">
            <JobManager
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onJobCreated={handleJobCreated}
            />

            <ResumeUploader
              targetJobId={selectedJobId}
              onScreeningComplete={handleScreeningComplete}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <JobManager
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onJobCreated={handleJobCreated}
            />

            <AnalyticsView selectedJobId={selectedJobId} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(164,132,215,0.15)] py-6 px-4 text-center text-xs text-white/40 bg-[#0e091b] font-inter">
        Smart Resume Screener v0.2.0 • Enterprise Deterministic Matching + LLM Reasoning Pipeline
      </footer>
    </div>
  );
}

export default App;

