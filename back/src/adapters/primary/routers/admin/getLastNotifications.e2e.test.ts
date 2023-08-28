import { SuperTest, Test } from "supertest";
import {
  adminRoutes,
  BackOfficeJwt,
  EmailNotification,
  SmsNotification,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe(`${adminRoutes.getLastNotifications.url} route`, () => {
  let request: SuperTest<Test>;
  let adminToken: BackOfficeJwt;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    const testDeps = await buildTestApp();
    ({ request, inMemoryUow } = testDeps);
    const { generateBackOfficeJwt } = testDeps;

    const iat = new Date().getTime() / 1000;
    adminToken = generateBackOfficeJwt({
      role: "backOffice",
      sub: "admin",
      iat,
      exp: iat + 1000,
      version: 1,
    });
  });

  describe("private route to get last email sent", () => {
    it("Returns Forbidden if no token provided", async () => {
      const response = await request.get(adminRoutes.getLastNotifications.url);

      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Returns last notifications", async () => {
      // Prepare
      const dateNow = new Date("2022-01-01T12:00:00.000Z");
      const emailNotification: EmailNotification = {
        id: "email-notification-id",
        followedIds: { agencyId: "my-agency-id" },
        createdAt: dateNow.toISOString(),
        kind: "email",
        templatedContent: {
          kind: "AGENCY_WAS_ACTIVATED",
          recipients: ["toto@email.com"],
          params: {
            agencyName: "Agence du Grand Est",
            agencyLogoUrl: "http://:)",
          },
        },
      };

      const smsNotification: SmsNotification = {
        id: "email-notification-id",
        followedIds: { agencyId: "my-agency-id" },
        createdAt: dateNow.toISOString(),
        kind: "sms",
        templatedContent: {
          kind: "FirstReminderForSignatories",
          params: {
            shortLink: "https://my-short-link.com",
          },
          recipientPhone: "0600000077",
        },
      };

      inMemoryUow.notificationRepository.notifications = [
        emailNotification,
        smsNotification,
      ];

      // Getting the application succeeds and shows that it's validated.
      const response = await request
        .get(adminRoutes.getLastNotifications.url)
        .set("Authorization", adminToken);

      expect(response.body).toEqual({
        emails: [emailNotification],
        sms: [smsNotification],
      });
      expect(response.status).toBe(200);
    });
  });
});
