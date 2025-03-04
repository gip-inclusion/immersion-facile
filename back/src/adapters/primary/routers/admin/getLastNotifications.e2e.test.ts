import { addDays } from "date-fns";
import {
  AdminRoutes,
  ConnectedUserJwt,
  EmailNotification,
  InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  SmsNotification,
  adminRoutes,
  currentJwtVersions,
  displayRouteName,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("Get last notification route", () => {
  let adminToken: ConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<AdminRoutes>;

  beforeEach(async () => {
    const testApp = await buildTestApp();
    ({ inMemoryUow } = testApp);

    const backofficeAdminUser = new InclusionConnectedUserBuilder()
      .withId("backoffice-admin-user")
      .withIsAdmin(true)
      .buildUser();

    const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
      version: currentJwtVersions.inclusion,
      iat: new Date().getTime(),
      exp: addDays(new Date(), 30).getTime(),
      userId: backofficeAdminUser.id,
    };

    inMemoryUow.userRepository.users = [backofficeAdminUser];

    adminToken = testApp.generateInclusionConnectJwt(backofficeAdminJwtPayload);
    httpClient = createSupertestSharedClient(adminRoutes, testApp.request);
  });

  describe(`${displayRouteName(
    adminRoutes.getLastNotifications,
  )} private route to get last email sent`, () => {
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
