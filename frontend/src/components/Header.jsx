import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Key, Layers, Briefcase, UploadCloud, BarChart2 } from 'lucide-react';
import { api, getApiKey, setApiKey } from '../api';
import SkillSyncLogo from './SkillSyncLogo';

export default function Header({ activeTab, setActiveTab }) {
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking...' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());

  const checkHealthStatus = async () => {
    setHealth({ status: 'checking', message: 'Checking...' });
    try {
      const res = await api.checkHealth();
      if (res.status === 'ok') {
        setHealth({ status: 'online', message: `API Online (${res.version || 'v1.0'})` });
      } else {
        setHealth({ status: 'error', message: 'API Error' });
      }
    } catch (err) {
      setHealth({ status: 'error', message: 'Backend Offline' });
    }
  };

  useEffect(() => {
    checkHealthStatus();
  }, []);

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput.trim());
    setShowKeyModal(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Leaderboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'jobs', label: 'Job Descriptions', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'screener', label: 'Screening Hub', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-[rgba(164,132,215,0.2)] bg-[#2b2344]/60 backdrop-blur-xl sticky top-0 z-50 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7b39fc] flex items-center justify-center shadow-lg shadow-[rgba(123,57,252,0.35)] border border-[#9256ff]/30">
              <SkillSyncLogo className="w-5 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-manrope font-extrabold text-white text-base tracking-tight">SkillSync</span>
              </div>
              <p className="text-[11px] text-white/50 font-inter hidden sm:block">Matching potential, not just paper</p>
            </div>
          </div>

          {/* Navigation Tabs (Glassmorphic Pill Design) */}
          <nav className="flex items-center bg-[#18112b] p-1 rounded-xl border border-[rgba(164,132,215,0.2)]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-manrope font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#7b39fc] text-white shadow-[0_4px_14px_rgba(123,57,252,0.4)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status & Key Settings */}
          <div className="flex items-center gap-2">
            {/* Health Status Pill */}
            <button
              onClick={checkHealthStatus}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-cabin font-medium border transition-colors cursor-pointer ${
                health.status === 'online'
                  ? 'bg-[rgba(16,185,129,0.15)] text-[#34d399] border-[rgba(16,185,129,0.35)] hover:bg-[rgba(16,185,129,0.25)]'
                  : health.status === 'checking'
                  ? 'bg-[#2b2344]/50 text-white/50 border-[rgba(164,132,215,0.2)]'
                  : 'bg-[rgba(244,63,94,0.15)] text-[#f87171] border-[rgba(244,63,94,0.35)] hover:bg-[rgba(244,63,94,0.25)]'
              }`}
              title="Click to recheck backend API status"
            >
              {health.status === 'online' ? (
                <span className="w-2 h-2 rounded-full bg-[#34d399] pulse-dot inline-block" />
              ) : health.status === 'checking' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white/50" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#f87171] pulse-dot inline-block" />
              )}
              <span className="hidden sm:inline">{health.message}</span>
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-cabin font-medium text-white/70 bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] hover:border-[rgba(164,132,215,0.4)] hover:bg-[#2b2344]/70 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-white/50" />
              <span className="hidden lg:inline">{getApiKey() ? 'API Key Set' : 'Set Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-[#0e091b]/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="glass-surface rounded-2xl max-w-md w-full p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7b39fc]/15 text-[#7b39fc] flex items-center justify-center border border-[#7b39fc]/30">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-manrope font-bold text-white">API Key Configuration</h3>
            </div>
            <p className="text-xs text-white/60 font-inter">
              If your backend has authorization enabled via <code className="text-[#7b39fc]">API_KEY</code>, enter it below to authorize all request headers.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-manrope font-medium text-white/50">X-API-Key Header</label>
              <input
                type="password"
                placeholder="Leave empty if auth is disabled in dev mode"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-inter glass-input rounded-lg text-white/90 placeholder:text-white/30"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-cabin font-medium text-white/50 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-3.5 py-1.5 rounded-lg text-xs font-cabin font-medium bg-[#7b39fc] text-white hover:bg-[#6a2ee6] shadow-[0_4px_14px_rgba(123,57,252,0.3)] cursor-pointer transition-colors"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
