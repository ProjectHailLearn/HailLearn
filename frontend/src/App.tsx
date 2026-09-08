import React from 'react';
import { Sparkles, GraduationCap, Users, Cpu, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
              HailLearn
            </h1>
            <p className="text-sm text-slate-400 font-medium">The AI Learning Operating System for Universities</p>
          </div>
        </div>

        <p className="text-slate-300 text-lg leading-relaxed mb-8">
          HailLearn combines artificial intelligence with institutional human mentorship, turning every solved doubt into persistent institutional knowledge.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <Cpu className="w-4 h-4" /> AI Learning Engine
            </div>
            <p className="text-xs text-slate-400">Intent analysis, topic detection, and confidence scoring.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Users className="w-4 h-4" /> Adaptive Mentorship
            </div>
            <p className="text-xs text-slate-400">Intelligent fallback to peer mentors & domain experts.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" /> Knowledge Hub
            </div>
            <p className="text-xs text-slate-400">Semantic RAG storing summaries, concepts, and transcripts.</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Clean Architecture • Modular Micro-layers • Production Ready</span>
          </div>
          <span className="font-mono bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">v1.0.0-foundation</span>
        </div>
      </div>
    </div>
  );
};

export default App;
