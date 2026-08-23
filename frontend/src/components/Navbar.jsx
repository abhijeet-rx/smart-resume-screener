import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import SkillSyncLogo from './SkillSyncLogo';

/**
 * Transparent overlay Navbar for the hero landing page.
 * Props:
 *   onSignIn   — callback to navigate into the dashboard
 *   onGetStarted — callback to navigate into the dashboard
 */
export default function Navbar({ onSignIn, onGetStarted }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Services', href: '#', hasDropdown: true },
    { label: 'Reviews', href: '#' },
    { label: 'Contact us', href: '#' },
  ];

  return (
    <nav className="relative z-20 w-full px-6 lg:px-[120px] py-4">
      <div className="flex items-center justify-between">

        {/* ── Logo (Left) ── */}
        <a href="#" className="flex items-center gap-2.5 shrink-0" aria-label="Home">
          <SkillSyncLogo className="w-8 h-9 text-white" />
          <span className="font-manrope font-extrabold text-white text-xl tracking-tight">
            SkillSync
          </span>
        </a>

        {/* ── Desktop Navigation Links (Center-Left) ── */}
        <div className="hidden lg:flex items-center gap-8 ml-12">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-manrope font-medium text-sm text-white hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              {link.label}
              {link.hasDropdown && <ChevronDown className="w-4 h-4 opacity-70" />}
            </a>
          ))}
        </div>

        {/* ── Desktop Action Buttons (Right) ── */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="font-manrope font-semibold text-sm text-[#171717] bg-white border border-[#d4d4d4] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="font-manrope font-semibold text-sm text-[#fafafa] bg-[#7b39fc] rounded-lg px-5 py-2 shadow-lg shadow-purple-600/20 hover:bg-[#6a2ee6] transition-colors cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-white p-1 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── Mobile Full-Screen Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 mobile-menu-enter flex flex-col">
          {/* Close */}
          <div className="flex justify-end p-6">
            <button
              onClick={() => setMobileOpen(false)}
              className="text-white p-1 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* Links */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-manrope font-medium text-2xl text-white hover:opacity-80 transition-opacity"
              >
                {link.label}
              </a>
            ))}

            <div className="flex flex-col items-center gap-4 mt-8 w-64">
              <button
                onClick={() => { setMobileOpen(false); onSignIn?.(); }}
                className="w-full font-manrope font-semibold text-base text-[#171717] bg-white border border-[#d4d4d4] rounded-lg px-5 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileOpen(false); onGetStarted?.(); }}
                className="w-full font-manrope font-semibold text-base text-[#fafafa] bg-[#7b39fc] rounded-lg px-5 py-3 shadow-lg shadow-purple-600/20 hover:bg-[#6a2ee6] transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
