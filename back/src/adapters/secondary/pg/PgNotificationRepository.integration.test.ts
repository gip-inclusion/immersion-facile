import { Pool, PoolClient } from "pg";
import { TemplatedEmail, TemplatedSms } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { Notification } from "../../../domain/generic/notifications/entities/Notification";
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
    pgNotificationRepository = new PgNotificationRepository(client);
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
    const email: TemplatedEmail = {
      type: "AGENCY_WAS_ACTIVATED",
      cc: ["copy@mail.com"],
      recipients: ["bob@mail.com", "jane@mail.com"],
      params: { agencyName: "My agency", agencyLogoUrl: "https://my-logo.com" },
    };
    const id = "22222222-2222-4444-2222-222222222222";
    const emailNotification: Notification = {
      id,
      kind: "email",
      createdAt: new Date("2023-01-01").toISOString(),
      followedIds: { agencyId: "cccccccc-1111-4111-1111-cccccccccccc" },
      templatedContent: email,
    };

    await pgNotificationRepository.save(emailNotification);

    const response = await pgNotificationRepository.getByIdAndKind(id, "email");
    expect(response).toEqual(emailNotification);
  });

  it("save and eliminates duplicates when they exit", async () => {
    const email: TemplatedEmail = {
      type: "AGENCY_WAS_ACTIVATED",
      recipients: ["bob@mail.com", "jane@mail.com", "bob@mail.com"],
      cc: ["copy@mail.com", "jane@mail.com"],
      params: { agencyName: "My agency", agencyLogoUrl: "https://my-logo.com" },
    };
    const id = "22222222-2222-4444-2222-222222222222";
    const emailNotification: Notification = {
      id,
      kind: "email",
      createdAt: new Date("2023-01-01").toISOString(),
      followedIds: { agencyId: "cccccccc-1111-4111-1111-cccccccccccc" },
      templatedContent: email,
    };

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
});
