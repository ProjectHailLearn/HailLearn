import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, FileText, ThumbsUp, Eye, ArrowUpRight } from 'lucide-react';
import { KnowledgeItem } from '../../types';
import { Button } from '../common/Button';

interface KnowledgeReaderProps {
  item: KnowledgeItem;
  onClose: () => void;
  onUpvote: (e: React.MouseEvent, item: KnowledgeItem) => void;
}

// Content is plain text: blank lines separate sections, and a section's first line is its heading.
const toSections = (text: string) =>
  text.split(/\n\s*\n/).map((block) => {
    const [first, ...rest] = block.split('\n');
    const isHeading = rest.length > 0 && first.length <= 80 && !/[.:;,]$/.test(first.trim());
    return isHeading ? { heading: first.trim(), body: rest.join('\n') } : { heading: null, body: block };
  });

export const KnowledgeReader: React.FC<KnowledgeReaderProps> = ({ item, onClose, onUpvote }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="knowledge-reader-title"
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-800">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {item.courseCode}
              </span>
              <span className="text-xs text-slate-400">{item.category}</span>
              {item.verificationBadge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Faculty Verified
                </span>
              )}
            </div>
            <h2 id="knowledge-reader-title" className="text-lg font-bold text-white leading-snug">{item.title}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="w-3.5 h-3.5" />
              <span>{item.author}</span>
              <span>· Updated {item.lastUpdated}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <p className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-sm text-slate-200 leading-relaxed">
            {item.snippet}
          </p>

          {item.content ? (
            toSections(item.content).map((section, i) => (
              <section key={i} className="space-y-1.5">
                {section.heading && <h3 className="text-sm font-bold text-emerald-300">{section.heading}</h3>}
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{section.body}</p>
              </section>
            ))
          ) : (
            <p className="text-xs text-slate-500">This entry only has a summary.</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => onUpvote(e, item)}
              className={`flex items-center gap-1 transition ${item.hasUpvoted ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
              title={item.hasUpvoted ? 'Remove upvote' : 'Upvote'}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${item.hasUpvoted ? 'fill-emerald-400/30' : ''}`} />
              {item.upvotes}
            </button>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {item.views}
            </span>
          </div>
          {item.doubtId && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/doubts?id=${item.doubtId}`)}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              Open original doubt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
