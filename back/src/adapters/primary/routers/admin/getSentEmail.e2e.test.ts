import { BackOfficeJwt, emailRoute, EmailSentDto } from "shared";
import { SuperTest, Test } from "supertest";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { AppConfig } from "../../config/appConfig";
import { CustomTimeGateway } from "../../../secondary/core/TimeGateway/CustomTimeGateway";

describe(`/${emailRoute} route`, () => {
  let request: SuperTest<Test>;
  let gateways: InMemoryGateways;
  let adminToken: BackOfficeJwt;
  let appConfig: AppConfig;
  let timeGateway: CustomTimeGateway;

  beforeEach(async () => {
    ({ request, gateways, appConfig } = await buildTestApp());
    timeGateway = gateways.timeGateway;

    timeGateway.setNextDate(new Date());

    const response = await request.post("/admin/login").send({
      user: appConfig.backofficeUsername,
      password: appConfig.backofficePassword,
    });
    adminToken = response.body;
  });

  describe("private route to get last email sent", () => {
    it("Returns Forbidden if no token provided", async () => {
      const response = await request.get(`/admin/${emailRoute}`);

      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Returns last sent emails", async () => {
      // Prepare
      const dateNow = new Date("2022-01-01T12:00:00.000Z");
      timeGateway.now = () => dateNow;
      await gateways.email.sendEmail({
        type: "AGENCY_WAS_ACTIVATED",
        recipients: ["toto@email.com"],
        params: {
          agencyName: "Agence du Grand Est",
          agencyLogoUrl: "http://:)",
        },
      });

      // Getting the application succeeds and shows that it's validated.
      const expectedDto: EmailSentDto = {
        templatedEmail: {
          type: "AGENCY_WAS_ACTIVATED",
          recipients: ["toto@email.com"],
          params: {
            agencyName: "Agence du Grand Est",
            agencyLogoUrl: "http://:)",
          },
        },
        sentAt: dateNow.toISOString(),
      };
      await request
        .get(`/admin/${emailRoute}`)
        .set("Authorization", adminToken)
        .expect(200, [expectedDto]);
    });
  });
});
