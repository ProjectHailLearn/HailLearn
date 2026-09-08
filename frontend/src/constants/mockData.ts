import { User, Doubt, Mentor, KnowledgeItem, Course, Notification } from '../types';

export const CURRENT_USER: User = {
  id: 'usr-101',
  name: 'Alex Rivera',
  email: 'alex.rivera@stanford.edu',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  university: 'Stanford Institute of Technology',
  department: 'Computer Science & Engineering',
  semester: 5,
  karmaPoints: 480,
  rating: 4.9,
  specializations: ['Algorithms', 'Distributed Systems', 'PyTorch']
};

export const MOCK_DOUBTS: Doubt[] = [
  {
    id: 'dbt-301',
    title: 'Why is Bellman-Ford O(V*E) while Dijkstra with binary heap is O((V+E)log V)?',
    description: 'I understand Dijkstra picks the greedy minimum, but why does Bellman-Ford need exactly V-1 relaxations across all edges? How does negative cycle detection work under the hood?',
    codeSnippet: `// Bellman-Ford Relaxation Loop
for (let i = 1; i <= V - 1; i++) {
  for (const [u, v, weight] of edges) {
    if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {
      dist[v] = dist[u] + weight;
    }
  }
}`,
    subject: 'Data Structures & Algorithms',
    courseCode: 'CS201',
    tags: ['Graph Theory', 'Dynamic Programming', 'Complexity'],
    status: 'AI_RESOLVED',
    author: {
      id: 'usr-102',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      department: 'Computer Science'
    },
    aiConfidenceScore: 98,
    aiSolution: {
      summary: 'Bellman-Ford iteratively computes shortest paths with at most k edges. Since a simple shortest path has at most |V|-1 edges, |V|-1 passes over all |E| edges guarantee optimal distances. A further relaxation indicating improvement proves a negative cycle.',
      steps: [
        {
          step: 1,
          title: 'Subproblem Invariance',
          content: 'After pass k, dist[v] holds the weight of the shortest path from source s to v containing at most k edges.'
        },
        {
          step: 2,
          title: 'Why |V| - 1 passes?',
          content: 'In any graph without negative cycles, the shortest path between any two vertices has at most |V| vertices, hence at most |V|-1 edges.'
        },
        {
          step: 3,
          title: 'Negative Cycle Proof',
          content: 'If an edge can still be relaxed in the |V|-th pass, there exists a path with |V| edges shorter than with |V|-1 edges, confirming an infinite decreasing cycle.'
        }
      ],
      citations: [
        'CLRS Introduction to Algorithms (4th Ed) - Chapter 24.1',
        'Stanford CS161 Lecture 11: Shortest Paths & Negative Cycles'
      ],
      suggestedReadings: ['Johnson Algorithm for Sparse Graphs', 'SPFA Heuristic Optimizations']
    },
    createdAt: '12 mins ago',
    upvotes: 24,
    views: 142
  },
  {
    id: 'dbt-302',
    title: 'Raft Consensus: Handling Split Brain in 3-Node vs 5-Node Clusters during Network Partition',
    description: 'If a 5-node cluster partitions into (2 nodes) and (3 nodes), how does the minority partition prevent stale writes while the majority elects a new term leader?',
    subject: 'Distributed Systems',
    courseCode: 'CS305',
    tags: ['Consensus', 'Raft', 'Fault Tolerance'],
    status: 'MENTOR_ESCALATED',
    author: {
      id: 'usr-103',
      name: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      department: 'Systems Engineering'
    },
    aiConfidenceScore: 84,
    assignedMentor: {
      id: 'usr-201',
      name: 'Dr. Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      karma: 1420
    },
    createdAt: '35 mins ago',
    upvotes: 41,
    views: 310
  },
  {
    id: 'dbt-303',
    title: 'Backpropagation Gradient vanishing in Deep ReLU networks vs GELU in Transformers',
    description: 'Why do Transformers uniformly favor GELU/SwiGLU over standard ReLU? How does the non-zero derivative for negative values stabilize attention heads?',
    subject: 'Deep Learning & Neural Architectures',
    courseCode: 'AI401',
    tags: ['Transformers', 'GELU', 'Attention Mechanisms'],
    status: 'FACULTY_VERIFIED',
    author: {
      id: 'usr-104',
      name: 'Sophia Patel',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      department: 'AI & Data Science'
    },
    aiConfidenceScore: 99,
    aiSolution: {
      summary: 'GELU weights inputs by their probability under standard normal distribution, providing smooth differentiability everywhere and avoiding the "dead neuron" zero-gradient problem of hard ReLU.',
      steps: [
        {
          step: 1,
          title: 'Stochastic Regularization Formulation',
          content: 'GELU(x) = x * P(X <= x) = x * Phi(x), where Phi(x) is the standard Gaussian cumulative distribution function.'
        },
        {
          step: 2,
          title: 'Smooth Curvature Advantage',
          content: 'Unlike ReLU which has an abrupt derivative discontinuity at 0, GELU offers non-monotonicity and continuous second derivatives essential for deep residual transformer backprop.'
        }
      ],
      citations: [
        'Hendrycks & Gimpel (2016) - Gaussian Error Linear Units',
        'Vaswani et al. (2017) - Attention Is All You Need'
      ],
      suggestedReadings: ['SwiGLU Activation in LLaMA', 'LayerNorm vs RMSNorm Dynamics']
    },
    createdAt: '1 hour ago',
    upvotes: 68,
    views: 489
  },
  {
    id: 'dbt-304',
    title: 'ACID Isolation Anomalies: Write Skew vs Phantom Reads in PostgreSQL SSI',
    description: 'Can someone provide a concrete hospital on-call doctors example where Snapshot Isolation suffers from write skew, but Serializable Snapshot Isolation (SSI) detects SIREAD locks and aborts?',
    subject: 'Database Internals',
    courseCode: 'CS245',
    tags: ['PostgreSQL', 'Concurreny', 'Transactions'],
    status: 'AI_RESOLVED',
    author: {
      id: 'usr-105',
      name: 'Liam O’Connor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      department: 'Computer Science'
    },
    aiConfidenceScore: 96,
    createdAt: '2 hours ago',
    upvotes: 19,
    views: 180
  }
];

