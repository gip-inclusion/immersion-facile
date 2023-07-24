import { Kysely } from "kysely";
import format from "pg-format";
import { uniq } from "ramda";
import {
  EmailNotification,
  exhaustiveCheck,
  Notification,
  NotificationId,
  NotificationKind,
  NotificationsByKind,
  SmsNotification,
  TemplatedEmail,
} from "shared";
import {
  EmailNotificationFilters,
  NotificationRepository,
} from "../../../domain/generic/notifications/ports/NotificationRepository";
import { createLogger } from "../../../utils/logger";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";

const logger = createLogger(__filename);

export class PgNotificationRepository implements NotificationRepository {
  constructor(
    private transaction: Kysely<ImmersionDatabase>,
    private maxRetrievedNotifications: number = 30,
  ) {}

  async deleteAllEmailAttachements(): Promise<number> {
    const deletedContent = "deleted-content";
    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `
          UPDATE notifications_email_attachments
          SET attachment = jsonb_set(attachment::jsonb, '{content}', '"${deletedContent}"')
          WHERE attachment::jsonb ->> 'content' != '${deletedContent}';
      `,
    );
    return Number(response.numAffectedRows);
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

  private async getEmailNotificationById(
    id: NotificationId,
  ): Promise<EmailNotification> {
    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `
          SELECT ${buildEmailNotificationObject} as notif
          FROM notifications_email e
                   LEFT JOIN notifications_email_recipients r ON r.notifications_email_id = e.id
                   LEFT JOIN notifications_email_attachments a ON a.notifications_email_id = e.id
          WHERE e.id = $1
          GROUP BY e.id
      `,
      [id],
    );
    return response.rows[0]?.notif;
  }

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

    const subQueryToGetEmailsNotificationsIds = `SELECT e.id
                                                 FROM notifications_email e
                                                          LEFT JOIN notifications_email_recipients r ON id = r.notifications_email_id
                                                     ${
                                                       filterConditions.length >
                                                       0
                                                         ? "WHERE " +
                                                           filterConditions.join(
                                                             " AND ",
                                                           )
                                                         : ""
                                                     }
                                                 GROUP BY e.id
                                                 ORDER BY created_at DESC
                                                     LIMIT $${
                                                       filterValues.length + 1
                                                     }`;

    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `SELECT ${buildEmailNotificationObject} as notif
       FROM notifications_email e
                LEFT JOIN notifications_email_recipients r ON e.id = r.notifications_email_id
                LEFT JOIN notifications_email_attachments a ON e.id = a.notifications_email_id
       WHERE e.id IN (${subQueryToGetEmailsNotificationsIds})
       GROUP BY e.id
       ORDER BY created_at DESC`,
      [...filterValues, this.maxRetrievedNotifications],
    );

    return response.rows.map((row) => row.notif);
  }

  async getLastNotifications(): Promise<NotificationsByKind> {
    const smsResponse = await executeKyselyRawSqlQuery(
      this.transaction,
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

  private async getSmsNotificationById(
    id: NotificationId,
  ): Promise<SmsNotification> {
    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `
          SELECT ${buildSmsNotificationObject} as notif
          FROM notifications_sms
          WHERE id = $1
      `,
      [id],
    );
    return response.rows[0]?.notif;
  }

  private async insertEmailAttachments({
    id,
    templatedContent: { attachments },
  }: EmailNotification) {
    if (!attachments || attachments.length === 0) return;
    if (attachments.length > 0) {
      const query = `INSERT INTO notifications_email_attachments (notifications_email_id, attachment)
                     VALUES %L`;
      const values = attachments.map((attachment) => [id, attachment]);
      await executeKyselyRawSqlQuery(
        this.transaction,
        format(query, values),
      ).catch((error) => {
        logger.error(
          { query, values, error },
          "PgNotificationRepository_insertEmailAttachments_QueryErrored",
        );
        throw error;
      });
    }
  }

  private async insertEmailRecipients(
    recipientKind: "to" | "cc",
    { id, templatedContent }: EmailNotification,
  ) {
    const values = recipientsByKind(id, recipientKind, templatedContent);
    if (values.length > 0) {
      const query = `INSERT INTO notifications_email_recipients (notifications_email_id, email, recipient_type)
                     VALUES %L`;
      await executeKyselyRawSqlQuery(
        this.transaction,
        format(query, values),
      ).catch((error) => {
        logger.error(
          { query, values, error },
          `PgNotificationRepository_insertEmailRecipients_${recipientKind}_QueryErrored`,
        );
        throw error;
      });
    }
  }

  private async insertNotificationEmail({
    id,
    createdAt,
    followedIds,
    templatedContent,
  }: EmailNotification) {
    const query = `
        INSERT INTO notifications_email (id, email_kind, created_at, convention_id, establishment_siret, agency_id,
                                         params, reply_to_name, reply_to_email, sender_email, sender_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    // prettier-ignore
    const values = [id, templatedContent.kind, createdAt, followedIds.conventionId, followedIds.establishmentSiret, followedIds.agencyId, templatedContent.params, templatedContent.replyTo?.name, templatedContent.replyTo?.email, templatedContent.sender?.email, templatedContent.sender?.name];
    await executeKyselyRawSqlQuery(this.transaction, query, values).catch(
      (error) => {
        logger.error(
          { query, values, error },
          "PgNotificationRepository_insertNotificationEmail_QueryErrored",
        );
        throw error;
      },
    );
  }

  async save(notification: Notification): Promise<void> {
    switch (notification.kind) {
      case "sms":
        return this.saveSmsNotification(notification);
      case "email": {
        const recipients = uniq(notification.templatedContent.recipients);
        return this.saveEmailNotification({
          ...notification,
          templatedContent: {
            ...notification.templatedContent,
            recipients,
            cc: uniq(notification.templatedContent.cc ?? []).filter(
              (ccEmail) => !recipients.includes(ccEmail),
            ),
          },
        });
      }
      default:
        return exhaustiveCheck(notification, {
          variableName: "notificationKind",
          throwIfReached: true,
        });
    }
  }

  private async saveEmailNotification(notification: EmailNotification) {
    await this.insertNotificationEmail(notification);
    await this.insertEmailRecipients("to", notification);
    await this.insertEmailRecipients("cc", notification);
    await this.insertEmailAttachments(notification);
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

    await executeKyselyRawSqlQuery(
      this.transaction,
      `
          INSERT INTO notifications_sms (id, sms_kind, recipient_phone, created_at, convention_id, establishment_siret,
                                         agency_id, params)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      // prettier-ignore
      [id, kind, recipientPhone, createdAt, followedIds.conventionId, followedIds.establishmentSiret, followedIds.agencyId, params],
    );
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
              'params', params,
              'sender', CASE
                WHEN sender_email IS NULL THEN NULL
                ELSE JSON_BUILD_OBJECT(
                  'name', sender_name,
                  'email', sender_email
                ) END,
                
              'attachments', CASE 
                      WHEN ARRAY_REMOVE(ARRAY_AGG(DISTINCT a.attachment), NULL) = ARRAY[]::jsonb[] 
                        THEN NULL
                      ELSE ARRAY_REMOVE(ARRAY_AGG(DISTINCT a.attachment), NULL)
                    END
            )
        ))`;

const recipientsByKind = (
  id: NotificationId,
  recipientKind: "to" | "cc",
  { recipients, cc }: TemplatedEmail,
): [id: NotificationId, recipient: string, recipientkind: "to" | "cc"][] => {
  if (recipientKind === "to")
    return recipients.map((recipient) => [id, recipient, recipientKind]);
  if (recipientKind === "cc" && cc)
    return cc.map((ccRecipient) => [id, ccRecipient, recipientKind]);
  return [];
};
