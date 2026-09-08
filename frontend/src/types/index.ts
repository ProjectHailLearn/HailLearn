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
  createdAt: string;
  upvotes: number;
  views: number;
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
  similarityScore?: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
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
}
