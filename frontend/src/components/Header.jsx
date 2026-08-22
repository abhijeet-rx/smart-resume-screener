import { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Key, Layers, Briefcase, UploadCloud, BarChart2 } from 'lucide-react';
import { api, getApiKey, setApiKey } from '../api';

export default function Header({ activeTab, setActiveTab }) {
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking...' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());

  const checkHealthStatus = async () => {
    setHealth({ status: 'checking', message: 'Checking...' });
    try {
      const res = await api.checkHealth();
      if (res.status === 'ok') {
        setHealth({ status: 'online', message: `API Online (${res.version || 'v0.2.0'})` });
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
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm tracking-tight">Smart Resume Screener</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Deterministic Matching + Semantic Candidate Ranking</p>
            </div>
          </div>

          {/* Navigation Tabs (Sleek Linear/Vercel Pill Design) */}
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                health.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : health.status === 'checking'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
              title="Click to recheck backend API status"
            >
              {health.status === 'online' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : health.status === 'checking' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">{health.message}</span>
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">{getApiKey() ? 'API Key Set' : 'Set Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">API Key Configuration</h3>
            </div>
            <p className="text-xs text-slate-400">
              If your backend has authorization enabled via <code className="text-indigo-400">API_KEY</code>, enter it below to authorize all request headers.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">X-API-Key Header</label>
              <input
                type="password"
                placeholder="Leave empty if auth is disabled in dev mode"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
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
