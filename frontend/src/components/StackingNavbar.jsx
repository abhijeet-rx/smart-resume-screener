import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, UploadCloud, Trophy, Key } from 'lucide-react';

export default function StackingNavbar({ activeTab, setActiveTab, onOpenKeyModal }) {
  const [expanded, setExpanded] = useState(false);

  const items = [
    {
      id: 'jobs',
      label: 'Jobs & Candidates',
      icon: <Layers size={16} />,
      onClick: () => setActiveTab('jobs'),
      active: activeTab === 'jobs',
    },
    {
      id: 'screener',
      label: 'Batch Screener',
      icon: <UploadCloud size={16} />,
      onClick: () => {
        setActiveTab('jobs');
        const el = document.getElementById('batch-screener-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      active: false,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: <Trophy size={16} />,
      onClick: () => {
        setActiveTab('jobs');
        const el = document.getElementById('leaderboard-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      active: false,
    },
    {
      id: 'settings',
      label: 'API Key',
      icon: <Key size={16} />,
      onClick: onOpenKeyModal,
      active: false,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        padding: '4px 8px',
        borderRadius: '9999px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {items.map((item, index) => (
        <StackingNavbarItem
          key={item.id}
          item={item}
          expanded={expanded}
          index={index}
        />
      ))}
    </div>
  );
}

function StackingNavbarItem({ item, expanded, index }) {
  const overlapOffset = 70; // amount of overlap when collapsed

  return (
    <motion.div
      initial={{ x: -overlapOffset * index }}
      animate={{ x: expanded ? 0 : -overlapOffset * index }}
      transition={{
        duration: 0.5,
        ease: 'circInOut',
        delay: 0.05 * index,
        type: 'spring',
        stiffness: 260,
        damping: 24,
      }}
      style={{
        zIndex: 100 - index,
        marginRight: expanded ? '6px' : '0px',
      }}
    >
      <button
        onClick={item.onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          border: item.active
            ? '1px solid rgba(99, 102, 241, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          background: item.active
            ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            : 'rgba(255, 255, 255, 0.06)',
          color: item.active ? '#ffffff' : 'var(--text-muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(12px)',
          boxShadow: item.active
            ? '0 4px 14px rgba(99, 102, 241, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!item.active) {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!item.active) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    </motion.div>
  );
}
