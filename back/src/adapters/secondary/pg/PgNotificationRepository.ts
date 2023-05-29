import { PoolClient } from "pg";
import {
  Notification,
  NotificationId,
  NotificationKind,
} from "../../../domain/generic/notifications/entities/Notification";
import { NotificationRepository } from "../../../domain/generic/notifications/ports/NotificationRepository";

export class PgNotificationRepository implements NotificationRepository {
  constructor(private client: PoolClient) {}

  getByIdAndKind(
    _id: NotificationId,
    _kind: NotificationKind,
  ): Promise<Notification | undefined> {
    throw new Error("Method not implemented.");
  }

  save(_notification: Notification): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
