import { useState } from 'react';
import Header from './components/Header';
import JobManager from './components/JobManager';
import ResumeUploader from './components/ResumeUploader';
import CandidateLeaderboard from './components/CandidateLeaderboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [refreshCandidatesTrigger, setRefreshCandidatesTrigger] = useState(0);

  const handleJobCreated = (newJob) => {
    setSelectedJobId(newJob.id);
  };

  const handleScreeningComplete = () => {
    setRefreshCandidatesTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 24px 48px' }}>
        {activeTab === 'jobs' ? (
          <div>
            {/* Job Descriptions Manager */}
            <JobManager
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              onJobCreated={handleJobCreated}
            />

            {/* Resume Upload & Batch Screening */}
            {selectedJobId && (
              <ResumeUploader
                targetJobId={selectedJobId}
                onScreeningComplete={handleScreeningComplete}
              />
            )}

            {/* Candidate Leaderboard & Rankings */}
            <CandidateLeaderboard
              selectedJobId={selectedJobId}
              refreshTrigger={refreshCandidatesTrigger}
            />
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 24px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(9, 13, 22, 0.8)'
      }}>
        Smart Resume Screener v0.2.0 • Deterministic Matching + LLM Reasoning Pipeline
      </footer>
    </div>
  );
}

export default App;
