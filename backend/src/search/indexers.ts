import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { Mentor } from '../models/Mentor.js';
import { Doubt } from '../models/Doubt.js';
import { indexDocument, removeDocument, countDocuments, listDocIds, IndexInput, IndexName } from './engine.js';

// Two indexes:
//   vault   — Knowledge Vault entries (faculty-verified articles and verified doubts): RAG context
//   mentors — mentor expertise profiles (specializations, bio, doubts they answered): mentor routing

type KnowledgeRow = {
  _id: unknown; title: string; category: string; courseCode: string; author: string; verificationBadge?: boolean;
  tags?: string[]; snippet: string; content?: string; doubtId?: string;
};

export const knowledgeInput = (k: KnowledgeRow): IndexInput => {
  const body = k.content || k.snippet;
  return {
    id: String(k._id),
    fields: { title: k.title, meta: [...(k.tags ?? []), k.category, k.courseCode].join(' '), body },
    filters: { courseCode: k.courseCode, category: k.category },
    source: {
      title: k.title, courseCode: k.courseCode, category: k.category, author: k.author,
      verified: !!k.verificationBadge, doubtId: k.doubtId, excerpt: body.slice(0, 1500), body,
    },
  };
};

export const indexKnowledgeItem = async (id: string): Promise<void> => {
  const k = await KnowledgeItem.findById(id).lean<KnowledgeRow>();
  if (k) await indexDocument('vault', knowledgeInput(k));
  else await removeDocument('vault', id);
};

type MentorRow = { _id: unknown; userId?: string; name: string; avatar?: string; department: string; specializations?: string[]; bio?: string };

export const mentorInput = (m: MentorRow, answeredTitles: string[]): IndexInput => ({
  id: String(m._id),
  fields: {
    title: (m.specializations ?? []).join(' '),
    meta: m.department,
    body: [m.bio ?? '', ...answeredTitles].join('\n'),
  },
  source: { name: m.name, userId: m.userId, avatar: m.avatar ?? '', body: m.bio ?? '' },
});

const answeredTitlesFor = async (userIds: string[]): Promise<Map<string, string[]>> => {
  const rows = await Doubt.aggregate<{ _id: string; titles: string[] }>([
    { $unwind: '$answers' },
    { $match: { 'answers.authorId': { $in: userIds } } },
    { $group: { _id: '$answers.authorId', titles: { $addToSet: '$title' } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.titles.slice(0, 50)]));
};

// Only mentors with an account are indexed: seeded profiles without one can't log in to answer.
export const indexMentorByUserId = async (userId: string): Promise<void> => {
  const m = await Mentor.findOne({ userId }).lean<MentorRow>();
  if (!m) return;
  const titles = (await answeredTitlesFor([userId])).get(userId) ?? [];
  await indexDocument('mentors', mentorInput(m, titles));
};

export const removeMentorFromIndex = (mentorId: string): Promise<void> => removeDocument('mentors', mentorId);

// Rebuilds an index from its source collection, removing entries whose source no longer exists.
// Learned quality weights survive because indexDocument keeps them.
export const reindex = async (index: IndexName): Promise<number> => {
  let inputs: IndexInput[];
  if (index === 'vault') {
    inputs = (await KnowledgeItem.find().lean<KnowledgeRow[]>()).map(knowledgeInput);
  } else {
    const mentors = await Mentor.find({ userId: { $exists: true, $nin: [null, ''] } }).lean<MentorRow[]>();
    const titles = await answeredTitlesFor(mentors.map((m) => m.userId as string));
    inputs = mentors.map((m) => mentorInput(m, titles.get(m.userId as string) ?? []));
  }
  const keep = new Set(inputs.map((i) => i.id));
  for (const id of await listDocIds(index)) if (!keep.has(id)) await removeDocument(index, id);
  for (const input of inputs) await indexDocument(index, input);
  return inputs.length;
};

// Self-healing: if the number of indexed documents differs from the source collection (first run,
// seeding, a missed hook), rebuild that index. Checked at most once a minute per index.
const lastCheck = new Map<IndexName, number>();
export const ensureIndex = async (index: IndexName): Promise<void> => {
  if (Date.now() - (lastCheck.get(index) ?? 0) < 60_000) return;
  lastCheck.set(index, Date.now());
  const expected = index === 'vault'
    ? await KnowledgeItem.countDocuments()
    : await Mentor.countDocuments({ userId: { $exists: true, $nin: [null, ''] } });
  if ((await countDocuments(index)) !== expected) {
    const n = await reindex(index);
    console.log(`[search] rebuilt "${index}" index (${n} documents)`);
  }
};
