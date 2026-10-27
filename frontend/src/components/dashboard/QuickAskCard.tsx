import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Layers, CheckCircle2, BookOpen, RotateCcw } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { addDoubt } from '../../store/slices/doubtSlice';
import { doubtService } from '../../services/doubtService';
import { courseService } from '../../services/courseService';
import { Course, Doubt } from '../../types';
import { useNavigate } from 'react-router-dom';

export const QuickAskCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [courseCode, setCourseCode] = useState('CS201');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<Doubt | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    courseService.getAll().then(setCourses).catch(console.error);
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !user) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const newDoubt = await doubtService.create({
        title: question.trim().slice(0, 140),
        description: question.trim(),
        subject,
        courseCode,
        tags: [subject.split(' ')[0], 'QuickAsk', courseCode],
      });
      dispatch(addDoubt(newDoubt));
      setAnswer(newDoubt);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="gradient-border" className="p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Instant AI Doubt Resolver
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Vector RAG
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Type your academic question — AI synthesizes instant step-by-step reasoning with citations
            </p>
          </div>
        </div>
      </div>

      {answer ? (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Your question: </span>
            {answer.description}
          </div>

          {answer.aiSolution ? (
            <>
              <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/30 text-sm text-slate-200 leading-relaxed">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-brand-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    AI Answer
                  </strong>
                  {answer.aiConfidenceScore != null && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {answer.aiConfidenceScore}% Confidence
                    </span>
                  )}
                </div>
                {answer.aiSolution.summary}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {answer.aiSolution.steps.map((step) => (
                  <div key={step.step} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                        {step.step}
                      </span>
                      <span>{step.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7 whitespace-pre-line">{step.content}</p>
                    {step.codeSnippet && (
                      <pre className="ml-7 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-brand-300 overflow-x-auto">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {answer.aiSolution.citations.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                    <span>References</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                    {answer.aiSolution.citations.map((cite, idx) => <li key={idx}>{cite}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
              Your doubt was saved. Open it in the studio to follow its progress.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setAnswer(null); setQuestion(''); }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Ask another
            </Button>
            <Button
              size="sm"
              variant="gradient"
              onClick={() => navigate(`/doubts?id=${answer.id}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open in Studio
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Why does QuickSort degrade to O(N^2) on already sorted arrays, and how does Randomized Pivot fix it?"
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition resize-none"
            />
          </div>

          {error && <div className="text-xs text-rose-400">{error}</div>}
          {isSubmitting && (
            <div className="flex items-center gap-2 text-xs text-brand-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI is working on your answer — this usually takes 5–15 seconds…
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Course Selector */}
              <select
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value);
                  setSubject(courses.find((c) => c.code === e.target.value)?.subject || 'Computer Science');
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}: {c.subject}</option>
                ))}
              </select>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-800">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                <span>Auto Peer-Escalation Ready</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="sm"
              isLoading={isSubmitting}
              disabled={!question.trim()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Solve with AI
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
