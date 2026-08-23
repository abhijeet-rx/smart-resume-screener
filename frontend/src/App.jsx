import { useState } from 'react';
import LandingPage from './components/LandingPage';
import JobManager from './components/JobManager';
import ResumeUploader from './components/ResumeUploader';
import CandidateLeaderboard from './components/CandidateLeaderboard';
import AnalyticsView from './components/AnalyticsView';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

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

  /* ── Dashboard App with Sidebar Layout ── */
  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">

        {/* Top Sticky Bar with SidebarTrigger */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0e091b]/80 backdrop-blur-md border-b border-[rgba(164,132,215,0.15)] mb-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="font-serif text-lg text-white">
              {activeTab === 'dashboard' && <span>Candidate <em>Leaderboard</em></span>}
              {activeTab === 'jobs' && <span>Target <em>Job Roles</em></span>}
              {activeTab === 'screener' && <span>Batch <em>Screening Hub</em></span>}
              {activeTab === 'analytics' && <span>Screening <em>Analytics & Insights</em></span>}
            </h1>
          </div>
          <div className="text-xs text-white/40 font-inter hidden sm:block">
            Smart Resume Screener • Enterprise Matching
          </div>
        </header>

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
    </SidebarProvider>
  );
}

export default App;
