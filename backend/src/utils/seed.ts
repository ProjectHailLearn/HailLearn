import { Mentor } from '../models/Mentor.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { Doubt } from '../models/Doubt.js';

const SEED_MENTORS = [
  {
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
    bio: 'Associate Professor & Systems researcher. Happy to walk through consensus proofs and kernel network primitives.',
  },
  {
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
    bio: 'ICPC World Finalist & TA for CS201. Specializes in graph algorithms and amortized analysis.',
  },
  {
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
    bio: 'AI researcher working on multimodal foundational models. Available for deep neural debugging and math.',
  },
  {
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
    bio: 'Passionate about databases, indexing architectures, and clean backend design.',
  },
];

const SEED_KNOWLEDGE = [
  {
    title: 'Complete Master Guide: B-Trees vs LSM-Trees Storage Engine Tradeoffs',
    category: 'Database Systems',
    courseCode: 'CS245',
    author: 'Prof. Michael Stonebraker Research Group',
    verificationBadge: true,
    upvotes: 342,
    views: 2450,
    tags: ['Storage Engines', 'B-Tree', 'LSM-Tree', 'SSTables', 'Compaction'],
    snippet: 'Comprehensive visual comparison of write amplification vs read amplification across RocksDB LSMs and WiredTiger B+ Trees under high concurrency workloads.',
    similarityScore: 0.96,
  },
  {
    title: 'Memory Allocators Deep Dive: jemalloc vs tcmalloc Arena Architecture',
    category: 'Operating Systems',
    courseCode: 'CS140',
    author: 'Devon Vance (TA)',
    verificationBadge: true,
    upvotes: 189,
    views: 1200,
    tags: ['OS', 'Memory Management', 'Thread Caching', 'Virtual Memory'],
    snippet: 'How thread-caching and buddy memory allocation mitigate lock contention in multi-threaded C/C++ applications.',
    similarityScore: 0.91,
  },
  {
    title: 'Vector Embeddings & Cosine vs Dot-Product Distance in High Dimensions',
    category: 'Artificial Intelligence',
    courseCode: 'AI401',
    author: 'HailLearn AI Knowledge Aggregator',
    verificationBadge: true,
    upvotes: 412,
    views: 3100,
    tags: ['Vector Search', 'Embeddings', 'HNSW', 'RAG'],
    snippet: 'Mathematical derivation of curse of dimensionality on L2 distance and why normalized cosine similarity performs superiorly for semantic retrieval.',
    similarityScore: 0.98,
  },
  {
    title: 'Master Theorem Cases and Polynomial Log-Factor Extensions',
    category: 'Algorithms',
    courseCode: 'CS201',
    author: 'Prof. Thomas Cormen Notes',
    verificationBadge: true,
    upvotes: 278,
    views: 1890,
    tags: ['Divide & Conquer', 'Recurrences', 'Asymptotic Analysis'],
    snippet: 'Detailed walkthrough of all three Master Theorem cases with proof sketches and handling of poly-log factors in the critical case.',
    similarityScore: 0.89,
  },
];

const SEED_DOUBTS = [
  {
    title: 'Why is Bellman-Ford O(V*E) while Dijkstra with binary heap is O((V+E)log V)?',
    description: 'I understand Dijkstra picks the greedy minimum, but why does Bellman-Ford need exactly V-1 relaxations across all edges? How does negative cycle detection work under the hood?',
    codeSnippet: `// Bellman-Ford Relaxation Loop\nfor (let i = 1; i <= V - 1; i++) {\n  for (const [u, v, weight] of edges) {\n    if (dist[u] !== Infinity && dist[u] + weight < dist[v]) {\n      dist[v] = dist[u] + weight;\n    }\n  }\n}`,
    subject: 'Data Structures & Algorithms',
    courseCode: 'CS201',
    tags: ['Graph Theory', 'Dynamic Programming', 'Complexity'],
    status: 'AI_RESOLVED' as const,
    author: { id: 'seed-usr-102', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', department: 'Computer Science' },
    aiConfidenceScore: 98,
    aiSolution: {
      summary: 'Bellman-Ford iteratively computes shortest paths with at most k edges. Since a simple shortest path has at most |V|-1 edges, |V|-1 passes over all |E| edges guarantee optimal distances.',
      steps: [
        { step: 1, title: 'Subproblem Invariance', content: 'After pass k, dist[v] holds the weight of the shortest path from source s to v containing at most k edges.' },
        { step: 2, title: 'Why |V| - 1 passes?', content: 'In any graph without negative cycles, the shortest path between any two vertices has at most |V| vertices, hence at most |V|-1 edges.' },
        { step: 3, title: 'Negative Cycle Proof', content: 'If an edge can still be relaxed in the |V|-th pass, there exists a path with |V| edges shorter than with |V|-1 edges, confirming an infinite decreasing cycle.' },
      ],
      citations: ['CLRS Introduction to Algorithms (4th Ed) - Chapter 24.1', 'Stanford CS161 Lecture 11'],
      suggestedReadings: ['Johnson Algorithm for Sparse Graphs', 'SPFA Heuristic Optimizations'],
    },
    upvotes: 24,
    views: 142,
  },
  {
    title: 'Raft Consensus: Handling Split Brain in 3-Node vs 5-Node Clusters during Network Partition',
    description: 'If a 5-node cluster partitions into (2 nodes) and (3 nodes), how does the minority partition prevent stale writes while the majority elects a new term leader?',
    subject: 'Distributed Systems',
    courseCode: 'CS305',
    tags: ['Consensus', 'Raft', 'Fault Tolerance'],
    status: 'MENTOR_ESCALATED' as const,
    author: { id: 'seed-usr-103', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', department: 'Systems Engineering' },
    aiConfidenceScore: 84,
    upvotes: 41,
    views: 310,
  },
];

export const seedDatabase = async (): Promise<void> => {
  const mentorCount = await Mentor.countDocuments();
  if (mentorCount === 0) {
    await Mentor.insertMany(SEED_MENTORS);
    console.log('Seeded mentors');
  }

  const knowledgeCount = await KnowledgeItem.countDocuments();
  if (knowledgeCount === 0) {
    await KnowledgeItem.insertMany(SEED_KNOWLEDGE);
    console.log('Seeded knowledge items');
  }

  const doubtCount = await Doubt.countDocuments();
  if (doubtCount === 0) {
    await Doubt.insertMany(SEED_DOUBTS);
    console.log('Seeded doubts');
  }
};
