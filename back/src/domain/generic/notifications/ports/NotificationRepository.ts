import {
  Notification,
  NotificationId,
  NotificationKind,
} from "../entities/Notification";

export interface NotificationRepository {
  save: (notification: Notification) => Promise<void>;
  getByIdAndKind: (
    id: NotificationId,
    kind: NotificationKind,
  ) => Promise<Notification | undefined>;
}
