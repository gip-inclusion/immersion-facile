import { uniq } from "ramda";
import {
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  NotificationsByKind,
  SmsNotification,
  exhaustiveCheck,
} from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../config/pg/kysely/kyselyUtils";
import {
  EmailNotificationFilters,
  NotificationRepository,
} from "../ports/NotificationRepository";

export class PgNotificationRepository implements NotificationRepository {
  constructor(
    private transaction: KyselyDb,
    private maxRetrievedNotifications = 30,
  ) {}

  public async deleteAllEmailAttachements(): Promise<number> {
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

  public async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    switch (kind) {
      case "sms":
        return this.#getSmsNotificationById(id);
      case "email":
        return this.#getEmailNotificationById(id);
      default:
        exhaustiveCheck(kind, {
          variableName: "notificationKind",
          throwIfReached: true,
        });
    }
  }

  public async getEmailsByFilters({
    since,
    emailKind,
    email,
  }: EmailNotificationFilters = {}): Promise<EmailNotification[]> {
    const filterValues: string[] = [];
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
      WHERE e.created_at > NOW() - INTERVAL '2 day'
      ${
        filterConditions.length > 0
          ? `AND ${filterConditions.join(" AND ")}`
          : ""
      } 
      GROUP BY e.id
      ORDER BY created_at DESC
      LIMIT $${filterValues.length + 1}`;

    const query = `SELECT ${buildEmailNotificationObject} as notif
        FROM notifications_email e
        LEFT JOIN notifications_email_recipients r ON e.id = r.notifications_email_id
        LEFT JOIN notifications_email_attachments a ON e.id = a.notifications_email_id
        WHERE e.id IN (${subQueryToGetEmailsNotificationsIds})
        GROUP BY e.id
        ORDER BY created_at DESC`;

    const response = await executeKyselyRawSqlQuery(this.transaction, query, [
      ...filterValues,
      this.maxRetrievedNotifications,
    ]);

    return response.rows.map((row) => row.notif);
  }

  public async getLastNotifications(): Promise<NotificationsByKind> {
    const smsResponse = await executeKyselyRawSqlQuery<{
      notif: SmsNotification;
    }>(
      this.transaction,
      `
        SELECT ${buildSmsNotificationObject} as notif
        FROM notifications_sms
        WHERE notifications_sms.created_at > NOW() - INTERVAL '2 day'
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

  public async save(notification: Notification): Promise<void> {
    switch (notification.kind) {
      case "sms":
        return this.#saveSmsNotification(notification);
      case "email": {
        const recipients = uniq(notification.templatedContent.recipients);
        return this.#saveEmailNotification({
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

  public async saveBatch(notifications: Notification[]): Promise<void> {
    const { smsNotifications, emailNotifications } = notifications.reduce(
      (acc, notification) => {
        if (notification.kind === "sms")
          return {
            ...acc,
            smsNotifications: [...acc.smsNotifications, notification],
          };

        return {
          ...acc,
          emailNotifications: [...acc.emailNotifications, notification],
        };
      },
      {
        smsNotifications: [] as SmsNotification[],
        emailNotifications: [] as EmailNotification[],
      },
    );

    await this.#saveSmsNotifications(smsNotifications);
    await this.#saveEmailNotifications(emailNotifications);

    // switch (notification.kind) {
    //   case "sms":
    //     return this.#saveSmsNotification(notification);
    //   case "email": {
    //     const recipients = uniq(notification.templatedContent.recipients);
    //     return this.#saveEmailNotification({
    //       ...notification,
    //       templatedContent: {
    //         ...notification.templatedContent,
    //         recipients,
    //         cc: uniq(notification.templatedContent.cc ?? []).filter(
    //           (ccEmail) => !recipients.includes(ccEmail),
    //         ),
    //       },
    //     });
    //   }
    //   default:
    //     return exhaustiveCheck(notification, {
    //       variableName: "notificationKind",
    //       throwIfReached: true,
    //     });
    // }
  }

  async #getSmsNotificationById(id: NotificationId): Promise<SmsNotification> {
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

  async #saveEmailNotification(notification: EmailNotification) {
    await this.#saveEmailNotifications([notification]);
  }

  async #saveEmailNotifications(notifications: EmailNotification[]) {
    const notificationsWithDeduplicatedRecipients = notifications.map(
      (notification) => {
        const recipients = uniq(notification.templatedContent.recipients);
        return {
          ...notification,
          templatedContent: {
            ...notification.templatedContent,
            recipients,
            cc: uniq(notification.templatedContent.cc ?? []).filter(
              (ccEmail) => !recipients.includes(ccEmail),
            ),
          },
        };
      },
    );

    await this.#insertEmailNotifications(
      notificationsWithDeduplicatedRecipients,
    );
    await this.#insertEmailsRecipients(notificationsWithDeduplicatedRecipients);
    await this.#insertEmailAttachments(notificationsWithDeduplicatedRecipients);
  }

  async #saveSmsNotification(notification: SmsNotification): Promise<void> {
    await this.#saveSmsNotifications([notification]);
  }

