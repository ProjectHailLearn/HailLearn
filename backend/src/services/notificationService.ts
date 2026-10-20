import { Notification, INotification } from '../models/Notification.js';

export const notify = async (
  userId: string | undefined,
  payload: { type: INotification['type']; title: string; message: string; link?: string }
): Promise<void> => {
  if (!userId) return;
  try {
    await Notification.create({ userId, ...payload });
  } catch (err) {
    console.error('[notify] failed:', (err as Error).message);
  }
};
