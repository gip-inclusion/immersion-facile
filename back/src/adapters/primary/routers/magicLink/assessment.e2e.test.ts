import {
  AgencyDtoBuilder,
  type AssessmentDto,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  type ConventionJwt,
  type ConventionMagicLinkRoutes,
  conventionMagicLinkRoutes,
  displayRouteName,
  errors,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  type LegacyAssessmentDto,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import type { AssessmentEntity } from "../../../../domains/convention/entities/AssessmentEntity";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";
import { createConventionMagicLinkPayload } from "../../../../utils/jwt";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("Assessment routes", () => {
  const validator = new ConnectedUserBuilder()
    .withEmail("validator@mail.com")
    .withId("validator")
    .buildUser();
  const agency = new AgencyDtoBuilder().build();
  const convention = new ConventionDtoBuilder()
    .withAgencyId(agency.id)
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .build();

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
        id: convention.id,
        role: "establishment-tutor",
        email: convention.establishmentTutor.email,
        now: new Date(),
      }),
    );
    httpClient = createSupertestSharedClient(
      conventionMagicLinkRoutes,
      testAppAndDeps.request,
    );

    inMemoryUow.conventionRepository.setConventions([convention]);
    inMemoryUow.agencyRepository.insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
    inMemoryUow.userRepository.users = [validator];
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.createAssessment,
  )} to add assessment`, () => {
    it("returns 201 if the jwt is valid", async () => {
      inMemoryUow.conventionRepository.setConventions([convention]);

      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        establishmentFeedback: "The guy left after one day",
        endedWithAJob: false,
        establishmentAdvices: "mon conseil",
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

      expectArraysToMatch(gateways.notification.getSentEmails(), [
        {
          kind: "ASSESSMENT_CREATED_ESTABLISHMENT_NOTIFICATION",
          recipients: [
            convention.signatories.establishmentRepresentative.email,
          ],
        },
        {
          kind: "ASSESSMENT_CREATED_BENEFICIARY_NOTIFICATION",
          recipients: [convention.signatories.beneficiary.email],
        },
        {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          recipients: [validator.email],
        },
      ]);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        establishmentFeedback: "The guy left after one day",
        endedWithAJob: false,
        establishmentAdvices: "mon conseil",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: "invalid-jwt" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: invalidTokenMessage },
      });
    });

    it("fails with 400 if some data is not valid", async () => {
      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        establishmentFeedback: "",
        endedWithAJob: false,
        establishmentAdvices: "mon conseil",
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
      const anotherConvention = new ConventionDtoBuilder()
        .withId("another-convention-id")
        .withAgencyId(agency.id)
        .build();

      inMemoryUow.conventionRepository.setConventions([anotherConvention]);

      const assessment: AssessmentDto = {
        conventionId: anotherConvention.id,
        status: "COMPLETED",
        establishmentFeedback: "mon feedback",
        endedWithAJob: false,
        establishmentAdvices: "mon conseil",
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: errors.assessment.conventionIdMismatch().message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.getAssessmentByConventionId,
  )} to get assessment`, () => {
    it("returns 200 if the jwt is valid and assessment is assessmentDto", async () => {
      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        establishmentFeedback: "The guy left after one day",
        endedWithAJob: false,
        establishmentAdvices: "mon conseil",
      };

      await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      const response = await httpClient.getAssessmentByConventionId({
        headers: { authorization: jwt },
        urlParams: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: assessment,
      });
    });

    it("returns 200 if the jwt is valid and assessment is legacyAssessmentDto", async () => {
      const legacyAssessment: LegacyAssessmentDto = {
        conventionId: convention.id,
        status: "FINISHED",
        establishmentFeedback: "The guy left after one day",
      };

      await inMemoryUow.conventionRepository.setConventions([convention]);

      await inMemoryUow.assessmentRepository.setAssessments([
        {
          _entityName: "Assessment",
          ...legacyAssessment,
        } as AssessmentEntity, // force type to AssessmentEntity to simulate a legacy assessment in DB
      ]);

      const response = await httpClient.getAssessmentByConventionId({
        headers: { authorization: jwt },
        urlParams: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: legacyAssessment,
      });
    });
  });
});
