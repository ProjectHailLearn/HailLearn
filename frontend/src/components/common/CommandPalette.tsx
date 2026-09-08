import React, { useEffect, useState } from 'react';
import { Search, Sparkles, BookOpen, Users, GraduationCap, X, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCommandPaletteOpen } from '../../store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';

export const CommandPalette: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCommandPaletteOpen);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!isOpen));
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch(setCommandPaletteOpen(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'ask-ai',
      icon: Sparkles,
      title: 'Ask AI Doubt Resolver',
      subtitle: 'Instantly diagnose intent & get step-by-step solution',
      action: () => {
        dispatch(setCommandPaletteOpen(false));
        navigate('/doubts');
      },
      category: 'AI Assistant',
    },
    {
      id: 'find-mentor',
      icon: Users,
      title: 'Connect with a Peer or Faculty Mentor',
      subtitle: 'Browse 24+ available mentors in Algorithms & Systems',
      action: () => {
        dispatch(setCommandPaletteOpen(false));
        navigate('/mentorship');
      },
      category: 'Mentorship',
    },
    {
      id: 'knowledge-vault',
      icon: BookOpen,
      title: 'Search Institutional Knowledge Vault',
      subtitle: 'Explore 1,200+ verified solutions & lecture archives',
      action: () => {
        dispatch(setCommandPaletteOpen(false));
        navigate('/knowledge');
      },
      category: 'Knowledge Hub',
    },
    {
      id: 'active-courses',
      icon: GraduationCap,
      title: 'View Enrolled University Courses',
      subtitle: 'Track CS201, CS305, AI401 progress and unresolved doubts',
      action: () => {
        dispatch(setCommandPaletteOpen(false));
        navigate('/courses');
      },
      category: 'Academic',
    },
  ];

  const filteredActions = query
    ? quickActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden shadow-brand-500/10">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, concept (e.g. 'Dijkstra', 'Raft'), or search..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => dispatch(setCommandPaletteOpen(false))}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Suggestions
          </div>
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 group transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {action.title}
                      </div>
                      <div className="text-xs text-slate-400">{action.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-brand-400 transition" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
              ESC
            </span>
            <span>to close</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HailLearn Vector RAG Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
