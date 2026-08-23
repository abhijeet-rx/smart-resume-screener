import SaaSTemplate from './ui/saa-s-template';

/**
 * LandingPage — uses the new SaaS landing template while preserving the
 * existing callback contract used by App.jsx.
 */
export default function LandingPage({ onEnterApp }) {
  return <SaaSTemplate onGetStarted={onEnterApp} />;
}
