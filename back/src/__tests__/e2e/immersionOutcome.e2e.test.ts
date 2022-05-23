import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { immersionOutcomeRoute } from "shared/src/routes";
import { createMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";

describe("Immersion outcome routes", () => {
  describe(`POST /auth/${immersionOutcomeRoute}/:jwt`, () => {
    it("returns 200 if the jwt is valid", async () => {
      const { request, generateMagicLinkJwt, reposAndGateways } =
        await buildTestApp();
      const applicationId = "my-convention-id";
      const jwt = generateMagicLinkJwt(
        createMagicLinkPayload(
          applicationId,
          "establishment",
          "establishment@company.fr",
        ),
      );

      const convention = new ImmersionApplicationEntityBuilder()
        .withId(applicationId)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      reposAndGateways.immersionApplication.setImmersionApplications({
        [convention.id]: convention,
      });

      const immersionOutcome: ImmersionOutcomeDto = {
        id: "my-immersion-outcome-id",
        conventionId: applicationId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${immersionOutcomeRoute}/${jwt}`)
        .send(immersionOutcome);

      expect(response.body).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const { request } = await buildTestApp();
      const applicationId = "my-convention-id";
      const immersionOutcome: ImmersionOutcomeDto = {
        id: "my-immersion-outcome-id",
        conventionId: applicationId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${immersionOutcomeRoute}/invalid-jwt`)
        .send(immersionOutcome);

      expect(response.body).toEqual({ message: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });
  });
});