export const MOCK_MENTORS: Mentor[] = [
  {
    id: 'usr-201',
    name: 'Dr. Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Distributed Systems & Cloud',
    year: 'Faculty Mentor',
    rating: 4.98,
    reviewsCount: 142,
    resolvedDoubtsCount: 310,
    karmaPoints: 1850,
    isOnline: true,
    specializations: ['Raft/Paxos', 'Kubernetes', 'Go', 'Microservices'],
    bio: 'Associate Professor & Systems researcher. Happy to walk through consensus proofs and kernel network primitives.'
  },
  {
    id: 'usr-202',
    name: 'Devon Vance',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science',
    year: 'Senior (4th Year)',
    rating: 4.92,
    reviewsCount: 98,
    resolvedDoubtsCount: 184,
    karmaPoints: 1240,
    isOnline: true,
    specializations: ['Algorithms', 'Dynamic Programming', 'Competitive Programming', 'C++'],
    bio: 'ICPC World Finalist & TA for CS201. Specializes in graph algorithms and amortized analysis.'
  },
  {
    id: 'usr-203',
    name: 'Amina Al-Mansoor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: 'Machine Learning',
    year: 'Masters Graduate',
    rating: 4.95,
    reviewsCount: 115,
    resolvedDoubtsCount: 220,
    karmaPoints: 1530,
    isOnline: false,
    specializations: ['PyTorch', 'Transformers', 'Computer Vision', 'CUDA Optimization'],
    bio: 'AI researcher working on multimodal foundational models. Available for deep neural debugging and math.'
  },
  {
    id: 'usr-204',
    name: 'Kavita Rao',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    department: 'Information Systems',
    year: 'Junior (3rd Year)',
    rating: 4.88,
    reviewsCount: 64,
    resolvedDoubtsCount: 112,
    karmaPoints: 890,
    isOnline: true,
    specializations: ['PostgreSQL', 'Redis', 'System Design', 'TypeScript'],
    bio: 'Passionate about databases, indexing architectures, and clean backend design.'
  }
];

