import { subDays, subHours } from "date-fns";
import type { Pool } from "pg";
import {
  type ConventionId,
  type EmailAttachment,
  type EmailNotification,
  expectArraysToEqual,
  expectToEqual,
  type Notification,
  type NotificationErrored,
  type NotificationState,
  type SmsNotification,
  type TemplatedEmail,
  type TemplatedSms,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { PgNotificationRepository } from "./PgNotificationRepository";

const agencyId = "aaaaaaaa-aaaa-4000-aaaa-aaaaaaaaaaaa";
const now = new Date();
const emailNotifications: EmailNotification[] = [
  {
    kind: "email",
    id: "11111111-1111-4000-1111-111111111111",
    createdAt: subHours(now, 2).toISOString(),
    followedIds: { agencyId },
    templatedContent: {
      replyTo: { email: "yolo@mail.com", name: "Yolo" },
      kind: "AGENCY_WAS_ACTIVATED",
      recipients: ["bob@mail.com"],
      cc: [],
      params: {
        agencyName: "My agency",
        agencyLogoUrl: "http://logo.com",
        refersToOtherAgency: false,
        agencyReferdToName: undefined,
        users: [
          {
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean-dupont@gmail.com",
            agencyName: "Agence du Grand Est",
            isNotifiedByEmail: true,
            roles: ["validator"],
          },

          {
            firstName: "Jeanne",
            lastName: "Dupont",
            email: "jeanne-dupont@gmail.com",
            agencyName: "Agence du Grand Est",
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
        ],
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
    createdAt: subHours(now, 3).toISOString(),
    followedIds: { agencyId },
    templatedContent: {
      kind: "TEST_EMAIL",
      recipients: ["lulu@mail.com"],
      cc: ["bob@mail.com"],
      params: {
        url: "https://google.com",
        input1: "test input 1",
        input2: "test input 2",
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
    createdAt: now.toISOString(),
    followedIds: { agencyId },
    templatedContent: {
      kind: "AGENCY_LAST_REMINDER",
      recipients: ["yo@remind.com"],
      cc: ["yala@jo.com"],
      params: {
        agencyReferentName: "Agency Referent Name",
        conventionId: "",
        agencyMagicLinkUrl: "",
        beneficiaryFirstName: "Bob",
        beneficiaryLastName: "L'éponge",
        businessName: "Essuie-tout",
      },
      attachments: undefined,
    },
  },
];

const sms: TemplatedSms = {
  kind: "ReminderForSignatories",
  recipientPhone: "33610101010",
  params: { shortLink: "https://short.link" },
};
const smsNotificationId = "11111111-1111-4111-1111-111111111111";
const smsNotification: Notification = {
  id: smsNotificationId,
  kind: "sms",
  createdAt: new Date("2023-01-01").toISOString(),
  followedIds: { conventionId: "cccccccc-1111-4111-1111-cccccccccccc" },
  templatedContent: sms,
};

const emailNotificationsReOrderedByDate = [
  emailNotifications[2],
  emailNotifications[0],
  emailNotifications[1],
];

const maxRetrievedNotifications = 2;

const withToBeSendState: { state: NotificationState } = {
  state: {
    status: "to-be-send",
    occurredAt: expect.any(String),
  },
};

const addWithToBeSentState = <T extends Notification>(notification: T): T => ({
  ...notification,
  ...withToBeSendState,
});

describe("PgNotificationRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgNotificationRepository: PgNotificationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    pgNotificationRepository = new PgNotificationRepository(
      db,
      maxRetrievedNotifications,
    );

    await db.deleteFrom("notifications_sms").executeTakeFirst();
    await db.deleteFrom("notifications_email_recipients").executeTakeFirst();
    await db.deleteFrom("notifications_email_attachments").executeTakeFirst();
    await db.deleteFrom("notifications_email").executeTakeFirst();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("save", () => {
    it("saves Sms notification in a dedicated table, then gets it", async () => {
      await pgNotificationRepository.save(smsNotification);

      const response = await pgNotificationRepository.getByIdAndKind(
        smsNotificationId,
        "sms",
      );
      expectToEqual(response, { ...smsNotification, ...withToBeSendState });
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

      const response = await pgNotificationRepository.getByIdAndKind(
        id,
        "email",
      );
      expectToEqual(response, { ...emailNotification, ...withToBeSendState });
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

      const response = await pgNotificationRepository.getByIdAndKind(
        id,
        "email",
      );
      expectToEqual(response, {
        ...emailNotification,
        templatedContent: {
          ...emailNotification.templatedContent,
          recipients: ["bob@mail.com", "jane@mail.com"],
          cc: ["copy@mail.com"],
        },
        ...withToBeSendState,
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

      const response = await pgNotificationRepository.getByIdAndKind(
        id,
        "email",
      );
      expectToEqual(response, {
        ...emailNotification,
        templatedContent: {
          ...emailNotification.templatedContent,
          recipients: ["bob@mail.com"],
          cc: [],
        },
        ...withToBeSendState,
      });
    });
  });

  describe("saveBatch", () => {
    it("saves a batch of notifications email and sms", async () => {
      await pgNotificationRepository.saveBatch([
        ...emailNotifications,
        smsNotification,
      ]);

      const response = await pgNotificationRepository.getEmailsByFilters({});

      expectToEqual(
        response,
        emailNotificationsReOrderedByDate
          .slice(0, maxRetrievedNotifications)
          .map(addWithToBeSentState),
      );

      const smsResponse = await pgNotificationRepository.getByIdAndKind(
        smsNotificationId,
        "sms",
      );
      expectToEqual(smsResponse, { ...smsNotification, ...withToBeSendState });
    });

    it("saves a batch of notifications sms only", async () => {
      await pgNotificationRepository.saveBatch([smsNotification]);

      const response = await pgNotificationRepository.getEmailsByFilters({});
      expectArraysToEqual(response, []);

      const smsResponse = await pgNotificationRepository.getByIdAndKind(
        smsNotificationId,
        "sms",
      );
      expectToEqual(smsResponse, { ...smsNotification, ...withToBeSendState });
    });
  });

  describe("markErrored", () => {
    it("should mark the notification as errored, and drop it when null is passed", async () => {
      const notification = emailNotifications[0];

      await pgNotificationRepository.save(notification);

      const notificationState: NotificationErrored = {
        status: "errored",
        httpStatus: 400,
        message: "error",
        occurredAt: new Date().toISOString(),
      };

      await pgNotificationRepository.updateState({
        notificationId: notification.id,
        notificationKind: notification.kind,
        state: notificationState,
      });

      expectToEqual(
        await pgNotificationRepository.getByIdAndKind(notification.id, "email"),
        { ...notification, state: notificationState },
      );

      await pgNotificationRepository.updateState({
        notificationId: notification.id,
        notificationKind: notification.kind,
        state: undefined,
      });

      expectToEqual(
        await pgNotificationRepository.getByIdAndKind(notification.id, "email"),
        { ...notification, state: undefined },
      );
    });
  });

  describe("getEmailsByFilters", () => {
    beforeEach(async () => {
      await Promise.all(
        emailNotifications.map((notif) => pgNotificationRepository.save(notif)),
      );
    });

    it("without filters returns all emails", async () => {
      const response = await pgNotificationRepository.getEmailsByFilters({});
      expectToEqual(
        response,
        emailNotificationsReOrderedByDate
          .slice(0, maxRetrievedNotifications)
          .map(addWithToBeSentState),
      );
    });

    describe("with filters", () => {
      it("returns matching email when email + emailType filters match", async () => {
        const emailNotification = emailNotifications[0];
        const response = await pgNotificationRepository.getEmailsByFilters({
          email: emailNotification.templatedContent.recipients[0],
          emailType: emailNotification.templatedContent.kind,
        });
        expectToEqual(response, [
          { ...emailNotification, ...withToBeSendState },
        ]);
      });

      it("returns matching email when conventionIds match", async () => {
        const conventionId1 = "cccccccc-1111-4111-1111-cccccccccccc";
        const conventionId2 = "cccccccc-1111-4111-1111-dddddddddddd";
        const emailNotification1: EmailNotification = {
          createdAt: new Date().toISOString(),
          followedIds: { conventionId: conventionId1 },
          id: "11111111-1111-4444-1111-111111111111",
          kind: "email",
          templatedContent: {
            kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
            recipients: ["bob@mail.com"],
            sender: {
              email: "fake-email@email.com",
              name: "Fake name",
            },
            cc: [],
            params: {
              beneficiaryFirstName: "Bob",
              beneficiaryLastName: "L'éponge",
              beneficiaryEmail: "bob@mail.com",
              conventionId: "cccccccc-1111-4111-1111-cccccccccccc",
              beneficiaryPhone: "0606060606",
              previousAgencyName: "Agence du Grand Est",
              internshipKind: "immersion",
              justification: "Justification",
              magicLink: "https://magic-link.com",
            },
          },
        };
        const emailNotification2: EmailNotification = {
          createdAt: new Date().toISOString(),
          followedIds: { conventionId: conventionId2 },
          id: "11111111-1111-4444-1111-111111111122",
          kind: "email",
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
            recipients: ["bob@mail.com"],
            sender: {
              email: "fake-email@email.com",
              name: "Fake name",
            },
            cc: [],
            params: {
              assessmentCreationLink: "",
              beneficiaryFirstName: "Bob",
              beneficiaryLastName: "L'éponge",
              establishmentTutorFirstName: "",
              establishmentTutorLastName: "",
              conventionId: "cccccccc-1111-4111-1111-cccccccccccc",
              internshipKind: "immersion",
            },
          },
        };
        await pgNotificationRepository.save(emailNotification1);
        await pgNotificationRepository.save(emailNotification2);

        const response = await pgNotificationRepository.getEmailsByFilters({
          conventionIds: [conventionId1, conventionId2],
        });

        expectToEqual(response, [
          {
            ...emailNotification1,
            ...withToBeSendState,
          },
          {
            ...emailNotification2,
            ...withToBeSendState,
          },
        ]);
      });

      it("returns empty array when no conventionIds match", async () => {
        const conventionId = "cccccccc-1111-4111-1111-cccccccccccc";

        const response = await pgNotificationRepository.getEmailsByFilters({
          conventionIds: [conventionId],
        });

        expectToEqual(response, []);
      });

      it("returns all emails when conventionIds is empty array and there is no other filters", async () => {
        const response = await pgNotificationRepository.getEmailsByFilters({
          conventionIds: [],
        });

        expectToEqual(
          response,
          emailNotificationsReOrderedByDate
            .slice(0, maxRetrievedNotifications)
            .map(addWithToBeSentState),
        );
      });

      it("returns matching email when email + emailType + conventionIds match", async () => {
        const emailNotification: EmailNotification = {
          createdAt: new Date().toISOString(),
          followedIds: { conventionId: "cccccccc-1111-4111-1111-cccccccccccc" },
          id: "11111111-1111-4444-1111-111111111111",
          kind: "email",
          templatedContent: {
            kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
            recipients: ["bob@mail.com"],
            sender: {
              email: "fake-email@email.com",
              name: "Fake name",
            },
            cc: [],
            params: {
              beneficiaryFirstName: "Bob",
              beneficiaryLastName: "L'éponge",
              beneficiaryEmail: "bob@mail.com",
              conventionId: "cccccccc-1111-4111-1111-cccccccccccc",
              beneficiaryPhone: "0606060606",
              previousAgencyName: "Agence du Grand Est",
              internshipKind: "immersion",
              justification: "Justification",
              magicLink: "https://magic-link.com",
            },
          },
        };
        await pgNotificationRepository.save(emailNotification);

        const response = await pgNotificationRepository.getEmailsByFilters({
          email: emailNotification.templatedContent.recipients[0],
          emailType: emailNotification.templatedContent.kind,
          conventionIds: emailNotification.followedIds.conventionId
            ? [emailNotification.followedIds.conventionId]
            : undefined,
        });

        expectToEqual(response, [
          { ...emailNotification, ...withToBeSendState },
        ]);
      });

      it("returns matching email when email + emailType + aroundCreatedAt match", async () => {
        const today = new Date();
        const oldEmailNotification: EmailNotification = {
          createdAt: subDays(today, 15).toISOString(),
          followedIds: { conventionId: "cccccccc-1111-4111-1111-cccccccccccc" },
          id: "11111111-1111-4444-1111-111111111111",
          kind: "email",
          templatedContent: {
            kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
            recipients: ["bob@mail.com"],
            sender: {
              email: "fake-email@email.com",
              name: "Fake name",
            },
            cc: [],
            params: {
              beneficiaryFirstName: "Bob",
              beneficiaryLastName: "L'éponge",
              beneficiaryEmail: "bob@mail.com",
              conventionId: "cccccccc-1111-4111-1111-cccccccccccc",
              beneficiaryPhone: "0606060606",
              previousAgencyName: "Agence du Grand Est",
              internshipKind: "immersion",
              justification: "Justification",
              magicLink: "https://magic-link.com",
            },
          },
        };
        const emailNotification: EmailNotification = {
          createdAt: today.toISOString(),
          followedIds: { conventionId: "cccccccc-1111-4111-1111-cccccccccccd" },
          id: "11111111-1111-4444-1111-111111111112",
          kind: "email",
          templatedContent: {
            kind: "CONVENTION_TRANSFERRED_AGENCY_NOTIFICATION",
            recipients: ["bob@mail.com"],
            sender: {
              email: "fake-email@email.com",
              name: "Fake name",
            },
            cc: [],
            params: {
              beneficiaryFirstName: "Bob",
              beneficiaryLastName: "L'éponge",
              beneficiaryEmail: "bob@mail.com",
              conventionId: "cccccccc-1111-4111-1111-cccccccccccc",
              beneficiaryPhone: "0606060606",
              previousAgencyName: "Agence du Grand Est",
              internshipKind: "immersion",
              justification: "Justification",
              magicLink: "https://magic-link.com",
            },
          },
        };
        await pgNotificationRepository.saveBatch([
          oldEmailNotification,
          emailNotification,
        ]);

        const response = await pgNotificationRepository.getEmailsByFilters({
          email: emailNotification.templatedContent.recipients[0],
          emailType: emailNotification.templatedContent.kind,
          createdAt: today,
        });

        expectToEqual(response, [
          { ...emailNotification, ...withToBeSendState },
        ]);
      });

      it("returns empty array when no match found", async () => {
        const response = await pgNotificationRepository.getEmailsByFilters({
          email: "fake-email@email.com",
          emailType: emailNotifications[0].templatedContent.kind,
        });
        expectToEqual(response, []);
      });
    });
  });

  describe("getEmailsByIds", () => {
    it("returns [] when no ids are provided", async () => {
      const response = await pgNotificationRepository.getEmailsByIds([]);
      expectToEqual(response, []);
    });

    it("returns the emails notifications with the provided ids", async () => {
      await Promise.all(
        emailNotifications.map((notif) => pgNotificationRepository.save(notif)),
      );
      const response = await pgNotificationRepository.getEmailsByIds([
        emailNotifications[0].id,
        emailNotifications[1].id,
      ]);
      expectToEqual(response, [
        { ...emailNotifications[0], ...withToBeSendState },
        { ...emailNotifications[1], ...withToBeSendState },
      ]);
    });
  });

  describe("getSmsByIds", () => {
    it("returns [] when no ids are provided", async () => {
      const response = await pgNotificationRepository.getSmsByIds([]);
      expectToEqual(response, []);
    });

    it("returns the sms notifications with the provided ids", async () => {
      await pgNotificationRepository.save(smsNotification);
      const response = await pgNotificationRepository.getSmsByIds([
        smsNotification.id,
      ]);
      expectToEqual(response, [{ ...smsNotification, ...withToBeSendState }]);
    });
  });

  describe("getLatestNotifications", () => {
    it("gets the last notifications of each kind, up to the provided maximum", async () => {
      const smsNotifications: SmsNotification[] = [
        {
          kind: "sms",
          id: "77777777-7777-4000-7777-777777777777",
          createdAt: subHours(new Date(), 4).toISOString(),
          templatedContent: {
            kind: "ReminderForSignatories",
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
        emails: emailNotificationsReOrderedByDate
          .slice(0, maxRetrievedNotifications)
          .map(addWithToBeSentState),
        sms: smsNotifications.map(addWithToBeSentState),
      });
    });
  });

  describe("deleteAllAttachements", () => {
    it("remove all the attachment content, but keeps the metadata (attachement exited, name of file)", async () => {
      const { emailNotification } = createTemplatedEmailAndNotification({
        recipients: ["bob@mail.com"],
        sender: {
          email: "recette@immersion-facile.beta.gouv.fr",
          name: "Recette Immersion Facile",
        },
        cc: [],
        attachments: [
          { name: "myFile.pdf", content: "myFile content as base64" },
        ],
      });

      await pgNotificationRepository.save(emailNotification);

      const { emailNotification: emailNotificationWithUrlAttachment } =
        createTemplatedEmailAndNotification({
          id: "33333333-3333-4444-3333-333333333333",
          recipients: ["bob@mail.com"],
          sender: {
            email: "recette@immersion-facile.beta.gouv.fr",
            name: "Recette Immersion Facile",
          },
          cc: [],
          attachments: [{ url: "www.truc.com" }],
        });

      await pgNotificationRepository.save(emailNotificationWithUrlAttachment);

      const numberOfUpdatedRows =
        await pgNotificationRepository.deleteAllEmailAttachements();

      expect(numberOfUpdatedRows).toBe(1);

      expectToEqual(await pgNotificationRepository.getLastNotifications(), {
        sms: [],
        emails: [
          emailNotificationWithUrlAttachment,
          {
            ...emailNotification,
            templatedContent: {
              ...emailNotification.templatedContent,
              attachments: [
                {
                  // biome-ignore lint/style/noNonNullAssertion: testing purpose
                  ...emailNotification.templatedContent.attachments![0],
                  content: "deleted-content",
                },
              ],
            },
          },
        ].map(addWithToBeSentState),
      });
    });
  });

  describe("getLastSmsNotificationByFilter", () => {
    const smsKind = "ReminderForSignatories";
    const recipientPhone = "+33610101010";
    const conventionId: ConventionId = "88888888-4444-4000-4444-111111111111";

    it("get the latest sms for a phoneNumber, given conventionId and smsKind", async () => {
      const lastSmsNotification: SmsNotification = {
        kind: "sms",
        id: "77777777-7777-4000-7777-777777777777",
        createdAt: subHours(new Date(), 4).toISOString(),
        templatedContent: {
          kind: smsKind,
          recipientPhone,
          params: { shortLink: "https://short.com" },
        },
        followedIds: {
          conventionId: conventionId,
        },
      };
      const olderSmsNotification: SmsNotification = {
        kind: "sms",
        id: "77777777-7777-4000-7777-777777778888",
        createdAt: subDays(new Date(), 5).toISOString(),
        templatedContent: {
          kind: smsKind,
          recipientPhone,
          params: { shortLink: "https://short.com" },
        },
        followedIds: {
          conventionId: conventionId,
        },
      };

      await pgNotificationRepository.saveBatch([
        lastSmsNotification,
        olderSmsNotification,
      ]);

      expectToEqual(
        await pgNotificationRepository.getLastSmsNotificationByFilter({
          conventionId,
          smsKind,
          recipientPhoneNumber: recipientPhone,
        }),
        { ...lastSmsNotification, ...withToBeSendState },
      );
    });

    it("Return undefined if no sms notification found", async () => {
      const lastNotification =
        await pgNotificationRepository.getLastSmsNotificationByFilter({
          conventionId,
          smsKind,
          recipientPhoneNumber: recipientPhone,
        });

      expect(lastNotification).toBeUndefined();
    });
  });
});

const createTemplatedEmailAndNotification = ({
  recipients,
  cc,
  sender,
  attachments,
  id,
}: {
  recipients: string[];
  cc?: string[];
  sender: {
    email: string;
    name: string;
  };
  attachments?: EmailAttachment[];
  id?: string;
}) => {
  const email: TemplatedEmail = {
    kind: "AGENCY_WAS_REJECTED",
    recipients,
    sender,
    cc,
    params: {
      agencyName: "My agency",
      rejectionJustification: "Justification",
    },
    ...(attachments ? { attachments } : {}),
  };

  const emailNotification: Notification = {
    id: id ?? "22222222-2222-4444-2222-222222222222",
    kind: "email",
    createdAt: subHours(new Date(), 1).toISOString(),
    followedIds: { agencyId: "cccccccc-1111-4111-1111-cccccccccccc" },
    templatedContent: email,
  };

  return {
    id: emailNotification.id,
    emailNotification,
  };
};
