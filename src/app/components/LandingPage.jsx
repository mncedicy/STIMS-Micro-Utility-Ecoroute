// src/app/components/LandingPage.jsx

'use client';

import LandingHero from './landing/LandingHero';
import Contact from './contact/Contact';
import AuthScreen from './auth/AuthScreen';
import Footer from './shared/Footer';

export default function LandingPage({
  showAuthGateModal,
  setShowAuthGateModal,
  activeApplicationMeta,
  loadData,
  isVerifiedRedirect,
  setActiveViewPage,
}) {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 antialiased relative flex flex-col justify-between selection:bg-blue-500 selection:text-slate-950">
      {!showAuthGateModal ? (
        <>
          <LandingHero onGetStartedClick={() => setShowAuthGateModal(true)} appMeta={activeApplicationMeta} />
          <Contact user={null} profile={null} />
        </>
      ) : (
        <main className="w-full flex-grow flex items-center justify-center p-4 relative z-10 pt-16 animate-fade-in">
          <div className="w-full max-w-md relative space-y-4">
            <AuthScreen onAuthSuccess={loadData} isVerifiedRedirect={isVerifiedRedirect} />
            <button type="button" onClick={() => setShowAuthGateModal(false)} className="w-full text-center text-slate-500 hover:text-slate-300 font-mono text-[10px] uppercase tracking-widest bg-transparent border-none outline-none py-1 cursor-pointer transition-colors">◀ return to landing overview</button>
          </div>
        </main>
      )}
      <Footer onNavigateViewPage={setActiveViewPage} />
    </div>
  );
}