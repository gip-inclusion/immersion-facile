import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentRoute } from "shared/src/routes";
import { createMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";

const conventionId = "my-convention-id";

describe("Immersion assessment routes", () => {
  describe(`POST /auth/${immersionAssessmentRoute}/:jwt`, () => {
    it("returns 200 if the jwt is valid", async () => {
      const { request, generateMagicLinkJwt, reposAndGateways } =
        await buildTestApp();

      const jwt = generateMagicLinkJwt(
        createMagicLinkPayload(
          conventionId,
          "establishment",
          "establishment@company.fr",
        ),
      );

      const convention = new ImmersionApplicationEntityBuilder()
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      reposAndGateways.immersionApplication.setImmersionApplications({
        [convention.id]: convention,
      });

      const assessment: ImmersionAssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${immersionAssessmentRoute}/${jwt}`)
        .send(assessment);

      expect(response.body).toEqual({ success: true });
      expect(response.status).toBe(200);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const { request } = await buildTestApp();
      const assessment: ImmersionAssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${immersionAssessmentRoute}/invalid-jwt`)
        .send(assessment);

      expect(response.body).toEqual({ message: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });
  });
});
