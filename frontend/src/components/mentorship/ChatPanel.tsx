import React, { useEffect, useRef, useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { requestService, toMessage } from '../../services/requestService';
import { getSocket, isSocketConnected } from '../../services/socketService';
import { ChatMessage, MentorRequest } from '../../types';
import { useAppSelector } from '../../store';
import { apiError } from '../../utils/errors';

export const ChatPanel: React.FC<{ request: MentorRequest; onClose: () => void }> = ({ request, onClose }) => {
  const me = useAppSelector((s) => s.auth.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherName = request.studentId === me?.id ? request.mentorName : request.studentName;

  useEffect(() => {
    requestService.getMessages(request.id).then(setMessages).catch((e) => setError(apiError(e, 'Failed to load chat')));
    const socket = getSocket();
    const onMessage = (raw: Record<string, unknown>) => {
      const msg = toMessage(raw);
      if (msg.requestId === request.id) setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket?.on('message', onMessage);
    // Without a live socket (e.g. on Vercel), poll for new messages every 3 seconds.
    const id = window.setInterval(() => {
      if (isSocketConnected() || document.hidden) return;
      requestService.getMessages(request.id).then((latest) =>
        setMessages((prev) => (latest.length === prev.length && latest.every((m, i) => m.id === prev[i]?.id) ? prev : latest))
      ).catch(() => {});
    }, 3000);
    return () => {
      socket?.off('message', onMessage);
      window.clearInterval(id);
    };
  }, [request.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const msg = await requestService.sendMessage(request.id, text.trim());
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setText('');
    } catch (err) {
      setError(apiError(err, 'Failed to send'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg h-[70vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-sm font-bold text-white">{otherName}</div>
              {request.topic && <div className="text-[11px] text-purple-300">{request.topic}</div>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] text-slate-500 text-center pb-2">Request: “{request.message}”</div>
          {messages.map((m) => {
            const mine = m.senderId === me?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                }`}>
                  {m.content}
                  <div className={`text-[9px] mt-1 ${mine ? 'text-brand-200' : 'text-slate-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && !error && (
            <div className="text-xs text-slate-500 text-center pt-8">Say hello to start the session.</div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="px-4 text-xs text-rose-400">{error}</div>}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
