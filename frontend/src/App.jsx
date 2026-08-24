import { useState } from 'react';
import JobManager from './components/JobManager';
import ResumeUploader from './components/ResumeUploader';
import CandidateLeaderboard from './components/CandidateLeaderboard';
import AnalyticsView from './components/AnalyticsView';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [refreshCandidatesTrigger, setRefreshCandidatesTrigger] = useState(0);

  const handleJobCreated = (newJob) => {
    setSelectedJobId(newJob.id);
    setRefreshCandidatesTrigger((prev) => prev + 1);
  };

  const handleScreeningComplete = () => {
    setRefreshCandidatesTrigger((prev) => prev + 1);
    // Auto-navigate to Leaderboard tab so user immediately sees candidate matches right after uploading
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 600);
  };

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
              {activeTab === 'jobs' && <span>Target <em>Job Roles</em></span>}
              {activeTab === 'dashboard' && <span>Candidate <em>Leaderboard</em></span>}
              {activeTab === 'screener' && <span>Batch <em>Screening Hub</em></span>}
              {activeTab === 'analytics' && <span>Screening <em>Analytics & Insights</em></span>}
            </h1>
          </div>
          <div className="text-xs text-white/40 font-inter hidden sm:block">
            SkillSync • Matching potential, not just paper
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {activeTab === 'jobs' && (
            <div className="space-y-6 animate-fade-in">
              <JobManager
                selectedJobId={selectedJobId}
                onSelectJob={setSelectedJobId}
                onJobCreated={handleJobCreated}
                refreshTrigger={refreshCandidatesTrigger}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <CandidateLeaderboard
                selectedJobId={selectedJobId}
                refreshTrigger={refreshCandidatesTrigger}
              />
            </div>
          )}

          {activeTab === 'screener' && (
            <div className="space-y-6 animate-fade-in">
              <ResumeUploader
                targetJobId={selectedJobId}
                onScreeningComplete={handleScreeningComplete}
              />

              <CandidateLeaderboard
                selectedJobId={selectedJobId}
                refreshTrigger={refreshCandidatesTrigger}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <AnalyticsView selectedJobId={selectedJobId} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[rgba(164,132,215,0.15)] py-6 px-4 text-center text-xs text-white/40 bg-[#0e091b] font-inter">
          SkillSync v1.0 • Matching potential, not just paper
        </footer>
      </div>
    </SidebarProvider>
  );
}

export default App;
