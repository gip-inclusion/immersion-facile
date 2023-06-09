import { Pool, PoolClient } from "pg";
import {
  EmailNotification,
  expectToEqual,
  SmsNotification,
  TemplatedEmail,
  TemplatedSms,
} from "shared";
import { Notification } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgNotificationRepository } from "./PgNotificationRepository";

describe("PgNotificationRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgNotificationRepository = new PgNotificationRepository(client, 2);
    await client.query("DELETE FROM notifications_sms");
    await client.query("DELETE FROM notifications_email_recipients");
    await client.query("DELETE FROM notifications_email");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("saves Sms notification in a dedicated table, then gets it", async () => {
    const sms: TemplatedSms = {
      kind: "FirstReminderForSignatories",
      recipientPhone: "33610101010",
      params: { shortLink: "https://short.link" },
    };
    const id = "11111111-1111-4111-1111-111111111111";
    const smsNotification: Notification = {
      id,
      kind: "sms",
      createdAt: new Date("2023-01-01").toISOString(),
      followedIds: { conventionId: "cccccccc-1111-4111-1111-cccccccccccc" },
      templatedContent: sms,
    };

    await pgNotificationRepository.save(smsNotification);

    const response = await pgNotificationRepository.getByIdAndKind(id, "sms");
    expect(response).toEqual(smsNotification);
  });

  it("saves Email notification in a dedicated table, then gets it", async () => {
    const { id, emailNotification } = createTemplatedEmailAndNotification({
      recipients: ["bob@mail.com", "jane@mail.com"],
      cc: ["copy@mail.com"],
    });

    await pgNotificationRepository.save(emailNotification);

    const response = await pgNotificationRepository.getByIdAndKind(id, "email");
    expect(response).toEqual(emailNotification);
  });

  it("save and eliminates duplicates when they exit", async () => {
    const recipients = ["bob@mail.com", "jane@mail.com", "bob@mail.com"];
    const cc = ["copy@mail.com", "jane@mail.com"];
    const { id, emailNotification } = createTemplatedEmailAndNotification({
      recipients,
      cc,
    });

    await pgNotificationRepository.save(emailNotification);

    const response = await pgNotificationRepository.getByIdAndKind(id, "email");
    expect(response).toEqual({
      ...emailNotification,
      templatedContent: {
        ...emailNotification.templatedContent,
        recipients: ["bob@mail.com", "jane@mail.com"],
        cc: ["copy@mail.com"],
      },
    });
  });

  it("save and eliminates duplicates when cc ends up empty after de-duplication", async () => {
    const { id, emailNotification } = createTemplatedEmailAndNotification({
      recipients: ["bob@mail.com"],
      cc: ["bob@mail.com"],
    });

    await pgNotificationRepository.save(emailNotification);

    const response = await pgNotificationRepository.getByIdAndKind(id, "email");
    expect(response).toEqual({
      ...emailNotification,
      templatedContent: {
        ...emailNotification.templatedContent,
        recipients: ["bob@mail.com"],
        cc: [],
      },
    });
  });

  it("gets the last notifications of each kind, up to the provided maximum", async () => {
    const agencyId = "aaaaaaaa-aaaa-4000-aaaa-aaaaaaaaaaaa";
    const emailNotifications: EmailNotification[] = [
      {
        kind: "email",
        id: "11111111-1111-4000-1111-111111111111",
        createdAt: new Date("2023-06-09T19:00").toISOString(),
        followedIds: { agencyId },
        templatedContent: {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: ["bob@mail.com"],
          cc: [],
          params: { agencyName: "My agency", agencyLogoUrl: "http://logo.com" },
        },
      },
      {
        kind: "email",
        id: "22222222-2222-4000-2222-222222222222",
        createdAt: new Date("2023-06-09T15:00").toISOString(),
        followedIds: { agencyId },
        templatedContent: {
          kind: "EDIT_FORM_ESTABLISHMENT_LINK",
          recipients: ["bob@mail.com"],
          cc: [],
          params: { editFrontUrl: "http://edit-link.com" },
        },
      },
      {
        kind: "email",
        id: "33333333-3333-4000-3333-333333333333",
        createdAt: new Date("2023-06-09T21:00").toISOString(),
        followedIds: { agencyId },
        templatedContent: {
          kind: "AGENCY_LAST_REMINDER",
          recipients: ["yo@remind.com"],
          cc: [],
          params: {
            agencyMagicLinkUrl: "",
            beneficiaryFirstName: "Bob",
            beneficiaryLastName: "L'éponge",
            businessName: "Essuie-tout",
          },
        },
      },
    ];

    const smsNotifications: SmsNotification[] = [
      {
        kind: "sms",
        id: "77777777-7777-4000-7777-777777777777",
        createdAt: new Date("2023-06-10T20:00").toISOString(),
        templatedContent: {
          kind: "FirstReminderForSignatories",
          recipientPhone: "0610101010",
          params: { shortLink: "https://short.com" },
        },
        followedIds: {},
      },
    ];

    await Promise.all(
      [...emailNotifications, ...smsNotifications].map((notif) =>
        pgNotificationRepository.save(notif),
      ),
    );

    const notifications = await pgNotificationRepository.getLastNotifications();
    expectToEqual(notifications, {
      emails: [emailNotifications[2], emailNotifications[0]],
      sms: smsNotifications,
    });
  });
});

const createTemplatedEmailAndNotification = ({
  recipients,
  cc,
}: {
  recipients: string[];
  cc?: string[];
}) => {
  const email: TemplatedEmail = {
    kind: "AGENCY_WAS_ACTIVATED",
    recipients,
    cc,
    params: { agencyName: "My agency", agencyLogoUrl: "https://my-logo.com" },
  };
  const emailNotification: Notification = {
    id: "22222222-2222-4444-2222-222222222222",
    kind: "email",
    createdAt: new Date("2023-01-01").toISOString(),
    followedIds: { agencyId: "cccccccc-1111-4111-1111-cccccccccccc" },
    templatedContent: email,
  };

  return {
    id: emailNotification.id,
    emailNotification,
  };
};
