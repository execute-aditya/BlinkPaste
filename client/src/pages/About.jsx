import { Link } from 'react-router-dom'
import { ShieldCheck, Zap, Flame, Lock, Layers, ArrowLeft, Cpu, Radio, Sparkles } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-[#08080E] text-[#EEEDF5] flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Ambient Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true" 
      />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex justify-between items-center z-10 py-4 mb-8">
        <Link to="/" className="flex items-center gap-2 text-white font-display text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          <span>BlinkPaste</span>
          <span className="text-accent-primary font-mono text-sm px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20">v2.0</span>
        </Link>

        <Link 
          to="/" 
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl z-10 flex flex-col gap-12 my-auto">
        
        {/* Hero Banner */}
        <section className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-accent-primary mb-2">
            <Sparkles size={14} />
            <span>Ephemeral & Zero-Knowledge Communication</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
            Share anything safely.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-emerald-300 to-purple-400">
              Gone without a trace.
            </span>
          </h1>
          <p className="max-w-2xl text-white/60 text-base sm:text-lg leading-relaxed">
            BlinkPaste is a high-speed, temporary workspace for syncing clipboard text, sending real-time messages, sharing files, and storing self-destructing secrets across devices—completely encrypted in your browser.
          </p>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard 
            icon={Lock}
            iconColor="text-emerald-400"
            title="End-to-End Encryption"
            description="All content is encrypted client-side using AES-GCM (256-bit) with keys derived via PBKDF2 from your session passcode. The server only sees ciphertext."
          />
          <FeatureCard 
            icon={Radio}
            iconColor="text-accent-primary"
            title="Real-Time WebSocket Sync"
            description="Instantaneous cross-device synchronization powered by Supabase Realtime channels. Paste on your phone, receive on your laptop in milliseconds."
          />
          <FeatureCard 
            icon={Flame}
            iconColor="text-purple-400"
            title="Self-Destructing Data"
            description="Configure secrets and messages to burn after 1 view or timer duration. Expired sessions and data are automatically purged via PostgreSQL cascades."
          />
        </section>

        {/* Technical Architecture Overview */}
        <section className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">How BlinkPaste Works</h3>
              <p className="text-xs text-white/50">Zero-persistence design pipeline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <StepItem step="1" title="Create Workspace" desc="Host defines session duration & custom passcode" />
            <StepItem step="2" title="Derive Key" desc="Client derives AES key locally with Web Crypto API" />
            <StepItem step="3" title="Sync Content" desc="Ciphertext streams over encrypted WebSocket channels" />
            <StepItem step="4" title="Auto Purge" desc="Session expires and PostgreSQL cascades full deletion" />
          </div>
        </section>

        {/* Trust Badge */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-6 glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="font-semibold text-white">Your Privacy is Guaranteed</h4>
              <p className="text-xs text-white/50">No accounts required • Zero tracking • Client-side encryption</p>
            </div>
          </div>

          <Link to="/" className="btn-primary w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl text-center">
            Start a Session Now
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl z-10 flex justify-between items-center py-6 text-xs text-white/40 border-t border-white/5 mt-12">
        <div>© 2026 BlinkPaste. Ephemeral Communication Platform.</div>
        <div className="flex gap-4">
          <Link to="/developer" className="hover:text-white transition-colors">Developer</Link>
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, iconColor, title, description }) {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3 group">
      <div className={`p-3 rounded-xl bg-white/5 w-fit ${iconColor} group-hover:scale-110 transition-transform`}>
        <Icon size={22} />
      </div>
      <h3 className="text-base font-bold text-white mt-1">{title}</h3>
      <p className="text-xs text-white/60 leading-relaxed">{description}</p>
    </div>
  )
}

function StepItem({ step, title, desc }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-wider">Step {step}</span>
      <span className="text-xs font-semibold text-white">{title}</span>
      <span className="text-[11px] text-white/40 leading-snug">{desc}</span>
    </div>
  )
}
