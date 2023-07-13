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

const agencyId = "aaaaaaaa-aaaa-4000-aaaa-aaaaaaaaaaaa";
const emailNotifications: EmailNotification[] = [
  {
    kind: "email",
    id: "11111111-1111-4000-1111-111111111111",
    createdAt: new Date("2023-06-09T19:00").toISOString(),
    followedIds: { agencyId },
    templatedContent: {
      replyTo: { email: "yolo@mail.com", name: "Yolo" },
      kind: "AGENCY_WAS_ACTIVATED",
      recipients: ["bob@mail.com"],
      cc: [],
      params: {
        agencyName: "My agency",
        agencyLogoUrl: "http://logo.com",
      },
      attachments: [
        {
          name: "myFile.pdf",
          content: "myFile content as base64",
        },
      ],
    },
  },
  {
    kind: "email",
    id: "22222222-2222-4000-2222-222222222222",
    createdAt: new Date("2023-06-09T15:00").toISOString(),
    followedIds: { agencyId },
    templatedContent: {
      kind: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: ["lulu@mail.com"],
      cc: ["bob@mail.com"],
      params: {
        editFrontUrl: "http://edit-link.com",
        businessAddress: "24 rue des boucher 67000 strasbourg",
        businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
      },
      attachments: [
        {
          url: "http://my-file.com",
        },
      ],
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
      cc: ["yala@jo.com"],
      params: {
        conventionId: "",
        agencyMagicLinkUrl: "",
        beneficiaryFirstName: "Bob",
        beneficiaryLastName: "L'éponge",
        businessName: "Essuie-tout",
      },
      attachments: [],
    },
  },
];

const emailNotificationsReOrderedByDate = [
  emailNotifications[2],
  emailNotifications[0],
  emailNotifications[1],
];

const maxRetrievedNotifications = 2;

describe("PgNotificationRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgNotificationRepository = new PgNotificationRepository(
      client,
      maxRetrievedNotifications,
    );
    await client.query("DELETE FROM notifications_sms");
    await client.query("DELETE FROM notifications_email_recipients");
    await client.query("DELETE FROM notifications_email_attachments");
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
      sender: {
        email: "recette@immersion-facile.beta.gouv.fr",
        name: "Recette Immersion Facile",
      },
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
      sender: {
        email: "recette@immersion-facile.beta.gouv.fr",
        name: "Recette Immersion Facile",
      },
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
      sender: {
        email: "recette@immersion-facile.beta.gouv.fr",
        name: "Recette Immersion Facile",
      },
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

  describe("getEmailsByFilters", () => {
    beforeEach(async () => {
      await Promise.all(
        emailNotifications.map((notif) => pgNotificationRepository.save(notif)),
      );
    });

    it("works with no filters provided", async () => {
      const response = await pgNotificationRepository.getEmailsByFilters({});
      expectToEqual(
        response,
        emailNotificationsReOrderedByDate.slice(0, maxRetrievedNotifications),
      );
    });

    it("works with 'emailKind' filter", async () => {
      const response = await pgNotificationRepository.getEmailsByFilters({
        emailKind: "EDIT_FORM_ESTABLISHMENT_LINK",
      });
      expectToEqual(response, [emailNotifications[1]]);
    });

    it("works with 'since' filter", async () => {
      const responseForMostRecent =
        await pgNotificationRepository.getEmailsByFilters({
          since: new Date(emailNotifications[2].createdAt),
        });
      expectToEqual(responseForMostRecent, [emailNotifications[2]]);

      const responseForOldest =
        await pgNotificationRepository.getEmailsByFilters({
          since: new Date(emailNotifications[1].createdAt),
        });
      expectToEqual(
        responseForOldest,
        emailNotificationsReOrderedByDate.slice(0, maxRetrievedNotifications),
      );
    });

    it("works with 'email' filter, and keeps all recipients", async () => {
      const response = await pgNotificationRepository.getEmailsByFilters({
        email: emailNotifications[2].templatedContent.recipients[0],
      });
      expectToEqual(response, [emailNotifications[2]]);
    });
  });

  describe("getLatestNotifications", () => {
    it("gets the last notifications of each kind, up to the provided maximum", async () => {
      const smsNotifications: SmsNotification[] = [
        {
          kind: "sms",
          id: "77777777-7777-4000-7777-777777777777",
          createdAt: new Date("2023-06-10T20:00").toISOString(),
          templatedContent: {
            kind: "FirstReminderForSignatories",
            recipientPhone: "33610101010",
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

      const notifications =
        await pgNotificationRepository.getLastNotifications();
      expectToEqual(notifications, {
        emails: emailNotificationsReOrderedByDate.slice(
          0,
          maxRetrievedNotifications,
        ),
        sms: smsNotifications,
      });
    });
  });
});

const createTemplatedEmailAndNotification = ({
  recipients,
  cc,
  sender,
}: {
  recipients: string[];
  cc?: string[];
  sender: {
    email: string;
    name: string;
  };
}) => {
  const email: TemplatedEmail = {
    kind: "AGENCY_WAS_ACTIVATED",
    recipients,
    sender,
    cc,
    params: { agencyName: "My agency", agencyLogoUrl: "https://my-logo.com" },
    attachments: [],
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
