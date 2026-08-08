import { Link } from 'react-router-dom'
import { Code2, Cpu, Terminal, ArrowLeft, ExternalLink, ShieldCheck, Database, Layers, Sparkles, UserCheck, Globe } from 'lucide-react'

export default function Developer() {
  return (
    <div className="min-h-screen bg-[#08080E] text-[#EEEDF5] flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background Ambient Lights */}
      <div 
        className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true" 
      />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex justify-between items-center z-10 py-4 mb-8">
        <Link to="/" className="flex items-center gap-2 text-white font-display text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          <span>BlinkPaste</span>
          <span className="text-purple-400 font-mono text-xs px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">Developer Hub</span>
        </Link>

        <Link 
          to="/" 
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-4 rounded-xl border border-white/10 hover:border-white/20 transition-all"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl z-10 flex flex-col gap-10 my-auto">
        
        {/* Developer Profile Hero */}
        <section className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent relative overflow-hidden">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-accent-primary to-purple-500 p-0.5 shrink-0 shadow-xl shadow-accent-primary/10">
            <div className="w-full h-full bg-[#0D0D15] rounded-[14px] flex items-center justify-center text-white">
              <UserCheck size={48} className="text-accent-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-3 text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-mono text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20">
                Creator & Architect
              </span>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                v2.0 Ephemeral OS
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              Aditya Dhembare
            </h1>
            
            <p className="text-sm text-white/60 leading-relaxed max-w-xl">
              Software engineer passionate about high-performance real-time applications, zero-knowledge security architectures, and crafting sleek user experiences.
            </p>

            {/* Social & Action Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <GithubIcon size={15} />
                GitHub Profile
                <ExternalLink size={12} className="text-white/40" />
              </a>
              <a 
                href="https://in.linkedin.com/in/aditya-dhembare" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <LinkedinIcon size={15} className="text-sky-400" />
                LinkedIn Profile
                <ExternalLink size={12} className="text-white/40" />
              </a>
            </div>
          </div>
        </section>

        {/* Tech Stack Grid */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
            <Terminal size={14} className="text-accent-primary" />
            Core Technology Stack
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <TechTile name="React 18 + Vite" category="Frontend Logic" icon={Code2} color="text-sky-400" />
            <TechTile name="Web Crypto API" category="Client Encryption" icon={ShieldCheck} color="text-accent-primary" />
            <TechTile name="Supabase Realtime" category="WebSocket Engine" icon={Database} color="text-emerald-400" />
            <TechTile name="Deno Edge Runtime" category="Serverless Functions" icon={Cpu} color="text-purple-400" />
          </div>
        </section>

        {/* Architecture & Documentation Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Security Blueprint</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              BlinkPaste uses PBKDF2 (100,000 iterations) with SHA-256 to derive a 256-bit AES-GCM key from your session passcode right inside the browser. Plaintext never leaves your RAM.
            </p>
            <div className="mt-auto pt-2">
              <span className="text-[11px] font-mono text-accent-primary">Algorithm: AES-GCM-256 + PBKDF2</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Open Architecture</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Engineered with clean React hooks, state synchronization, storage bucket isolation, and automated database cleanup routines.
            </p>
            <div className="mt-auto pt-2">
              <span className="text-[11px] font-mono text-purple-300">Clean Architecture v2.0</span>
            </div>
          </div>
        </section>

        {/* Return Button */}
        <div className="text-center mt-4">
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold">
            Return to App
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl z-10 flex justify-between items-center py-6 text-xs text-white/40 border-t border-white/5 mt-12">
        <div>Designed & Developed by Aditya Dhembare</div>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-white transition-colors">About Platform</Link>
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  )
}

function TechTile({ name, category, icon: Icon, color }) {
  return (
    <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-col gap-2 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <Icon size={18} className={color} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60" />
      </div>
      <span className="text-xs font-bold text-white mt-1">{name}</span>
      <span className="text-[10px] text-white/40">{category}</span>
    </div>
  )
}

function GithubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
