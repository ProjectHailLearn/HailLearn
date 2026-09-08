import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  ThumbsUp,
  Eye,
  CheckCircle2,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { MOCK_KNOWLEDGE_VAULT } from '../constants/mockData';

export const KnowledgeVaultPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    'ALL',
    'Database Systems',
    'Operating Systems',
    'Artificial Intelligence',
    'Algorithms',
  ];

  const filteredItems = MOCK_KNOWLEDGE_VAULT.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat =
      selectedCategory === 'ALL' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Institutional Knowledge Base & RAG Vault
          </h1>
          <p className="text-xs text-slate-400">
            Semantic repository of verified lecture notes, course cheat sheets, and past solved doubt syntheses
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
          <Sparkles className="w-4 h-4" />
          <span>Vector Similarity Search Active</span>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <Card variant="glass" className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, vector embeddings (e.g. 'B-Tree LSM trade-off', 'jemalloc arena')..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Subjects' : cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Knowledge Articles List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            variant="glass"
            className="p-5 hover:border-emerald-500/30 transition-all duration-300 group cursor-pointer"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {item.courseCode}
                </span>
                <span className="text-xs text-slate-400">• {item.category}</span>
                {item.verificationBadge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Faculty Verified
                  </span>
                )}
              </div>

              {item.similarityScore && (
                <span className="text-xs font-mono font-medium text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {(item.similarityScore * 100).toFixed(0)}% Vector Match
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition mb-2 flex items-center justify-between">
              <span>{item.title}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition flex-shrink-0" />
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {item.snippet}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Author: {item.author}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 hover:text-emerald-400 transition">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {item.upvotes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {item.views}
                </span>
                <span>Updated {item.lastUpdated}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
