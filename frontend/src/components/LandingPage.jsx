import Navbar from './Navbar';
import HeroSection from './HeroSection';

/**
 * LandingPage — composes the Navbar and HeroSection into one full-screen view.
 *
 * Props:
 *   onEnterApp — callback to transition from the landing page into the dashboard app
 */
export default function LandingPage({ onEnterApp }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2b2344]">

      {/* Video background lives inside HeroSection, so we layer navbar on top */}
      <div className="absolute inset-0 z-0">
        <HeroSection onGetStarted={onEnterApp} onBookDemo={onEnterApp} />
      </div>

      {/* Navbar overlays everything */}
      <div className="relative z-20">
        <Navbar onSignIn={onEnterApp} onGetStarted={onEnterApp} />
      </div>
    </div>
  );
}
