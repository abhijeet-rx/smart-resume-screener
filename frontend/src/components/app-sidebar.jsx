import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { CheckCircle2, AlertCircle, RefreshCw, Key, Layers, Briefcase, UploadCloud, BarChart2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import SkillSyncLogo from './SkillSyncLogo';
import { api, getApiKey, setApiKey } from '../api';

export function AppSidebar({ activeTab, setActiveTab }) {
  const { open, toggleSidebar } = useSidebar();
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
    { id: 'dashboard', label: 'Leaderboard', icon: <Layers className="w-4 h-4 shrink-0" /> },
    { id: 'jobs', label: 'Job Descriptions', icon: <Briefcase className="w-4 h-4 shrink-0" /> },
    { id: 'screener', label: 'Screening Hub', icon: <UploadCloud className="w-4 h-4 shrink-0" /> },
    { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart2 className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <>
      <Sidebar>
        {/* Header: Logo & App Brand */}
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7b39fc] flex items-center justify-center shadow-lg shadow-[rgba(123,57,252,0.35)] border border-[#9256ff]/30 shrink-0">
              <SkillSyncLogo className="w-5 h-6 text-white" />
            </div>
            {open && (
              <div className="overflow-hidden transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="font-manrope font-extrabold text-white text-base tracking-tight whitespace-nowrap">
                    SkillSync
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-white/50 font-inter truncate max-w-[145px]" title="Matching potential, not just paper">
                    Matching potential, not just paper
                  </span>
                </div>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Content: Main Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setActiveTab(item.id)}
                        title={item.label}
                      >
                        {item.icon}
                        {open && <span className="truncate">{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer: Health Status, API Key & Toggle */}
        <SidebarFooter>
          {/* Health Status Button */}
          <button
            onClick={checkHealthStatus}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-cabin font-medium border transition-all cursor-pointer ${
              !open && 'justify-center px-2'
            } ${
              health.status === 'online'
                ? 'bg-[rgba(16,185,129,0.15)] text-[#34d399] border-[rgba(16,185,129,0.35)] hover:bg-[rgba(16,185,129,0.25)]'
                : health.status === 'checking'
                ? 'bg-[#2b2344]/50 text-white/50 border-[rgba(164,132,215,0.2)]'
                : 'bg-[rgba(244,63,94,0.15)] text-[#f87171] border-[rgba(244,63,94,0.35)] hover:bg-[rgba(244,63,94,0.25)]'
            }`}
            title={health.message}
          >
            {health.status === 'online' ? (
              <span className="w-2 h-2 rounded-full bg-[#34d399] pulse-dot inline-block shrink-0" />
            ) : health.status === 'checking' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white/50 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#f87171] pulse-dot inline-block shrink-0" />
            )}
            {open && <span className="truncate">{health.message}</span>}
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-cabin font-medium text-white/70 bg-[#2b2344]/50 border border-[rgba(164,132,215,0.2)] hover:border-[rgba(164,132,215,0.4)] hover:bg-[#2b2344]/70 transition-colors cursor-pointer ${
              !open && 'justify-center px-2'
            }`}
            title="Configure API Key"
          >
            <Key className="w-3.5 h-3.5 text-white/50 shrink-0" />
            {open && <span className="truncate">{getApiKey() ? 'API Key Set' : 'Set API Key'}</span>}
          </button>

          {/* Toggle Sidebar Collapse Button */}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-manrope text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer mt-1"
            title={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {open ? (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse Bar</span>
              </>
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </SidebarFooter>
      </Sidebar>

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
    </>
  );
}
