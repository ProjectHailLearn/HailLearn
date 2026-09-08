import React, { useState } from 'react';
import { Sparkles, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { addDoubt } from '../../store/slices/doubtSlice';
import { Doubt } from '../../types';
import { useNavigate } from 'react-router-dom';

export const QuickAskCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [courseCode, setCourseCode] = useState('CS201');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newDoubt: Doubt = {
        id: `dbt-${Date.now().toString().slice(-4)}`,
        title: question,
        description: `Student raised question in ${subject} (${courseCode}): "${question}". AI analyzed intent and provided automated multi-stage derivation.`,
        subject,
        courseCode,
        tags: [subject.split(' ')[0], 'QuickAsk', courseCode],
        status: 'AI_RESOLVED',
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          department: user.department,
        },
        aiConfidenceScore: 97,
        aiSolution: {
          summary: `HailLearn AI synthesized the core principles of "${question}". Root concepts mapped directly to ${courseCode} syllabus standard modules.`,
          steps: [
            {
              step: 1,
              title: 'Problem Formalization & Invariants',
              content: `Deconstructing query into state requirements and preconditions specific to ${subject}.`,
            },
            {
              step: 2,
              title: 'Algorithmic Derivation & Proof',
              content: 'Analyzing asymptotic bounds, edge cases, and recursive sub-structures.',
            },
            {
              step: 3,
              title: 'Verification & Peer Escalation Criteria',
              content: 'Vector match cross-referenced with institutional lecture recordings with 97% confidence.',
            },
          ],
          citations: [
            `${user.university} ${courseCode} Lecture Notes: Module 4`,
            'Foundations of Computing & Systems - Reference Handbook',
          ],
          suggestedReadings: ['Amortized Time Complexity Guide', 'Practice Set #4'],
        },
        createdAt: 'Just now',
        upvotes: 1,
        views: 3,
      };

      dispatch(addDoubt(newDoubt));
      setIsSubmitting(false);
      setSubmittedId(newDoubt.id);
    }, 900);
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

      {submittedId ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-200">
                Doubt Analyzed & Resolved with 97% Confidence!
              </div>
              <div className="text-xs text-emerald-400/80">
                Step-by-step derivation and citations are ready in your workspace.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="gradient"
            onClick={() => {
              setSubmittedId(null);
              setQuestion('');
              navigate('/doubts');
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open in Studio
          </Button>
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Course Selector */}
              <select
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value);
                  if (e.target.value === 'CS201') setSubject('Data Structures & Algorithms');
                  if (e.target.value === 'CS305') setSubject('Distributed Systems');
                  if (e.target.value === 'AI401') setSubject('Deep Learning & LLMs');
                  if (e.target.value === 'CS245') setSubject('Database Architecture');
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="CS201">CS201: Algorithms</option>
                <option value="CS305">CS305: Distributed Systems</option>
                <option value="AI401">AI401: Deep Learning</option>
                <option value="CS245">CS245: Databases</option>
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
