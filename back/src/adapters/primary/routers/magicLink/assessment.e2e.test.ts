import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  type AssessmentDto,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  type ConnectedUserJwtPayload,
  ConventionDtoBuilder,
  type ConventionJwt,
  type ConventionMagicLinkRoutes,
  conventionMagicLinkRoutes,
  currentJwtVersions,
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
import type {
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
} from "../../../../domains/core/jwt";
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
  const backofficeAdminUser = new ConnectedUserBuilder()
    .withId("backoffice-admin")
    .withIsAdmin(true)
    .buildUser();
  const backofficeAdminJwtPayload: ConnectedUserJwtPayload = {
    version: currentJwtVersions.connectedUser,
    iat: Date.now(),
    exp: addDays(new Date(), 30).getTime(),
    userId: backofficeAdminUser.id,
  };
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
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let generateConventionJwt: GenerateConventionJwt;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    ({
      inMemoryUow,
      eventCrawler,
      gateways,
      generateConnectedUserJwt,
      generateConventionJwt,
    } = testAppAndDeps);

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
    inMemoryUow.userRepository.users = [validator, backofficeAdminUser];
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
        beneficiaryAgreement: null,
        beneficiaryFeedback: null,
        signedAt: null,
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
        beneficiaryAgreement: null,
        beneficiaryFeedback: null,
        signedAt: null,
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
        beneficiaryAgreement: null,
        beneficiaryFeedback: null,
        signedAt: null,
      };

      const response = await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: ["establishmentFeedback : Ce champ est obligatoire"],
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
        beneficiaryAgreement: null,
        beneficiaryFeedback: null,
        signedAt: null,
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
        beneficiaryAgreement: true,
        beneficiaryFeedback: "Mon commentaire",
        signedAt: new Date("2025-01-01").toISOString(),
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

      inMemoryUow.assessmentRepository.assessments = [
        {
          _entityName: "Assessment",
          ...legacyAssessment,
        } as AssessmentEntity, // force type to AssessmentEntity to simulate a legacy assessment in DB
      ];

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

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.deleteAssessment,
  )} to delete assessment`, () => {
    it("returns 204 when admin deletes existing assessment", async () => {
      const assessment: AssessmentDto = {
        conventionId: convention.id,
        status: "COMPLETED",
        establishmentFeedback: "Feedback",
        endedWithAJob: false,
        establishmentAdvices: "Conseil",
        beneficiaryAgreement: null,
        beneficiaryFeedback: null,
        signedAt: null,
      };
      await httpClient.createAssessment({
        body: assessment,
        headers: { authorization: jwt },
      });

      const response = await httpClient.deleteAssessment({
        body: {
          conventionId: convention.id,
          deleteAssessmentJustification: "Justification",
        },
        headers: {
          authorization: generateConnectedUserJwt(backofficeAdminJwtPayload),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 204,
        body: {},
      });
      expectArraysToMatch(inMemoryUow.assessmentRepository.assessments, []);
    });

    it("fails with 401 if jwt is not valid", async () => {
      const response = await httpClient.deleteAssessment({
        body: {
          conventionId: convention.id,
          deleteAssessmentJustification: "Justification",
        },
        headers: { authorization: "invalid-jwt" },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: { status: 401, message: invalidTokenMessage },
      });
    });

    it("fails with 403 if user is not admin", async () => {
      const response = await httpClient.deleteAssessment({
        body: {
          conventionId: convention.id,
          deleteAssessmentJustification: "Justification",
        },
        headers: {
          authorization: generateConnectedUserJwt({
            ...backofficeAdminJwtPayload,
            userId: validator.id,
          }),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: errors.user.forbidden({ userId: validator.id }).message,
        },
      });
    });

    it("fails with 404 when assessment does not exist", async () => {
      const response = await httpClient.deleteAssessment({
        body: {
          conventionId: convention.id,
          deleteAssessmentJustification: "Justification",
        },
        headers: {
          authorization: generateConnectedUserJwt(backofficeAdminJwtPayload),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.assessment.notFound(convention.id).message,
        },
      });
    });

    it("fails with 400 if request body is invalid", async () => {
      const response = await httpClient.deleteAssessment({
        body: {
          conventionId: convention.id,
          deleteAssessmentJustification: "",
        },
        headers: {
          authorization: generateConnectedUserJwt(backofficeAdminJwtPayload),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: expect.arrayContaining([
            expect.stringMatching(/deleteAssessmentJustification/),
          ]),
          message: expect.stringContaining("DELETE /auth/assessment"),
          status: 400,
        },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.signAssessment,
  )} to sign assessment`, () => {
    const conventionId = "a99eaca1-ee70-4c90-b3f4-668d492f7392";
    const testAgency = AgencyDtoBuilder.create().build();
    const testConvention = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withAgencyId(testAgency.id)
      .build();
    const testAssessment = new AssessmentDtoBuilder()
      .withConventionId(testConvention.id)
      .build();

    it("200 - beneficiary with valid JWT can sign assessment", async () => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(AgencyDtoBuilder.create(testAgency.id).build()),
      ];
      inMemoryUow.conventionRepository.setConventions([testConvention]);
      inMemoryUow.assessmentRepository.assessments = [
        {
          _entityName: "Assessment",
          ...testAssessment,
          numberOfHoursActuallyMade: 40,
        },
      ];

      const beneficiaryJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: testConvention.id,
          role: "beneficiary",
          email: testConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: testConvention.id,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
        },
        headers: { authorization: beneficiaryJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: "",
      });
    });

    it("403 - establishment-tutor cannot sign", async () => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(AgencyDtoBuilder.create(testAgency.id).build()),
      ];
      inMemoryUow.conventionRepository.setConventions([testConvention]);
      inMemoryUow.assessmentRepository.assessments = [
        {
          _entityName: "Assessment",
          ...testAssessment,
          numberOfHoursActuallyMade: 40,
        },
      ];

      const establishmentTutorJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: testConvention.id,
          role: "establishment-tutor",
          email: testConvention.establishmentTutor.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: testConvention.id,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
        },
        headers: { authorization: establishmentTutorJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: errors.assessment.signForbidden().message,
        },
      });
    });

    it("403 - cannot sign legacy assessment", async () => {
      const legacyAssessment = {
        _entityName: "Assessment" as const,
        conventionId: testConvention.id,
        status: "FINISHED" as const,
        establishmentFeedback: "Legacy feedback",
        numberOfHoursActuallyMade: null as number | null,
      };

      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(AgencyDtoBuilder.create(testAgency.id).build()),
      ];
      inMemoryUow.conventionRepository.setConventions([testConvention]);
      inMemoryUow.assessmentRepository.assessments = [
        legacyAssessment as AssessmentEntity,
      ];

      const beneficiaryJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: testConvention.id,
          role: "beneficiary",
          email: testConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: testConvention.id,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "",
        },
        headers: { authorization: beneficiaryJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message:
            errors.assessment.signNotAvailableForLegacyAssessment().message,
        },
      });
    });

    it("404 - convention not found", async () => {
      const nonExistentConventionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const beneficiaryJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: nonExistentConventionId,
          role: "beneficiary",
          email: testConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: nonExistentConventionId,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
        },
        headers: { authorization: beneficiaryJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.convention.notFound({
            conventionId: nonExistentConventionId,
          }).message,
        },
      });
    });

    it("404 - assessment not found", async () => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(AgencyDtoBuilder.create(testAgency.id).build()),
      ];
      inMemoryUow.conventionRepository.setConventions([testConvention]);

      const beneficiaryJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: testConvention.id,
          role: "beneficiary",
          email: testConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: testConvention.id,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
        },
        headers: { authorization: beneficiaryJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.assessment.notFound(testConvention.id).message,
        },
      });
    });

    it("409 - assessment already signed", async () => {
      const signedAssessment = new AssessmentDtoBuilder()
        .withConventionId(testConvention.id)
        .withBeneficiarySignature({
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
          signedAt: "2024-01-01T00:00:00Z",
        })
        .build();

      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(AgencyDtoBuilder.create(testAgency.id).build()),
      ];
      inMemoryUow.conventionRepository.setConventions([testConvention]);
      inMemoryUow.assessmentRepository.assessments = [
        {
          _entityName: "Assessment",
          ...signedAssessment,
          numberOfHoursActuallyMade: 40,
        },
      ];

      const beneficiaryJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: testConvention.id,
          role: "beneficiary",
          email: testConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await httpClient.signAssessment({
        body: {
          conventionId: testConvention.id,
          beneficiaryAgreement: true,
          beneficiaryFeedback: "my feedback",
        },
        headers: { authorization: beneficiaryJwt },
      });

      expectHttpResponseToEqual(response, {
        status: 409,
        body: {
          status: 409,
          message: errors.assessment.alreadySigned(testConvention.id).message,
        },
      });
    });
  });
});
