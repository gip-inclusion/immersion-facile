import { PoolClient } from "pg";
import format from "pg-format";
import { uniq } from "ramda";
import { exhaustiveCheck, NotificationsByKind } from "shared";
import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  SmsNotification,
} from "shared";
import {
  EmailNotificationFilters,
  NotificationRepository,
} from "../../../domain/generic/notifications/ports/NotificationRepository";

export class PgNotificationRepository implements NotificationRepository {
  constructor(
    private client: PoolClient,
    private maxRetrievedNotifications: number = 30,
  ) {}

  async getEmailsByFilters({
    since,
    emailKind,
    email,
  }: EmailNotificationFilters = {}): Promise<EmailNotification[]> {
    const filterValues: any[] = [];
    const filterConditions: string[] = [];

    if (since) {
      filterConditions.push(`created_at >= $${filterValues.length + 1}`);
      filterValues.push(since.toISOString());
    }

    if (emailKind) {
      filterConditions.push(`email_kind = $${filterValues.length + 1}`);
      filterValues.push(emailKind);
    }

    if (email) {
      filterConditions.push(`r.email = $${filterValues.length + 1}`);
      filterValues.push(email);
    }

    const subQueryToGetEmailsNotificationsIds = `SELECT e.id FROM notifications_email e
      LEFT JOIN notifications_email_recipients r ON id = r.notifications_email_id
      ${
        filterConditions.length > 0
          ? "WHERE " + filterConditions.join(" AND ")
          : ""
      }
      GROUP BY e.id
      ORDER BY created_at DESC
      LIMIT $${filterValues.length + 1}`;

    const response = await this.client.query(
      `SELECT ${buildEmailNotificationObject} as notif
        FROM notifications_email e
        LEFT JOIN notifications_email_recipients r ON e.id = r.notifications_email_id
        WHERE e.id IN (${subQueryToGetEmailsNotificationsIds})
        GROUP BY e.id
        ORDER BY created_at DESC`,
      [...filterValues, this.maxRetrievedNotifications],
    );

    return response.rows.map((row) => row.notif);
  }

  async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    switch (kind) {
      case "sms":
        return this.getSmsNotificationById(id);
      case "email":
        return this.getEmailNotificationById(id);
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
          cc,
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
      templatedContent: { kind, recipients, cc, replyTo, params },
    } = notification;

    await this.client.query(
      `
      INSERT INTO notifications_email (id, email_kind, created_at, convention_id, establishment_siret, agency_id, params, reply_to_name, reply_to_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      // prettier-ignore
      [ id, kind, createdAt, followedIds.conventionId, followedIds.establishmentSiret, followedIds.agencyId, params, replyTo?.name, replyTo?.email],
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

  private async getSmsNotificationById(
    id: NotificationId,
  ): Promise<SmsNotification> {
    const response = await this.client.query(
      `
          SELECT ${buildSmsNotificationObject} as notif
        FROM notifications_sms
        WHERE id = $1
          `,
      [id],
    );
    return response.rows[0]?.notif;
  }

  private async getEmailNotificationById(
    id: NotificationId,
  ): Promise<EmailNotification> {
    const response = await this.client.query(
      `
        SELECT ${buildEmailNotificationObject} as notif
        FROM notifications_email e
        LEFT JOIN notifications_email_recipients r ON r.notifications_email_id = e.id
        WHERE id = $1
        GROUP BY e.id
          `,
      [id],
    );
    return response.rows[0]?.notif;
  }

  async getLastNotifications(): Promise<NotificationsByKind> {
    const smsResponse = await this.client.query(
      `
        SELECT ${buildSmsNotificationObject} as notif
        FROM notifications_sms
        ORDER BY created_at DESC
        LIMIT $1
          `,
      [this.maxRetrievedNotifications],
    );

    return {
      emails: await this.getEmailsByFilters(),
      sms: smsResponse.rows.map((row) => row.notif),
    };
  }
}

const buildSmsNotificationObject = `JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
          'id', id,
          'kind', 'sms',
          'createdAt', TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'followedIds', JSON_BUILD_OBJECT(
            'conventionId', convention_id,
            'establishmentId', establishment_siret,
            'agencyId', agency_id
          ),
          'templatedContent', JSON_BUILD_OBJECT(
              'kind', sms_kind,
              'recipientPhone', recipient_phone,
              'params', params
            )
        ))`;

const buildEmailNotificationObject = `JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
          'id', e.id,
          'kind', 'email',
          'createdAt', TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'followedIds', JSON_BUILD_OBJECT(
            'conventionId', convention_id,
            'establishmentId', establishment_siret,
            'agencyId', agency_id
          ),
          'templatedContent', JSON_BUILD_OBJECT(
              'kind', email_kind,
              'replyTo', CASE
                WHEN reply_to_email IS NULL THEN NULL 
                ELSE JSON_BUILD_OBJECT(
                'name', reply_to_name,
                'email', reply_to_email
                ) END,
              'recipients', ARRAY_REMOVE(ARRAY_AGG(CASE WHEN r.recipient_type = 'to' THEN r.email ELSE NULL END), NULL),
              'cc', ARRAY_REMOVE(ARRAY_AGG(CASE WHEN r.recipient_type = 'cc' THEN r.email ELSE NULL END), NULL),
              'params', params
            )
        ))`;