export const MOCK_KNOWLEDGE_VAULT: KnowledgeItem[] = [
  {
    id: 'kb-501',
    title: 'Complete Master Guide: B-Trees vs LSM-Trees Storage Engine Tradeoffs',
    category: 'Database Systems',
    courseCode: 'CS245',
    author: 'Prof. Michael Stonebraker Research Group',
    verificationBadge: true,
    upvotes: 342,
    views: 2450,
    lastUpdated: 'Yesterday',
    tags: ['Storage Engines', 'B-Tree', 'LSM-Tree', 'SSTables', 'Compaction'],
    snippet: 'Comprehensive visual comparison of write amplification vs read amplification across RocksDB LSMs and WiredTiger B+ Trees under high concurrency workloads.',
    similarityScore: 0.96
  },
  {
    id: 'kb-502',
    title: 'Memory Allocators Deep Dive: jemalloc vs tcmalloc Arena Architecture',
    category: 'Operating Systems',
    courseCode: 'CS140',
    author: 'Devon Vance (TA)',
    verificationBadge: true,
    upvotes: 189,
    views: 1200,
    lastUpdated: '3 days ago',
    tags: ['OS', 'Memory Management', 'Thread Caching', 'Virtual Memory'],
    snippet: 'How thread-caching and buddy memory allocation mitigate lock contention in multi-threaded C/C++ applications.',
    similarityScore: 0.91
  },
  {
    id: 'kb-503',
    title: 'Vector Embeddings & Cosine vs Dot-Product Distance in High Dimensions',
    category: 'Artificial Intelligence',
    courseCode: 'AI401',
    author: 'HailLearn AI Knowledge Aggregator',
    verificationBadge: true,
    upvotes: 412,
    views: 3100,
    lastUpdated: 'May 2026',
    tags: ['Vector Search', 'Embeddings', 'HNSW', 'RAG'],
    snippet: 'Mathematical derivation of curse of dimensionality on L2 distance and why normalized cosine similarity performs superiorly for semantic retrieval.',
    similarityScore: 0.98
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'crs-1',
    code: 'CS201',
    title: 'Advanced Data Structures & Algorithms',
    instructor: 'Prof. Thomas Cormen',
    credits: 4,
    progress: 78,
    activeDoubts: 14,
    enrolledStudents: 240,
    syllabusCovered: 82,
    nextLecture: 'Tomorrow, 10:00 AM (Room 302)',
    category: 'Computer Science'
  },
  {
    id: 'crs-2',
    code: 'CS305',
    title: 'Distributed Systems & Cloud Computing',
    instructor: 'Dr. Sarah Jenkins',
    credits: 4,
    progress: 64,
    activeDoubts: 9,
    enrolledStudents: 180,
    syllabusCovered: 68,
    nextLecture: 'Thursday, 02:00 PM (Lab 4B)',
    category: 'Systems'
  },
  {
    id: 'crs-3',
    code: 'AI401',
    title: 'Deep Neural Architectures & LLMs',
    instructor: 'Prof. Andrew Ng Group',
    credits: 4,
    progress: 88,
    activeDoubts: 21,
    enrolledStudents: 310,
    syllabusCovered: 90,
    nextLecture: 'Friday, 11:30 AM (Auditorium 1)',
    category: 'AI & Data Science'
  },
  {
    id: 'crs-4',
    code: 'CS245',
    title: 'Database Architecture & Internals',
    instructor: 'Prof. Jennifer Widom',
    credits: 3,
    progress: 52,
    activeDoubts: 7,
    enrolledStudents: 195,
    syllabusCovered: 55,
    nextLecture: 'Monday, 09:00 AM (Online Room)',
    category: 'Data Engineering'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'AI Solved Your Doubt with 98% Confidence',
    message: 'Your query on Bellman-Ford vs Dijkstra was resolved and verified with syllabus references.',
    timestamp: '10m ago',
    read: false,
    type: 'ai'
  },
  {
    id: 'notif-2',
    title: 'Dr. Sarah Jenkins accepted your doubt request',
    message: 'Faculty mentor joined your thread on Raft Consensus split-brain analysis.',
    timestamp: '45m ago',
    read: false,
    type: 'mentor'
  },
  {
    id: 'notif-3',
    title: 'New Knowledge Vault Article Published',
    message: 'CS305 Distributed Systems exam cheat sheet is now available in the Knowledge Vault.',
    timestamp: '2h ago',
    read: true,
    type: 'course'
  }
];
