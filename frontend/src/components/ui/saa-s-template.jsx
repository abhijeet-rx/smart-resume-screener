import React from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const Button = React.forwardRef(
  ({ variant = 'default', size = 'default', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      default: 'bg-white text-black hover:bg-gray-100',
      secondary: 'bg-gray-800 text-white hover:bg-gray-700',
      ghost: 'text-white hover:bg-gray-800/50',
      gradient: 'bg-gradient-to-b from-white via-white/95 to-white/60 text-black hover:scale-105 active:scale-95',
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-10 px-5 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

const Navigation = React.memo(({ onGetStarted }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleAction = () => {
    setMobileMenuOpen(false);
    onGetStarted?.();
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAction}
            className="text-xl font-semibold tracking-tight text-white"
          >
            SmartScreener
          </button>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-8 md:flex">
            <a href="#getting-started" className="text-sm text-white/60 transition-colors hover:text-white">
              Getting started
            </a>
            <a href="#features" className="text-sm text-white/60 transition-colors hover:text-white">
              Features
            </a>
            <a href="#documentation" className="text-sm text-white/60 transition-colors hover:text-white">
              Documentation
            </a>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <Button type="button" variant="ghost" size="sm" onClick={handleAction}>
              Sign in
            </Button>
            <Button type="button" variant="default" size="sm" onClick={handleAction}>
              Get started
            </Button>
          </div>

          <button
            type="button"
            className="text-white md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-enter border-t border-gray-800/50 bg-black/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            <a href="#getting-started" className="py-2 text-sm text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Getting started
            </a>
            <a href="#features" className="py-2 text-sm text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#documentation" className="py-2 text-sm text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Documentation
            </a>
            <div className="flex flex-col gap-2 border-t border-gray-800/50 pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={handleAction}>Sign in</Button>
              <Button type="button" variant="default" size="sm" onClick={handleAction}>Get started</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = 'Navigation';

const Hero = React.memo(({ onGetStarted }) => {
  return (
    <section
      id="getting-started"
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-6 pb-20 pt-32 md:pt-36"
      style={{ animation: 'saa-fade-in 0.6s ease-out both' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.10),transparent_58%)]" />

      <aside className="relative z-10 mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 backdrop-blur-sm">
        <span className="whitespace-nowrap text-center text-xs text-gray-400">AI-powered resume screening is ready</span>
        <button
          type="button"
          onClick={onGetStarted}
          className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-400 transition-all hover:text-white active:scale-95"
        >
          Try it now
          <ArrowRight size={12} />
        </button>
      </aside>

      <h1
        className="relative z-10 mb-6 max-w-4xl px-6 text-center text-4xl font-medium leading-tight tracking-[-0.05em] text-transparent md:text-5xl lg:text-6xl"
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #ffffff, rgba(255,255,255,0.58))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Screen smarter. Hire better.
      </h1>

      <p className="relative z-10 mb-10 max-w-2xl px-6 text-center text-sm text-gray-400 md:text-base">
        Turn resumes into structured candidate intelligence with deterministic matching and AI-assisted reasoning.
      </p>

      <div className="relative z-10 mb-16 flex items-center gap-4">
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="flex items-center justify-center rounded-lg"
          onClick={onGetStarted}
        >
          Open screener
          <ArrowRight size={17} />
        </Button>
      </div>

      <div id="features" className="relative w-full max-w-5xl pb-10">
        <div
          className="pointer-events-none absolute left-1/2 top-[-23%] z-0 w-[90%] -translate-x-1/2"
          aria-hidden="true"
        >
          <img
            src="https://i.postimg.cc/Ss6yShGy/glows.png"
            alt=""
            className="h-auto w-full opacity-80"
            loading="eager"
          />
        </div>

        <div className="relative z-10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] shadow-2xl">
          <img
            src="https://i.postimg.cc/SKcdVTr1/Dashboard2.png"
            alt="Smart Resume Screener dashboard preview"
            className="h-auto w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default function SaaSTemplate({ onGetStarted }) {
  return (
    <main id="documentation" className="min-h-screen bg-black font-sans text-white">
      <Navigation onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
    </main>
  );
}
