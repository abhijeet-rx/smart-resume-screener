/**
 * HeroSection — full-screen hero with video background and centered CTA content.
 *
 * Props:
 *   onGetStarted — callback when "Get Started Now" CTA is clicked
 *   onBookDemo   — callback when "Book a Free Demo" CTA is clicked (optional)
 */
export default function HeroSection({ onGetStarted, onBookDemo }) {
  const VIDEO_URL =
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4';

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col">

      {/* ── Video Background (absolute, covers viewport) ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover animate-hero-video"
        src={VIDEO_URL}
      />

      {/* ── Hero Content (centered on top of video) ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 mt-32 mb-20">

        {/* Tagline Pill */}
        <div className="glass-pill rounded-[10px] h-[38px] flex items-center gap-2 px-1.5 pr-4 animate-hero-fade-in">
          <span className="bg-[#7b39fc] text-white font-cabin font-medium text-xs rounded-[6px] px-2.5 py-0.5">
            New
          </span>
          <span className="font-cabin font-medium text-sm text-white">
            Say Hello to Datacore v3.2
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-white text-5xl md:text-7xl lg:text-[96px] leading-[1.1] mt-8 max-w-5xl animate-hero-fade-in-delay-1">
          Screen your ideal{' '}
          <br className="hidden sm:block" />
          candidates instantly{' '}
          <em className="mx-1">and</em>{' '}
          <br className="hidden sm:block" />
          hassle-free
        </h1>

        {/* Subtext */}
        <p className="font-inter font-normal text-lg text-white/70 mt-6 max-w-[662px] leading-relaxed animate-hero-fade-in-delay-2">
          Upload resumes and job descriptions to get AI-powered scoring, skill matching,
          and ranked candidate recommendations. Fast screening, 24/7 support.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 animate-hero-fade-in-delay-3">
          <button
            onClick={onBookDemo}
            className="font-cabin font-medium text-base text-white bg-[#7b39fc] rounded-[10px] px-7 py-3.5 shadow-lg shadow-purple-600/25 hover:bg-[#6a2ee6] transition-colors cursor-pointer"
          >
            Book a Free Demo
          </button>
          <button
            onClick={onGetStarted}
            className="font-cabin font-medium text-base text-[#f6f7f9] bg-[#2b2344] rounded-[10px] px-7 py-3.5 hover:bg-[#3d3460] transition-colors cursor-pointer"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}
