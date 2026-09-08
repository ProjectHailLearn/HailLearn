import React, { useState } from 'react';
import {
  Users,
  Star,
  Flame,
  CheckCircle2,
  Search,
  MessageSquare,
  Video,
  Award,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setSelectedTopic,
  setOnlineOnly,
} from '../store/slices/mentorSlice';

export const MentorshipPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const mentors = useAppSelector((state) => state.mentors.mentors);
  const selectedTopic = useAppSelector((state) => state.mentors.selectedTopic);
  const onlineOnly = useAppSelector((state) => state.mentors.onlineOnly);

  const [searchQuery, setSearchQuery] = useState('');
  const [connectModalMentor, setConnectModalMentor] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const topics = [
    'ALL',
    'Algorithms',
    'Distributed Systems',
    'PyTorch',
    'PostgreSQL',
    'Transformers',
  ];

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specializations.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesOnline = onlineOnly ? m.isOnline : true;
    const matchesTopic =
      selectedTopic === 'ALL'
        ? true
        : m.specializations.some((s) =>
            s.toLowerCase().includes(selectedTopic.toLowerCase())
          );
    return matchesSearch && matchesOnline && matchesTopic;
  });

  const activeMentor = mentors.find((m) => m.id === connectModalMentor);

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false);
      setConnectModalMentor(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-400" />
            University Peer & Faculty Mentorship Hub
          </h1>
          <p className="text-xs text-slate-400">
            Connect 1-on-1 with verified TAs, top students, and faculty researchers for in-depth guidance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center gap-2 text-xs text-purple-300">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Earn Karma by Mentoring Peers</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card variant="glass" className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors by topic, name, course..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Online Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => dispatch(setOnlineOnly(e.target.checked))}
              className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Online Mentors Only
            </span>
          </label>
        </div>

        {/* Topic Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => dispatch(setSelectedTopic(topic))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedTopic === topic
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {topic === 'ALL' ? 'All Specializations' : topic}
            </button>
          ))}
        </div>
      </Card>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMentors.map((mentor) => (
          <Card
            key={mentor.id}
            variant="glass"
            className="p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/30 transition-all duration-300 group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={mentor.avatar}
                    name={mentor.name}
                    size="lg"
                    isOnline={mentor.isOnline}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                      {mentor.name}
                    </h3>
                    <div className="text-xs text-slate-400">{mentor.department}</div>
                    <div className="text-[11px] text-purple-400 font-medium">
                      {mentor.year}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {mentor.rating}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {mentor.reviewsCount} reviews
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {mentor.bio}
              </p>

              {/* Specializations */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {mentor.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="text-[10px] bg-slate-950 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Meta & Action */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <Flame className="w-3.5 h-3.5 text-brand-400" />
                  {mentor.karmaPoints} Karma
                </span>
                <span>•</span>
                <span>{mentor.resolvedDoubtsCount} doubts solved</span>
              </div>

              <Button
                size="sm"
                variant="gradient"
                onClick={() => setConnectModalMentor(mentor.id)}
                className="text-xs py-1.5"
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Connect
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Connect Modal */}
      {activeMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <Avatar
                src={activeMentor.avatar}
                name={activeMentor.name}
                size="md"
                isOnline={activeMentor.isOnline}
              />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Request 1-on-1 Guidance with {activeMentor.name}
                </h3>
                <div className="text-xs text-purple-400">{activeMentor.year} • {activeMentor.department}</div>
              </div>
            </div>

            {requestSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-sm font-bold text-white">
                  Mentorship Request Dispatched!
                </div>
                <div className="text-xs text-slate-400">
                  {activeMentor.name} has been alerted via university Socket.IO push.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    What topic/doubt do you need assistance with?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Consensus or Dynamic Programming"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Session Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-slate-700">
                      <input type="radio" name="mode" defaultChecked className="text-purple-600" />
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Async Chat</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-slate-700">
                      <input type="radio" name="mode" className="text-purple-600" />
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Video Call</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConnectModalMentor(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" size="sm">
                    Send Invitation
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