  async #saveSmsNotifications(notifications: SmsNotification[]): Promise<void> {
    if (notifications.length === 0) return;

    await this.transaction
      .insertInto("notifications_sms")
      .values(
        notifications.map((notification) => ({
          id: notification.id,
          created_at: notification.createdAt,
          sms_kind: notification.templatedContent.kind,
          recipient_phone: notification.templatedContent.recipientPhone,
          convention_id: notification.followedIds.conventionId,
          establishment_siret: notification.followedIds.establishmentSiret,
          agency_id: notification.followedIds.agencyId,
          params: JSON.stringify(notification.templatedContent.params),
        })),
      )
      .execute();
  }

  async #insertEmailAttachments(notifications: EmailNotification[]) {
    const notificationsWithAttachments = notifications.filter(
      (notification) =>
        notification.templatedContent.attachments &&
        notification.templatedContent.attachments.length > 0,
    );
    if (!notificationsWithAttachments.length) return;

    await this.transaction
      .insertInto("notifications_email_attachments")
      .values(
        notificationsWithAttachments.flatMap((notification) =>
          (notification.templatedContent.attachments ?? []).map(
            (attachment) => ({
              notifications_email_id: notification.id,
              attachment: JSON.stringify(attachment),
            }),
          ),
        ),
      )
      .execute();
  }

  async #insertEmailsRecipients(notifications: EmailNotification[]) {
    await this.transaction
      .insertInto("notifications_email_recipients")
      .values(
        notifications.flatMap((notification) => [
          ...notification.templatedContent.recipients.map((recipient) => ({
            notifications_email_id: notification.id,
            email: recipient,
            recipient_type: "to" as const,
          })),
          ...(notification.templatedContent.cc ?? []).map((ccRecipient) => ({
            notifications_email_id: notification.id,
            email: ccRecipient,
            recipient_type: "cc" as const,
          })),
        ]),
      )
      .execute();
  }

  async #insertEmailNotifications(notifications: EmailNotification[]) {
    await this.transaction
      .insertInto("notifications_email")
      .values(
        notifications.map(
          ({ id, createdAt, followedIds, templatedContent }) => ({
            id: id,
            created_at: createdAt,
            email_kind: templatedContent.kind,
            convention_id: followedIds.conventionId,
            establishment_siret: followedIds.establishmentSiret,
            agency_id: followedIds.agencyId,
            params: JSON.stringify(templatedContent.params),
            reply_to_name: templatedContent.replyTo?.name,
            reply_to_email: templatedContent.replyTo?.email,
            sender_email: templatedContent.sender?.email,
            sender_name: templatedContent.sender?.name,
          }),
        ),
      )
      .execute();
  }

  async #getEmailNotificationById(
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
