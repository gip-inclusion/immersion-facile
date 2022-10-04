import {
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  ImmersionAssessmentDto,
  immersionAssessmentRoute,
} from "shared";
import { buildTestApp } from "../../_testBuilders/buildTestApp";

const conventionId = "my-Convention-id";

describe("Immersion assessment routes", () => {
  describe(`POST /auth/${immersionAssessmentRoute}/:jwt`, () => {
    it("returns 200 if the jwt is valid", async () => {
      const { request, generateMagicLinkJwt, inMemoryUow } =
        await buildTestApp();

      const jwt = generateMagicLinkJwt(
        createConventionMagicLinkPayload(
          conventionId,
          "establishment2",
          "establishment@company.fr",
        ),
      );

      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      const assessment: ImmersionAssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${immersionAssessmentRoute}`)
        .set("Authorization", jwt)
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
        .post(`/auth/${immersionAssessmentRoute}`)
        .set("Authorization", "invalid-jwt")
        .send(assessment);

      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });
  });
});
