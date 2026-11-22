export type UserRole = 'student' | 'mentor' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  university: string;
  department: string;
  semester?: number;
  karmaPoints: number;
  rating?: number;
  specializations?: string[];
  preferences?: { aiModel: string; emailNotifications: boolean };
  emailVerified?: boolean;
}

export type DoubtStatus = 
  | 'ANALYZING'
  | 'AI_RESOLVED'
  | 'MENTOR_ESCALATED'
  | 'FACULTY_VERIFIED'
  | 'CLOSED';

export interface AIReasoningStep {
  step: number;
  title: string;
  content: string;
  codeSnippet?: string;
  language?: string;
}

// How the shown confidence was computed (see backend aiService.scoreConfidence).
export interface ConfidenceBreakdown {
  model: number;
  grounding: number | null;
  missingContext?: string[];
  final: number;
}

// Knowledge Vault entry retrieved for a doubt (RAG). Order matches the [K1], [K2] labels in the answer.
export interface RetrievedSource {
  id: string;
  title: string;
  courseCode: string;
  match: number;
  used: boolean;
  author?: string; // who wrote/solved the cited entry (attribution)
  doubtId?: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface DoubtRating {
  target: 'mentor' | 'ai';
  clarity: number;
  helpfulness: number;
  responseTime: number;
  comment?: string;
}

export interface Availability {
  acceptingDoubts: boolean;
  timezone: string;
  slots: { day: number; start: string; end: string }[];
}

// Confidence-gate outcome for a doubt (see backend services/routingService.ts).
export interface RoutingDecision {
  mode: 'grounded_answer' | 'mentor_routing';
  reason: 'confident' | 'low_confidence' | 'ai_unavailable';
  threshold: number;
  candidates: { mentorId: string; userId?: string; name: string; online: boolean; available?: boolean; relevance: number; reputation: number; score: number }[];
}

export interface Doubt {
  id: string;
  title: string;
  description: string;
  codeSnippet?: string;
  subject: string;
  courseCode: string;
  tags: string[];
  status: DoubtStatus;
  author: {
    id: string;
    name: string;
    avatar: string;
    department: string;
  };
  aiConfidenceScore?: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  retrievedSources?: RetrievedSource[];
  routing?: RoutingDecision;
  aiSolution?: {
    summary: string;
    steps: AIReasoningStep[];
    citations: string[];
    suggestedReadings: string[];
  };
  assignedMentor?: {
    id: string;
    name: string;
    avatar: string;
    karma: number;
  };
  answers?: DoubtAnswer[];
  difficulty?: Difficulty;
  acceptedBy?: { userId: string; mentorId: string; name: string };
  acceptedAt?: string;
  rating?: DoubtRating;
  createdAt: string;
  upvotes: number;
  views: number;
}

export interface DoubtAnswer {
  _id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  role: UserRole;
  content: string;
  createdAt: string;
}

export interface MentorRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  mentorId: string;
  mentorName: string;
  topic: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface DashboardStats {
  totalDoubts: number;
  resolved: number;
  aiResolutionRate: number;
  escalated: number;
  verified: number;
  onlineMentors: number;
  knowledgeItems: number;
  myDoubts: number;
  karmaPoints: number;
  karmaRank: number;
  totalUsers: number;
  doubtsByCourse: Record<string, number>;
}

export interface StudyRoom {
  id: string;
  title: string;
  courseCode: string;
  hostId: string;
  hostName: string;
  scheduledAt: string;
  durationMins: number;
  meetingLink?: string;
  attendees: number;
  isAttending: boolean;
  isHost: boolean;
  status: 'LIVE' | 'UPCOMING';
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  rating: number;
  reviewsCount: number;
  resolvedDoubtsCount: number;
  karmaPoints: number;
  isOnline: boolean;
  specializations: string[];
  bio: string;
  hasAccount: boolean;
  userId?: string;
  reputationScore: number;
  ratingsCount: number;
  avgResponseMinutes?: number;
  verifiedBadge: boolean;
  availableNow: boolean;
  availability?: Availability;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  karmaPoints: number;
  avatar: string;
  suspended: boolean;
  suspendedReason?: string;
  emailVerified: boolean;
}

export interface AdminMentorProfile {
  id: string;
  name: string;
  department: string;
  userId: string | null;
  linkedEmail: string | null;
  verifiedBadge: boolean;
  reputationScore: number;
  ratingsCount: number;
}

export interface ContentFlag {
  _id: string;
  targetType: 'doubt' | 'answer' | 'message' | 'knowledge';
  targetId: string;
  parentId?: string;
  reason: string;
  preview: string;
  automatic: boolean;
  status: 'open' | 'dismissed' | 'removed';
  createdAt: string;
}

export interface Conversation {
  id: string;
  studentName: string;
  mentorName: string;
  topic?: string;
  messageCount: number;
  lastMessageAt: string;
}

export interface Analytics {
  users: { total: number; byRole: Record<string, number>; suspended: number };
  doubts: {
    total: number;
    byStatus: Record<string, number>;
    resolutionRate: number;
    perDay: { _id: string; n: number }[];
    bySubject: { subject: string; total: number; open: number }[];
  };
  ai: { avgConfidence: number | null; answeredByAi: number; routedToMentors: number; routingRate: number | null };
  mentors: {
    avgResponseMinutes: number | null;
    acceptedDoubts: number;
    top: { _id: string; name: string; reputationScore?: number; ratingsCount?: number; resolvedDoubtsCount?: number; avgResponseMinutes?: number; verifiedBadge?: boolean }[];
  };
  ratings: Record<string, { count: number; clarity: number; helpfulness: number; responseTime: number }>;
  moderation: { openReports: number };
}

export interface SystemStatus {
  aiProvider: 'gemini' | 'grok' | 'fallback';
  aiConfigured: boolean;
  onlineMentors: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  courseCode: string;
  author: string;
  verificationBadge: boolean;
  upvotes: number;
  views: number;
  lastUpdated: string;
  tags: string[];
  snippet: string;
  content?: string;
  doubtId?: string;
  similarityScore?: number;
  highlights?: string[]; // matching sentences when searching
  hasUpvoted?: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  subject: string;
  isEnrolled: boolean;
  myDoubts: number;
  myResolved: number;
  instructor: string;
  credits: number;
  progress: number;
  activeDoubts: number;
  enrolledStudents: number;
  syllabusCovered: number;
  nextLecture: string;
  category: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ai' | 'mentor' | 'system' | 'course';
  link?: string;
}
