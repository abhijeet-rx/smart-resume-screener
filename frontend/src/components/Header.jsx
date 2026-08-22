import { useState, useEffect } from 'react';
import { Sparkles, Key, CheckCircle2, AlertCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { api, getApiKey, setApiKey } from '../api';

export default function Header({ activeTab, setActiveTab }) {
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking API...' });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());

  const checkHealthStatus = async () => {
    setHealth({ status: 'checking', message: 'Checking API...' });
    try {
      const res = await api.checkHealth();
      if (res.status === 'ok') {
        setHealth({ status: 'online', message: `Online (${res.version || 'v0.2.0'})` });
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

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 28px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Cpu size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Smart Resume Screener</h1>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                AI Engine
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Deterministic Matching + Semantic LLM Candidate Ranking
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('jobs')}
            className="btn"
            style={{
              background: activeTab === 'jobs' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'jobs' ? '#fff' : 'var(--text-muted)',
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}
          >
            <Layers size={16} /> Jobs & Candidates
          </button>
        </div>

        {/* Status & Key Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Health Pill */}
          <div 
            onClick={checkHealthStatus}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              borderRadius: '9999px', 
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: health.status === 'online' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${health.status === 'online' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: health.status === 'online' ? '#34d399' : '#f87171'
            }}
            title="Click to re-check API health"
          >
            {health.status === 'online' ? (
              <CheckCircle2 size={14} />
            ) : health.status === 'checking' ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <AlertCircle size={14} />
            )}
            <span>{health.message}</span>
          </div>

          {/* API Key Modal Button */}
          <button 
            onClick={() => setShowKeyModal(true)}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          >
            <Key size={14} />
            <span>{getApiKey() ? 'API Key Set' : 'Set API Key'}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="var(--primary)" /> API Key Configuration
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              If your backend has <code style={{ color: 'var(--accent-cyan)' }}>API_KEY</code> set in config, enter it below to authorize requests (sent via <code style={{ color: 'var(--accent-cyan)' }}>X-API-Key</code>).
            </p>
            <div className="form-group">
              <label className="form-label">X-API-Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="Leave empty if auth is disabled in dev mode"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowKeyModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveApiKey} className="btn btn-primary">Save Key</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
