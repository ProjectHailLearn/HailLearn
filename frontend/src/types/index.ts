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
  createdAt: string;
  upvotes: number;
  views: number;
}

export interface DoubtAnswer {
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
}

export interface AdminMentorProfile {
  id: string;
  name: string;
  department: string;
  userId: string | null;
  linkedEmail: string | null;
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
