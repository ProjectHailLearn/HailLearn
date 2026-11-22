import React, { useEffect, useState } from 'react';
import { Bot, Flag } from 'lucide-react';
import { Button } from '../common/Button';
import { adminService } from '../../services/adminService';
import { ContentFlag, Conversation, ChatMessage } from '../../types';
import { apiError } from '../../utils/errors';

// Report queue: review flagged doubts, answers, chat messages and vault entries; dismiss or remove.
export const ModerationPanel: React.FC = () => {
  const [status, setStatus] = useState<'open' | 'dismissed' | 'removed'>('open');
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => adminService.listFlags(status).then(setFlags).catch((e) => setError(apiError(e, 'Failed to load reports')));
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (f: ContentFlag, action: 'dismiss' | 'remove') => {
    if (action === 'remove' && !window.confirm(`Permanently delete this ${f.targetType}?`)) return;
    try {
      await adminService.resolveFlag(f._id, action);
      load();
    } catch (e) {
      setError(apiError(e, 'Failed to resolve report'));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['open', 'dismissed', 'removed'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-lg text-xs capitalize ${status === s ? 'bg-rose-600 text-white' : 'bg-slate-950/60 text-slate-400 border border-slate-800'}`}>{s}</button>
        ))}
      </div>
      {error && <div className="text-xs text-rose-400">{error}</div>}
      {flags.length === 0 && <p className="text-xs text-slate-500">No {status} reports.</p>}
      {flags.map((f) => (
        <div key={f._id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {f.automatic ? <Bot className="w-3.5 h-3.5 text-amber-400" /> : <Flag className="w-3.5 h-3.5 text-rose-400" />}
            <span className="font-semibold text-slate-200 capitalize">{f.targetType}</span>
            <span className="text-slate-400">{f.automatic ? 'automatic' : 'user report'} · {new Date(f.createdAt).toLocaleString()}</span>
          </div>
          <div className="text-xs text-amber-200">{f.reason}</div>
          <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-4 bg-slate-900/60 p-2 rounded-lg">{f.preview || '(no preview)'}</p>
          <div className="flex gap-2">
            {(f.targetType === 'doubt' || f.targetType === 'answer') && (
              <a href={`/doubts?id=${f.targetType === 'doubt' ? f.targetId : f.parentId}`} className="text-xs text-brand-400 hover:text-brand-300 self-center">Open</a>
            )}
            {status === 'open' && (
              <>
                <Button size="sm" variant="secondary" className="text-xs" onClick={() => resolve(f, 'dismiss')}>Dismiss</Button>
                <Button size="sm" variant="danger" className="text-xs" onClick={() => resolve(f, 'remove')}>Remove content</Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Chat transcripts of accepted mentorship sessions, for moderation and disputes.
export const TranscriptsPanel: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => { adminService.listConversations().then(setConversations).catch(console.error); }, []);
  useEffect(() => { if (open) adminService.transcript(open).then(setMessages).catch(console.error); }, [open]);

  return (
    <div className="grid md:grid-cols-5 gap-4">
      <div className="md:col-span-2 space-y-1.5 max-h-96 overflow-y-auto">
        {conversations.length === 0 && <p className="text-xs text-slate-500">No accepted mentorship sessions yet.</p>}
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setOpen(c.id)} className={`w-full text-left p-2.5 rounded-xl border text-xs ${open === c.id ? 'bg-purple-600/15 border-purple-500/40' : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40'}`}>
            <div className="font-semibold text-slate-200">{c.studentName} ↔ {c.mentorName}</div>
            <div className="text-[11px] text-slate-500">{c.topic || 'No topic'} · {c.messageCount} messages</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-3 max-h-96 overflow-y-auto space-y-1.5">
        {!open && <p className="text-xs text-slate-500">Select a conversation to read its transcript.</p>}
        {open && messages.length === 0 && <p className="text-xs text-slate-500">No messages.</p>}
        {messages.map((m) => (
          <div key={m.id} className="text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="font-semibold text-slate-200">{m.senderName}</span>
            <span className="text-[10px] text-slate-500 ml-2">{new Date(m.createdAt).toLocaleString()}</span>
            <p className="text-slate-300 whitespace-pre-wrap mt-0.5">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
