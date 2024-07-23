import {
  AgencyDtoBuilder,
  AssessmentDto,
  ConventionDtoBuilder,
  ConventionJwt,
  ConventionMagicLinkRoutes,
  conventionMagicLinkRoutes,
  createConventionMagicLinkPayload,
  displayRouteName,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

const conventionId = "my-Convention-id";

describe("Assessment routes", () => {
  let httpClient: HttpClient<ConventionMagicLinkRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let gateways: InMemoryGateways;
  let jwt: ConventionJwt;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    ({ inMemoryUow, eventCrawler, gateways } = testAppAndDeps);

    jwt = testAppAndDeps.generateConventionJwt(
      createConventionMagicLinkPayload({
        id: conventionId,
        role: "establishment-tutor",
        email: "establishment@company.fr",
        now: new Date(),
      }),
    );
    httpClient = createSupertestSharedClient(
      conventionMagicLinkRoutes,
      testAppAndDeps.request,
    );
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.createAssessment,
  )} to add assessment`, () => {
    it("returns 201 if the jwt is valid", async () => {
      const agency = new AgencyDtoBuilder().build();

      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withAgencyId(agency.id)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();

      inMemoryUow.conventionRepository.setConventions([convention]);

      const assessment: AssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });

      await processEventsForEmailToBeSent(eventCrawler);

      expect(gateways.notification.getSentEmails()).toMatchObject([
        {
          kind: "NEW_ASSESSMENT_CREATED_AGENCY_NOTIFICATION",
          recipients: [agency.validatorEmails[0]],
        },
      ]);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const assessment: AssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "The guy left after one day",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: "invalid-jwt" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: "Provided token is invalid" },
      });
    });

    it("fails with 400 if some data is not valid", async () => {
      const assessment: AssessmentDto = {
        conventionId,
        status: "ABANDONED",
        establishmentFeedback: "",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: ["establishmentFeedback : Obligatoire"],
          message:
            "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /auth/assessment",
          status: 400,
        },
      });
    });

    it("fails with 403 if convention id does not matches the one in token", async () => {
      const assessment: AssessmentDto = {
        conventionId: "another-convention-id",
        status: "ABANDONED",
        establishmentFeedback: "mon feedback",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message:
            "Convention provided in DTO is not the same as application linked to it",
        },
      });
    });
  });
});
