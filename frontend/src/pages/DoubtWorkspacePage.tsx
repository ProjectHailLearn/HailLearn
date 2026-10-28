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
  MessageSquare,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { useAppSelector } from '../store';
import { Doubt } from '../types';
import { doubtService } from '../services/doubtService';
import { mentorService } from '../services/mentorService';
import { courseService } from '../services/courseService';
import { Mentor, Course, DoubtStatus } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RagSources } from '../components/doubts/RagSources';

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export const DoubtWorkspacePage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [courseCode, setCourseCode] = useState('CS201');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [isSolving, setIsSolving] = useState(false);
  const [depth, setDepth] = useState<'detailed' | 'concise' | 'socratic'>('detailed');
  const [courses, setCourses] = useState<Course[]>([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveCourse, setArchiveCourse] = useState('ALL');
  const [archiveStatus, setArchiveStatus] = useState<'ALL' | DoubtStatus>('ALL');
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedMentorForEscalation, setSelectedMentorForEscalation] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const isStaff = user?.role === 'mentor' || user?.role === 'faculty' || user?.role === 'admin';
  const canVerify = user?.role === 'faculty' || user?.role === 'admin';

  useEffect(() => {
    courseService.getAll().then((c) => {
      setCourses(c);
      const requested = searchParams.get('course');
      const match = c.find((x) => x.code === requested) || c[0];
      if (match) {
        setCourseCode(match.code);
        setSubject(match.subject);
      }
      if (requested) setArchiveCourse(requested);
    }).catch(console.error);
  }, [searchParams]);

  useEffect(() => {
    const requestedId = searchParams.get('id');
    doubtService.getAll().then((d) => {
      setDoubts(d);
      if (requestedId && d.some((x) => x.id === requestedId)) setActiveDoubtId(requestedId);
      else if (d.length > 0) setActiveDoubtId(d[0].id);
    }).catch((err) => setError(errorMessage(err, 'Failed to load doubts')));
  }, [searchParams]);

  useEffect(() => {
    mentorService.getAll().then(setMentors).catch(console.error);
  }, []);

  const activeDoubt = doubts.find((d) => d.id === activeDoubtId) || doubts[0];

  const archive = doubts.filter((d) => {
    const q = archiveSearch.trim().toLowerCase();
    return (
      (archiveCourse === 'ALL' || d.courseCode === archiveCourse) &&
      (archiveStatus === 'ALL' || d.status === archiveStatus) &&
      (!mineOnly || d.author.id === user?.id) &&
      (!q || d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !user) return;

    setIsSolving(true);
    setError(null);
    try {
      const newDoubt = await doubtService.create({
        title,
        description,
        codeSnippet: codeSnippet.trim() || undefined,
        subject,
        courseCode,
        tags: [subject.split(' ')[0], courseCode],
        depth,
      });
      setDoubts((prev) => [newDoubt, ...prev]);
      setActiveDoubtId(newDoubt.id);
      setTitle('');
      setDescription('');
      setCodeSnippet('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to submit doubt'));
    } finally {
      setIsSolving(false);
    }
  };

  const replaceDoubt = (updated: Doubt) =>
    setDoubts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

  const runAction = async (action: () => Promise<Doubt>, fallback: string) => {
    setError(null);
    try {
      replaceDoubt(await action());
    } catch (err) {
      setError(errorMessage(err, fallback));
    }
  };

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt || !answerText.trim()) return;
    setIsAnswering(true);
    await runAction(() => doubtService.answer(activeDoubt.id, answerText.trim()), 'Failed to post answer');
    setAnswerText('');
    setIsAnswering(false);
  };

  const handleUpvote = async (doubtId: string) => {
    await runAction(() => doubtService.upvote(doubtId), 'Failed to upvote');
  };

  const handleEscalate = async () => {
    if (!activeDoubt) return;
    const mentor = mentors.find((m) => m.id === selectedMentorForEscalation) || mentors[0];
    if (!mentor) return;
    await runAction(
      () => doubtService.escalate(activeDoubt.id, {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        karma: mentor.karmaPoints,
      }),
      'Failed to escalate'
    );
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

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">Dismiss</button>
        </div>
      )}

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
                      setSubject(courses.find((c) => c.code === e.target.value)?.subject || 'Computer Science');
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}: {c.subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AI Reasoning Depth</label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value as typeof depth)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="detailed">Exhaustive Step-by-Step</option>
                    <option value="concise">Concise Summary</option>
                    <option value="socratic">Socratic Hint Mode</option>
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
                Solve with HailLearn AI
              </Button>
            </form>
          </Card>

          <Card variant="glass" className="p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Select Question From Archive
            </h3>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder="Search questions or tags..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <div className="flex gap-2">
                <select
                  value={archiveCourse}
                  onChange={(e) => setArchiveCourse(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All courses</option>
                  {courses.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <select
                  value={archiveStatus}
                  onChange={(e) => setArchiveStatus(e.target.value as typeof archiveStatus)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All statuses</option>
                  <option value="AI_RESOLVED">AI Resolved</option>
                  <option value="MENTOR_ESCALATED">In Mentorship</option>
                  <option value="FACULTY_VERIFIED">Verified</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                  <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
                  Mine
                </label>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {archive.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">No questions match these filters.</div>
              )}
              {archive.map((d) => (
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

                  <RagSources sources={activeDoubt.retrievedSources} confidence={activeDoubt.confidenceBreakdown} />

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
                      <Button size="sm" variant="secondary" className="text-xs" onClick={() => navigate('/mentorship')}>Open Mentorship</Button>
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

              {/* Mentor / Faculty answers */}
              <div className="space-y-3 pt-5 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Mentor & Faculty Answers ({activeDoubt.answers?.length || 0})
                </h3>
                {(activeDoubt.answers || []).map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Avatar src={a.authorAvatar} name={a.authorName} size="xs" />
                      <span className="font-semibold text-slate-200">{a.authorName}</span>
                      <span className="text-[10px] uppercase tracking-wider text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">{a.role}</span>
                      <span className="text-[10px] text-slate-500 ml-auto">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                  </div>
                ))}
                {!activeDoubt.answers?.length && (
                  <p className="text-xs text-slate-500">No human answers yet.</p>
                )}

                {isStaff && activeDoubt.status !== 'CLOSED' && (
                  <form onSubmit={handleAnswer} className="space-y-2">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write your answer for the student..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <Button type="submit" size="sm" variant="secondary" isLoading={isAnswering} disabled={!answerText.trim()} className="text-xs">
                      Post Answer
                    </Button>
                  </form>
                )}

                <div className="flex flex-wrap gap-2">
                  {canVerify && activeDoubt.status !== 'FACULTY_VERIFIED' && activeDoubt.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="text-xs"
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                      onClick={() => runAction(() => doubtService.verify(activeDoubt.id), 'Failed to verify')}
                    >
                      Verify & Add to Knowledge Vault
                    </Button>
                  )}
                  {(activeDoubt.author.id === user?.id || canVerify) && activeDoubt.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => runAction(() => doubtService.close(activeDoubt.id), 'Failed to close')}
                    >
                      Mark Resolved & Close
                    </Button>
                  )}
                </div>
              </div>
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
