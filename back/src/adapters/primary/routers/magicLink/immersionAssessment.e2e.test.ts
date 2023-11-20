import {
  AgencyDtoBuilder,
  AssessmentDto,
  assessmentRoute,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";

const conventionId = "my-Convention-id";

describe("Immersion assessment routes", () => {
  describe(`POST /auth/${assessmentRoute}`, () => {
    it("returns 200 if the jwt is valid", async () => {
      const {
        request,
        generateConventionJwt,
        inMemoryUow,
        eventCrawler,
        gateways,
      } = await buildTestApp();

      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionId,
          role: "establishment-tutor",
          email: "establishment@company.fr",
          now: new Date(),
        }),
      );

      const agency = new AgencyDtoBuilder().build();

      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      const assessment: AssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${assessmentRoute}`)
        .set("Authorization", jwt)
        .send(assessment);

      expect(response.status).toBe(200);
      await processEventsForEmailToBeSent(eventCrawler);

      expect(gateways.notification.getSentEmails()).toMatchObject([
        {
          kind: "NEW_ASSESSMENT_CREATED_AGENCY_NOTIFICATION",
          recipients: [agency.validatorEmails[0]],
        },
      ]);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const { request } = await buildTestApp();
      const assessment: AssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await request
        .post(`/auth/${assessmentRoute}`)
        .set("Authorization", "invalid-jwt")
        .send(assessment);

      expect(response.body).toEqual({ error: "Provided token is invalid" });
      expect(response.status).toBe(401);
    });
  });
});
