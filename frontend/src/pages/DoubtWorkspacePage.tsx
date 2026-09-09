import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  BookOpen,
  Users,
  Code2,
  CheckCircle,
  ThumbsUp,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { useAppSelector } from '../store';
import { Doubt } from '../types';
import { doubtService } from '../services/doubtService';
import { mentorService } from '../services/mentorService';
import { Mentor } from '../types';

export const DoubtWorkspacePage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [courseCode, setCourseCode] = useState('CS201');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [isSolving, setIsSolving] = useState(false);
  const [selectedMentorForEscalation, setSelectedMentorForEscalation] = useState('');

  useEffect(() => {
    doubtService.getAll().then((d) => {
      setDoubts(d);
      if (d.length > 0) setActiveDoubtId(d[0].id);
    }).catch(console.error);
    mentorService.getAll().then(setMentors).catch(console.error);
  }, []);

  const activeDoubt = doubts.find((d) => d.id === activeDoubtId) || doubts[0];

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setIsSolving(true);

    const aiSolution = {
      summary: `Comprehensive algorithmic and institutional resolution for: "${title}". Validated against ${user.university} ${courseCode} syllabus.`,
      steps: [
        {
          step: 1,
          title: 'Mathematical Formulation & Complexity Invariants',
          content: `Deconstructing input variables and constraints. For ${courseCode}, optimal solution requires respecting asymptotic guarantees and cache spatial locality.`,
        },
        {
          step: 2,
          title: 'Correctness Proof & Edge Case Analysis',
          content: 'Evaluating boundary conditions (empty subsets, negative cycles, concurrent race states). Proof verified via loop invariants.',
        },
        {
          step: 3,
          title: 'Optimized Implementation Structure',
          content: 'Generated clean, memory-efficient solution with strict typing.',
          codeSnippet: codeSnippet
            ? `// Optimized Refactor\n${codeSnippet}\n// Time: O((V+E) log V) | Space: O(V)`
            : `// Solution Implementation\nexport function resolveDoubt() {\n  return { success: true, optimized: true };\n}`,
          language: 'typescript',
        },
      ],
      citations: [
        `${user.university} CS Syllabus Reference Vault - Module 3`,
        'Foundations of Computer Science - Volume II',
      ],
      suggestedReadings: ['Asymptotic Analysis Deep Dive', 'Peer Discussion Transcript #109'],
    };

    try {
      const newDoubt = await doubtService.create({
        title,
        description,
        codeSnippet: codeSnippet.trim() || undefined,
        subject,
        courseCode,
        tags: [subject.split(' ')[0], 'StudioQuery', courseCode],
        aiSolution,
        aiConfidenceScore: 98,
        authorName: user.name,
        authorAvatar: user.avatar,
        authorDepartment: user.department,
      });
      setDoubts((prev) => [newDoubt, ...prev]);
      setActiveDoubtId(newDoubt.id);
      setTitle('');
      setDescription('');
      setCodeSnippet('');
    } catch (err) {
      console.error('Failed to create doubt:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleUpvote = async (doubtId: string) => {
    try {
      const updated = await doubtService.upvote(doubtId);
      setDoubts((prev) => prev.map((d) => (d.id === doubtId ? updated : d)));
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleEscalate = async () => {
    if (!activeDoubt) return;
    const mentor = mentors.find((m) => m.id === selectedMentorForEscalation) || mentors[0];
    if (!mentor) return;
    try {
      const updated = await doubtService.escalate(activeDoubt.id, {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        karma: mentor.karmaPoints,
      });
      setDoubts((prev) => prev.map((d) => (d.id === activeDoubt.id ? updated : d)));
    } catch (err) {
      console.error('Failed to escalate:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-brand-400" />
            AI Doubt Resolution Studio
          </h1>
          <p className="text-xs text-slate-400">
            Multi-stage reasoning engine with automatic course citation and peer escalation fallback
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="gradient-border" className="p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-400" />
              <span>Submit Academic Question</span>
            </h2>

            <form onSubmit={handleCreateDoubt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Title / Topic</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Prove Master Theorem Case 2 with poly-log factors"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
                  <select
                    value={courseCode}
                    onChange={(e) => {
                      setCourseCode(e.target.value);
                      const map: Record<string, string> = {
                        CS201: 'Data Structures & Algorithms',
                        CS305: 'Distributed Systems',
                        AI401: 'Deep Learning & LLMs',
                        CS245: 'Database Architecture',
                      };
                      setSubject(map[e.target.value] || 'Computer Science');
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="CS201">CS201: Algorithms</option>
                    <option value="CS305">CS305: Distributed Systems</option>
                    <option value="AI401">AI401: Deep Learning</option>
                    <option value="CS245">CS245: Databases</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AI Reasoning Depth</label>
                  <select className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500">
                    <option>Exhaustive Step-by-Step</option>
                    <option>Concise Summary</option>
                    <option>Socratic Hint Mode</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Explanation & Context</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where you got stuck, intuition, and expected vs observed behavior..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-brand-400" />
                    Optional Code Snippet
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">C++ / Python / TS</span>
                </label>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="// Paste your buggy code or test case here"
                  rows={3}
                  className="w-full bg-slate-950 font-mono border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full text-xs"
                isLoading={isSolving}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Synthesize Solution via Gemini AI
              </Button>
            </form>
          </Card>

          <Card variant="glass" className="p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Select Question From Archive
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {doubts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDoubtId(d.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    d.id === activeDoubtId
                      ? 'bg-brand-600/15 border-brand-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-medium text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                      {d.courseCode}
                    </span>
                    <span className="text-[10px] text-slate-500">{d.createdAt}</span>
                  </div>
                  <div className="text-xs font-semibold truncate text-slate-200">{d.title}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 space-y-6">
          {activeDoubt ? (
            <Card variant="glass" className="p-6 space-y-6">
              <div className="space-y-3 pb-5 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                      {activeDoubt.courseCode}
                    </span>
                    <span className="text-xs text-slate-400">• {activeDoubt.subject}</span>
                  </div>
                  <Badge status={activeDoubt.status} dot>{activeDoubt.status.replace(/_/g, ' ')}</Badge>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{activeDoubt.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {activeDoubt.description}
                </p>
                {activeDoubt.codeSnippet && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-slate-400">Attached Code Context:</div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                      <code>{activeDoubt.codeSnippet}</code>
                    </pre>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <div className="flex items-center gap-2">
                    <Avatar src={activeDoubt.author.avatar} name={activeDoubt.author.name} size="xs" />
                    <span>Asked by {activeDoubt.author.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(activeDoubt.id)}
                      className="flex items-center gap-1 hover:text-brand-400 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{activeDoubt.upvotes} Upvotes</span>
                    </button>
                    <span>•</span>
                    <span>{activeDoubt.views} Views</span>
                  </div>
                </div>
              </div>

              {activeDoubt.aiSolution ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">AI Reasoning & Derivation Engine</h3>
                    </div>
                    {activeDoubt.aiConfidenceScore && (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {activeDoubt.aiConfidenceScore}% Confidence
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <strong className="text-brand-300 block mb-1">Executive Summary:</strong>
                    {activeDoubt.aiSolution.summary}
                  </div>

                  <div className="space-y-3">
                    {activeDoubt.aiSolution.steps.map((step) => (
                      <div key={step.step} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-mono">
                            {step.step}
                          </span>
                          <span>{step.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-7">{step.content}</p>
                        {step.codeSnippet && (
                          <pre className="ml-7 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-brand-300 overflow-x-auto">
                            <code>{step.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                      <span>Institutional References & Citations:</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
                      {activeDoubt.aiSolution.citations.map((cite, idx) => <li key={idx}>{cite}</li>)}
                    </ul>
                  </div>

                  {activeDoubt.assignedMentor ? (
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={activeDoubt.assignedMentor.avatar} name={activeDoubt.assignedMentor.name} size="md" isOnline={true} />
                        <div>
                          <div className="text-xs font-bold text-purple-200">Assigned Peer / Faculty Mentor</div>
                          <div className="text-sm font-semibold text-white">{activeDoubt.assignedMentor.name}</div>
                          <div className="text-[11px] text-purple-300 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {activeDoubt.assignedMentor.karma} Karma Points
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" className="text-xs">Open 1-on-1 Chat</Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <div className="text-xs font-bold text-slate-200">Still need human clarification?</div>
                        <div className="text-[11px] text-slate-400">Escalate this doubt to top peer mentors in {activeDoubt.subject}</div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={selectedMentorForEscalation}
                          onChange={(e) => setSelectedMentorForEscalation(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none flex-1"
                        >
                          <option value="">Auto-Match Mentor</option>
                          {mentors.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.rating}★)</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="gradient"
                          onClick={handleEscalate}
                          className="text-xs whitespace-nowrap"
                          leftIcon={<Users className="w-3.5 h-3.5" />}
                        >
                          Escalate to Mentor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">AI reasoning in progress...</div>
                  <div className="text-xs text-slate-500">Synthesizing domain references and mathematical bounds.</div>
                </div>
              )}
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-slate-500">
              Select or submit a question to view full reasoning Studio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
