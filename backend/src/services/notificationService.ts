import { Notification, INotification } from '../models/Notification.js';
import { emitToUser } from '../socket/index.js';

export const notify = async (
  userId: string | undefined,
  payload: { type: INotification['type']; title: string; message: string; link?: string }
): Promise<void> => {
  if (!userId) return;
  try {
    const doc = await Notification.create({ userId, ...payload });
    emitToUser(userId, 'notification', doc);
  } catch (err) {
    console.error('[notify] failed:', (err as Error).message);
  }
};
