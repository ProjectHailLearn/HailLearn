import { Mentor } from '../models/Mentor.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { Doubt } from '../models/Doubt.js';
import { Course } from '../models/Course.js';
import { StudyRoom } from '../models/StudyRoom.js';

const SEED_COURSES = [
  { code: 'CS201', title: 'Advanced Data Structures & Algorithms', subject: 'Data Structures & Algorithms', instructor: 'Prof. Thomas Cormen', credits: 4, category: 'Computer Science', syllabusCovered: 82, nextLecture: 'Tomorrow, 10:00 AM (Room 302)', baseEnrollment: 240 },
  { code: 'CS305', title: 'Distributed Systems & Cloud Computing', subject: 'Distributed Systems', instructor: 'Dr. Sarah Jenkins', credits: 4, category: 'Systems', syllabusCovered: 68, nextLecture: 'Thursday, 02:00 PM (Lab 4B)', baseEnrollment: 180 },
  { code: 'AI401', title: 'Deep Neural Architectures & LLMs', subject: 'Deep Learning & LLMs', instructor: 'Prof. Andrew Ng Group', credits: 4, category: 'AI & Data Science', syllabusCovered: 90, nextLecture: 'Friday, 11:30 AM (Auditorium 1)', baseEnrollment: 310 },
  { code: 'CS245', title: 'Database Architecture & Internals', subject: 'Database Architecture', instructor: 'Prof. Jennifer Widom', credits: 3, category: 'Data Engineering', syllabusCovered: 55, nextLecture: 'Monday, 09:00 AM (Online Room)', baseEnrollment: 195 },
];

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
    content: `Overview
B-Trees and LSM-Trees are the two dominant storage-engine designs. B-Trees (InnoDB, WiredTiger, PostgreSQL) update data in place; LSM-Trees (RocksDB, Cassandra, LevelDB) buffer writes in memory and flush them as immutable sorted files.

How a B+ Tree works
• Data lives in fixed-size pages (typically 4–16 KB) arranged as a balanced tree; leaves hold keys/values and are linked for range scans.
• A write finds the leaf page and modifies it in place, splitting pages when they overflow.
• Lookups cost O(log_B N) page reads — usually 3–4 levels even for billions of keys.

How an LSM-Tree works
• Writes go to a write-ahead log and an in-memory sorted memtable.
• When the memtable fills, it is flushed to disk as an immutable SSTable.
• Background compaction merges SSTables level by level, discarding overwritten and deleted (tombstoned) keys.
• Reads check the memtable, then SSTables from newest to oldest, using Bloom filters to skip files that cannot contain the key.

The three amplifications
• Write amplification (bytes written to disk ÷ bytes written by the app): B-Trees rewrite a whole page for a small change; LSMs rewrite data during each compaction. Leveled LSMs often reach 10–30x, B-Trees vary with page size and update pattern.
• Read amplification: B-Trees need about one page read per level. LSMs may consult several levels, mitigated by Bloom filters and block caches.
• Space amplification: B-Tree pages are often partly empty after splits; LSMs temporarily keep stale versions until compaction.

When to choose which
• Write-heavy, append-mostly workloads (logs, time series, metrics): LSM-Tree.
• Read-heavy workloads with point lookups and range scans on SSDs: B+ Tree.
• Tune LSMs with compaction strategy (leveled = less space and read amp; tiered = less write amp).

Key takeaway
Neither design wins everywhere: B-Trees optimise reads and predictable latency, LSM-Trees optimise sustained write throughput at the cost of background compaction work.`,
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
    content: `The problem
A single global heap protected by one lock becomes a bottleneck when many threads call malloc/free concurrently. Modern allocators avoid this with per-thread or per-CPU caches and multiple independent arenas.

Size classes
Both allocators round requests up to a fixed set of size classes (e.g. 8, 16, 32, 48 … bytes). Objects of one class are carved out of the same run/span, which keeps fragmentation predictable and makes free lists simple.

tcmalloc (Google)
• Thread-local cache: each thread (newer versions: each CPU) keeps free lists per size class, so most malloc/free calls take no lock at all.
• Central free lists refill or drain thread caches in batches.
• Page heap: large allocations and spans of pages are managed centrally.

jemalloc (FreeBSD, Meta)
• Multiple arenas (by default about 4 × CPU count); threads are assigned to arenas round-robin, spreading lock contention.
• Thread caches (tcache) sit in front of arenas for small sizes.
• Memory is split into extents; slabs serve small classes, and dirty pages are purged back to the OS with decay timers.

Buddy allocation
The OS kernel manages physical pages with a buddy allocator: blocks are powers of two, a free block is split in half until it fits, and freed buddies are merged back. This keeps external fragmentation low for page-sized allocations that user-space allocators request.

Trade-offs
• Thread caches trade some memory overhead (idle cached objects) for speed.
• jemalloc tends to have lower fragmentation in long-running servers; tcmalloc is very fast for allocation-heavy workloads.
• Both expose statistics (malloc_stats, MallocExtension) to tune cache sizes.

Key takeaway
Lock contention is avoided by making the common path thread-local and only touching shared structures in batches.`,
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
    content: `Definitions
For vectors a and b:
• Dot product: a·b = Σ aᵢbᵢ
• Cosine similarity: cos θ = (a·b) / (‖a‖ ‖b‖)
• Euclidean (L2) distance: ‖a − b‖ = √Σ (aᵢ − bᵢ)²

How they relate
If both vectors are normalised to unit length, ‖a − b‖² = 2 − 2·cos θ. So for normalised embeddings, ranking by cosine, dot product or L2 distance gives the same order.

The curse of dimensionality
For random points in high dimensions, distances concentrate: the ratio (max distance − min distance) / min distance tends to 0 as dimension grows. Every point looks almost equally far away, so raw L2 distance loses contrast.

Why cosine works well for semantic search
• Embedding models encode meaning mostly in direction; magnitude often reflects things like text length or token frequency.
• Cosine ignores magnitude, so a short and a long passage about the same topic still match.
• Most sentence-embedding models are trained with a cosine or normalised dot-product objective, so cosine matches how they were trained.

When raw dot product is better
Some retrieval models (e.g. maximum inner product search setups) deliberately encode relevance or popularity in vector length. Then the un-normalised dot product is the intended score.

Vector indexes
ANN indexes such as HNSW or IVF support cosine, dot product and L2. A common trick: normalise vectors once at insert time and use dot product, which is the cheapest to compute.

Key takeaway
Use the similarity your embedding model was trained with; for most text models that is cosine (equivalently, dot product on normalised vectors).`,
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
    content: `The recurrence
The Master Theorem solves T(n) = a·T(n/b) + f(n), with a ≥ 1 and b > 1. Compare f(n) with n^(log_b a), the total work done at the leaves of the recursion tree.

Case 1 — leaves dominate
If f(n) = O(n^(log_b a − ε)) for some ε > 0, then T(n) = Θ(n^(log_b a)).
Example: T(n) = 8T(n/2) + n² → log₂8 = 3, f = n² is smaller → Θ(n³).

Case 2 — balanced (the critical case)
If f(n) = Θ(n^(log_b a) · log^k n) with k ≥ 0, then T(n) = Θ(n^(log_b a) · log^(k+1) n).
Examples:
• Merge sort: T(n) = 2T(n/2) + n → log₂2 = 1, k = 0 → Θ(n log n).
• T(n) = 2T(n/2) + n log n → k = 1 → Θ(n log² n).

Case 3 — root dominates
If f(n) = Ω(n^(log_b a + ε)) and the regularity condition a·f(n/b) ≤ c·f(n) holds for some c < 1, then T(n) = Θ(f(n)).
Example: T(n) = 2T(n/2) + n² → Θ(n²).

Proof sketch
Draw the recursion tree: level i has aⁱ subproblems of size n/bⁱ, costing aⁱ·f(n/bⁱ). There are log_b n levels and n^(log_b a) leaves. The three cases correspond to the per-level cost decreasing geometrically (leaves win), staying equal (multiply by the number of levels, adding one log factor), or increasing geometrically (root wins).

When it does not apply
• Gaps between cases, e.g. T(n) = 2T(n/2) + n/log n (use Akra–Bazzi or a recursion tree).
• Unequal splits like T(n) = T(n/3) + T(2n/3) + n.
• Subtractive recurrences like T(n) = T(n − 1) + n.

Key takeaway
Compute n^(log_b a), compare it with f(n), and pick the case — the log-factor extension of case 2 covers most divide-and-conquer algorithms you will meet.`,
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

  const courseCount = await Course.countDocuments();
  if (courseCount === 0) {
    await Course.insertMany(SEED_COURSES);
    console.log('Seeded courses');
  }

  const roomCount = await StudyRoom.countDocuments();
  if (roomCount === 0) {
    const now = Date.now();
    await StudyRoom.insertMany([
      { title: 'Raft Consensus Proof Walkthrough', courseCode: 'CS305', hostId: 'seed', hostName: 'Dr. Sarah Jenkins', scheduledAt: new Date(now - 10 * 60000), durationMins: 120 },
      { title: 'Dynamic Programming Problem Jam', courseCode: 'CS201', hostId: 'seed', hostName: 'Devon Vance (TA)', scheduledAt: new Date(now + 3 * 3600000), durationMins: 90 },
    ]);
    console.log('Seeded study rooms');
  }

  const doubtCount = await Doubt.countDocuments();
  if (doubtCount === 0) {
    await Doubt.insertMany(SEED_DOUBTS);
    console.log('Seeded doubts');
  }
};
