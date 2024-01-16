import {
  AdminRoutes,
  adminRoutes,
  BackOfficeJwt,
  EmailNotification,
  expectHttpResponseToEqual,
  SmsNotification,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe(`${adminRoutes.getLastNotifications.url} route`, () => {
  let adminToken: BackOfficeJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<AdminRoutes>;

  beforeEach(async () => {
    const testApp = await buildTestApp();
    ({ inMemoryUow } = testApp);
    const iat = new Date().getTime() / 1000;
    adminToken = testApp.generateBackOfficeJwt({
      role: "backOffice",
      sub: "admin",
      iat,
      exp: iat + 1000,
      version: 1,
    });
    httpClient = createSupertestSharedClient(adminRoutes, testApp.request);
  });

  describe("private route to get last email sent", () => {
    it("throws 400 if missing token", async () => {
      const response = await httpClient.getLastNotifications({
        headers: {} as { authorization: string },
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: GET /admin/notifications",
          status: 400,
        },
        status: 400,
      });
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
      const response = await httpClient.getLastNotifications({
        headers: { authorization: adminToken },
      });

      expectHttpResponseToEqual(response, {
        body: {
          emails: [emailNotification],
          sms: [smsNotification],
        },
        status: 200,
      });
    });
  });
});
