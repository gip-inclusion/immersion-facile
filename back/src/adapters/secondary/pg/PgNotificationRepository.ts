import { PoolClient } from "pg";
import format from "pg-format";
import { uniq } from "ramda";
import { exhaustiveCheck } from "shared";
import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "../../../domain/generic/notifications/entities/Notification";
import { NotificationRepository } from "../../../domain/generic/notifications/ports/NotificationRepository";

export class PgNotificationRepository implements NotificationRepository {
  constructor(private client: PoolClient) {}

  async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    switch (kind) {
      case "sms":
        return this.getSmsNotification(id);
      case "email":
        return this.getEmailNotification(id);
      default:
        exhaustiveCheck(kind, {
          variableName: "notificationKind",
          throwIfReached: true,
        });
    }
  }

  async save(notification: Notification): Promise<void> {
    switch (notification.kind) {
      case "sms":
        return this.saveSmsNotification(notification);
      case "email": {
        const recipients = uniq(notification.templatedContent.recipients);
        const cc = uniq(notification.templatedContent.cc ?? []).filter(
          (ccEmail) => !recipients.includes(ccEmail),
        );

        const templatedContent = {
          ...notification.templatedContent,
          recipients,
          ...(cc.length ? { cc } : {}),
        };

        return this.saveEmailNotification({
          ...notification,
          templatedContent,
        });
      }
      default:
        return exhaustiveCheck(notification, {
          variableName: "notificationKind",
          throwIfReached: true,
        });
    }
  }

  private async saveSmsNotification(
    notification: SmsNotification,
  ): Promise<void> {
    const {
      id,
      createdAt,
      followedIds,
      templatedContent: { kind, recipientPhone, params },
    } = notification;

    await this.client.query(
      `
      INSERT INTO notifications_sms (id, sms_kind, recipient_phone, created_at, convention_id, establishment_siret, agency_id, params) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      // prettier-ignore
      [ id, kind, recipientPhone, createdAt, followedIds.conventionId, followedIds.establishmentSiret, followedIds.agencyId, params ],
    );
  }

  private async saveEmailNotification(notification: EmailNotification) {
    const {
      id,
      createdAt,
      followedIds,
      templatedContent: { type: kind, recipients, cc, params },
    } = notification;

    await this.client.query(
      `
      INSERT INTO notifications_email (id, email_kind, created_at, convention_id, establishment_siret, agency_id, params)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      // prettier-ignore
      [ id, kind, createdAt, followedIds.conventionId, followedIds.establishmentSiret, followedIds.agencyId, params ],
    );

    const addRecipientsToQuery = format(
      `INSERT INTO notifications_email_recipients (notifications_email_id, email, recipient_type) VALUES %L`,
      recipients.map((recipient) => [id, recipient, "to"]),
    );
    await this.client.query(addRecipientsToQuery);

    if (cc && cc.length > 0) {
      const addRecipientsCcQuery = format(
        `INSERT INTO notifications_email_recipients (notifications_email_id, email, recipient_type) VALUES %L`,
        cc.map((recipient) => [id, recipient, "cc"]),
      );
      await this.client.query(addRecipientsCcQuery);
    }
  }

  private async getSmsNotification(
    id: NotificationId,
  ): Promise<SmsNotification> {
    const response = await this.client.query(
      `
          SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
          'id', id,
          'kind', 'sms',
          'createdAt', TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'followedIds', JSON_BUILD_OBJECT(
            'conventionId', convention_id,
            'establishmentId', establishment_siret,
            'agencyId', agency_id),
          'templatedContent', JSON_BUILD_OBJECT(
              'kind', sms_kind,
              'recipientPhone', recipient_phone,
              'params', params
            )
        )) as notif
        FROM notifications_sms
        WHERE id = $1
          `,
      [id],
    );
    return response.rows[0]?.notif;
  }

  private async getEmailNotification(
    id: NotificationId,
  ): Promise<EmailNotification> {
    const response = await this.client.query(
      `
          SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
          'id', id,
          'kind', 'email',
          'createdAt', TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'followedIds', JSON_BUILD_OBJECT(
            'conventionId', convention_id,
            'establishmentId', establishment_siret,
            'agencyId', agency_id),
          'templatedContent', JSON_BUILD_OBJECT(
              'type', email_kind,
              'recipients', ARRAY(SELECT email FROM notifications_email_recipients WHERE notifications_email_id = $1 AND recipient_type = 'to'),
              'cc', ARRAY(SELECT email FROM notifications_email_recipients WHERE notifications_email_id = $1 AND recipient_type = 'cc'),
              'params', params
            )
        )) as notif
        FROM notifications_email e
        WHERE id = $1
          `,
      [id],
    );
    return response.rows[0]?.notif;
  }
}
