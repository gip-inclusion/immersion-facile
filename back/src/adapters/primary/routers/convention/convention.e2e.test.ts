import { addDays } from "date-fns";
import {
  type AddConventionInput,
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  type ConnectedUserJwtPayload,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionMagicLinkRoutes,
  type ConventionRole,
  conventionMagicLinkRoutes,
  currentJwtVersions,
  defaultProConnectInfos,
  displayRouteName,
  errors,
  expectArraysToEqual,
  expectEmailOfType,
  expectHttpResponseToEqual,
  expectToEqual,
  expiredMagicLinkErrorMessage,
  type TechnicalRoutes,
  technicalRoutes,
  type UnauthenticatedConventionRoutes,
  type User,
  unauthenticatedConventionRoutes,
  type WithAuthorizationHeader,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { match } from "ts-pattern";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import type {
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
} from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import {
  createConventionMagicLinkPayload,
  makeEmailHash,
} from "../../../../utils/jwt";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("convention e2e", () => {
  const peAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();

  const validator: User = {
    id: "my-user-id",
    email: "my-user@email.com",
    firstName: "John",
    lastName: "Doe",
    proConnect: defaultProConnectInfos,
    createdAt: new Date().toISOString(),
  };
  const convention = new ConventionDtoBuilder()
    .withAgencyId(peAgency.id)
    .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
    .build();

  const unknownId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";

  const backofficeAdminUser = new ConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true)
    .buildUser();

  const backofficeAdminJwtPayload: ConnectedUserJwtPayload = {
    version: currentJwtVersions.connectedUser,
    iat: Date.now(),
    exp: addDays(new Date(), 30).getTime(),
    userId: backofficeAdminUser.id,
  };

  let unauthenticatedRequest: HttpClient<UnauthenticatedConventionRoutes>;
  let magicLinkRequest: HttpClient<ConventionMagicLinkRoutes>;
  let technicalRoutesClient: HttpClient<TechnicalRoutes>;
  let generateConventionJwt: GenerateConventionJwt;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    const testApp = await buildTestApp(new AppConfigBuilder().build());
    const request = testApp.request;

    ({
      eventCrawler,
      gateways,
      generateConventionJwt,
      generateConnectedUserJwt,
      inMemoryUow,
    } = testApp);

    unauthenticatedRequest = createSupertestSharedClient(
      unauthenticatedConventionRoutes,
      request,
    );

    magicLinkRequest = createSupertestSharedClient(
      conventionMagicLinkRoutes,
      request,
    );

    technicalRoutesClient = createSupertestSharedClient(
      technicalRoutes,
      request,
    );

    gateways.timeGateway.defaultDate = new Date();
  });

  describe(`${displayRouteName(
    unauthenticatedConventionRoutes.createConvention,
  )} add a new convention`, () => {
    it("200 - Create convention without auth", async () => {
      expectToEqual(inMemoryUow.conventionRepository.conventions, []);

      const response = await unauthenticatedRequest.createConvention({
        body: { convention },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: { id: convention.id },
      });

      expectToEqual(inMemoryUow.conventionRepository.conventions, [convention]);
    });

    it("400 - Invalid body", async () => {
      const response = await unauthenticatedRequest.createConvention({
        body: {
          invalid_params: true,
        } as unknown as AddConventionInput,
      });

      expectHttpResponseToEqual(response, {
        body: {
          message:
            "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /demandes-immersion",
          status: 400,
          issues: [
            "convention : Invalid input: expected object, received undefined",
          ],
        },
        status: 400,
      });
    });

    it("409 - Conflict", async () => {
      inMemoryUow.conventionRepository.setConventions([convention]);

      const response = await unauthenticatedRequest.createConvention({
        body: { convention },
      });

      expectHttpResponseToEqual(response, {
        status: 409,
        body: {
          status: 409,
          message: errors.convention.conflict({
            conventionId: convention.id,
          }).message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    unauthenticatedConventionRoutes.shareConvention,
  )} shares a conventions with a short link`, () => {
    describe("200 - Share convention without auth", () => {
      it("should successfully ask for a short link", async () => {
        const shortLinkId = "shortLink1";
        gateways.shortLinkGenerator.addMoreShortLinkIds([shortLinkId]);
        const veryLongConventionLink =
          "http://localhost:3000/demande-immersion?email=&firstName=&lastName=&phone=&financiaryHelp=&emergencyContact=&emergencyContactPhone=&isRqth=false&birthdate=&agencyDepartment=&siret=&businessName=&businessAdvantages=&etFirstName=&etLastName=&etJob=&etPhone=&etEmail=&erFirstName=&erLastName=&erPhone=&erEmail=&immersionAddress=&immersionActivities=&immersionSkills=&sanitaryPreventionDescription=&workConditions=&dateStart=2023-08-05&dateEnd=2023-08-06&schedule=%7B%22totalHours%22%3A0%2C%22workedDays%22%3A0%2C%22isSimple%22%3Atrue%2C%22selectedIndex%22%3A0%2C%22complexSchedule%22%3A%5B%7B%22date%22%3A%222023-08-05T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%5D%7D%2C%7B%22date%22%3A%222023-08-06T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%5D%7D%5D%7D";
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);

        const response = await unauthenticatedRequest.shareConvention({
          body: {
            conventionLink: veryLongConventionLink,
            details: "Le message du mail",
            email: "any@email.fr",
            internshipKind: "immersion",
          },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: "",
        });

        await processEventsForEmailToBeSent(eventCrawler);

        const sentEmails = gateways.notification.getSentEmails();
        expectToEqual(sentEmails.length, 1);
        const conventionShortLinkEmail = expectEmailOfType(
          sentEmails[0],
          "SHARE_DRAFT_CONVENTION_BY_LINK",
        );

        const sharedConventionLink =
          await shortLinkRedirectToLinkWithValidation(
            conventionShortLinkEmail.params.conventionFormUrl,
            technicalRoutesClient,
          );

        expectToEqual(veryLongConventionLink, sharedConventionLink);
      });
    });

    describe("400 - Invalid body", () => {
      it("should return error message when missing mandatory fields", async () => {
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);
        const response = await unauthenticatedRequest.shareConvention({
          body: {
            details: "any@email.fr",
            email: "any@email.fr",
            internshipKind: "immersion",
            conventionLink: "",
          },
        });

        expectHttpResponseToEqual(response, {
          status: 400,
          body: {
            status: 400,
            message:
              "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /share-immersion-demand",
            issues: ["conventionLink : Ce champ est obligatoire"],
          },
        });
      });
    });
  });

  describe(`${displayRouteName(
    unauthenticatedConventionRoutes.findSimilarConventions,
  )} finds similar conventions`, () => {
    it("find no conventions ids when none have similar data", async () => {
      const response = await unauthenticatedRequest.findSimilarConventions({
        queryParams: {
          dateStart: "2021-01-06",
          siret: "11112222333311",
          codeAppellation: "017751",
          beneficiaryBirthdate: "2002-10-05",
          beneficiaryLastName: "Martin",
        },
      });
      expectHttpResponseToEqual(response, {
        status: 200,
        body: { similarConventionIds: [] },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.getConvention,
  )} gets a convention from a magic link`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
    });

    it.each([
      "ConventionJwt",
      "BackOfficeJwt",
      "ConnectedUserJwt",
    ] as const)("200 - succeeds with JWT %s", async (scenario) => {
      inMemoryUow.userRepository.users = [validator, backofficeAdminUser];
      inMemoryUow.assessmentRepository.assessments = [
        {
          conventionId: convention.id,
          status: "COMPLETED",
          endedWithAJob: false,
          establishmentFeedback: "Ca c'est bien passé",
          establishmentAdvices: "mon conseil",
          numberOfHoursActuallyMade: 35,
          _entityName: "Assessment",
        },
      ];

      const jwt = match(scenario)
        .with("ConventionJwt", () =>
          generateConventionJwt({
            applicationId: convention.id,
            role: "beneficiary",
            emailHash: makeEmailHash(convention.signatories.beneficiary.email),
            iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            exp:
              Math.round(gateways.timeGateway.now().getTime() / 1000) +
              31 * 24 * 3600,
            version: currentJwtVersions.convention,
          }),
        )
        .with("BackOfficeJwt", () =>
          generateConnectedUserJwt(backofficeAdminJwtPayload),
        )
        .with("ConnectedUserJwt", () =>
          generateConnectedUserJwt({
            userId: validator.id,
            version: currentJwtVersions.connectedUser,
            iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
          }),
        )
        .exhaustive();

      const response = await magicLinkRequest.getConvention({
        headers: { authorization: jwt },
        urlParams: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          ...convention,
          agencyName: peAgency.name,
          agencyDepartment: peAgency.address.departmentCode,
          agencyContactEmail: peAgency.agencyContactEmail,
          agencyKind: peAgency.kind,
          agencySiret: peAgency.agencySiret,
          agencyCounsellorEmails: peAgency.counsellorEmails,
          agencyValidatorEmails: [validator.email],
          assessment: {
            status: "COMPLETED",
            endedWithAJob: false,
          },
        },
      });
    });

    it("400 - no JWT", async () => {
      const response = await magicLinkRequest.getConvention({
        urlParams: {
          conventionId: convention.id,
        },
        headers: undefined as unknown as WithAuthorizationHeader,
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: [
            "authorization : Invalid input: expected string, received undefined",
          ],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: GET /auth/demandes-immersion/:conventionId",
          status: 400,
        },
        status: 400,
      });
    });

    it("403 - JWT Expired", async () => {
      const response = await magicLinkRequest.getConvention({
        urlParams: {
          conventionId: convention.id,
        },
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "beneficiary",
              email: convention.signatories.beneficiary.email,
              durationDays: 1,
              now: gateways.timeGateway.now(),
              exp:
                Math.round(gateways.timeGateway.now().getTime() / 1000) -
                2 * 24 * 3600,
            }),
          ),
        },
      });

      // GETting the created convention 403's and sets needsNewMagicLink flag to inform the front end to go to the link renewal page.
      expectHttpResponseToEqual(response, {
        body: {
          message: expiredMagicLinkErrorMessage,
          needsNewMagicLink: true,
        },
        status: 403,
      });
    });

    it("404 - Fetching unknown convention id", async () => {
      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: unknownId,
          role: "beneficiary",
          email: "some email",
          now: gateways.timeGateway.now(),
        }),
      );
      const response = await magicLinkRequest.getConvention({
        headers: { authorization: jwt },
        urlParams: {
          conventionId: unknownId,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.convention.notFound({ conventionId: unknownId })
            .message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.updateConvention,
  )} updates convention`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions([convention]);
    });

    it("200 - Success with JWT ConventionJwt", async () => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(
          AgencyDtoBuilder.create(convention.agencyId)
            .withName("TEST-name")
            .withSignature("TEST-signature")
            .build(),
        ),
      ];
      const updatedConvention: ConventionDto = new ConventionDtoBuilder(
        convention,
      )
        .withBeneficiaryEmail("new@email.fr")
        .withStatus("READY_TO_SIGN")
        .withStatusJustification("justif")
        .build();

      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: convention.id,
          role: "beneficiary",
          email: convention.signatories.beneficiary.email,
          now: gateways.timeGateway.now(),
        }),
      );

      const response = await magicLinkRequest.updateConvention({
        headers: { authorization: jwt },
        urlParams: { conventionId: convention.id },
        body: {
          convention: updatedConvention,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: { id: convention.id },
      });
    });

    it("404 - Updating an unknown convention id", async () => {
      const conventionWithUnknownId = new ConventionDtoBuilder()
        .withId(unknownId)
        .withStatus("READY_TO_SIGN")
        .build();

      const response = await magicLinkRequest.updateConvention({
        body: {
          convention: conventionWithUnknownId,
        },
        urlParams: { conventionId: unknownId },
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: unknownId,
              role: "beneficiary",
              email: "some email",
              now: gateways.timeGateway.now(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.convention.notFound({
            conventionId: unknownId,
          }).message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.updateConventionStatus,
  )} updates the status of a convention`, () => {
    const externalId = "00000000001";

    beforeEach(() => {
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
      const inReviewConvention = new ConventionDtoBuilder(convention)
        .withStatus("IN_REVIEW")
        .build();
      inMemoryUow.conventionRepository.setConventions([inReviewConvention]);
      inMemoryUow.conventionExternalIdRepository.externalIdsByConventionId = {
        [inReviewConvention.id]: externalId,
      };
      inMemoryUow.userRepository.users = [validator, backofficeAdminUser];
    });

    it.each([
      "ConventionJwt",
      "BackOfficeJwt",
      "ConnectedUserJwt",
    ] as const)("200 - Succeeds with JWT %s", async (scenario) => {
      const jwt = match(scenario)
        .with("ConventionJwt", () =>
          generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "counsellor",
              email: "counsellor@pe.fr",
              now: gateways.timeGateway.now(),
            }),
          ),
        )
        .with("BackOfficeJwt", () =>
          generateConnectedUserJwt({
            userId: validator.id,
            version: currentJwtVersions.connectedUser,
            iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            exp: Math.round(gateways.timeGateway.now().getTime() / 1000) + 3600,
          }),
        )
        .with("ConnectedUserJwt", () =>
          generateConnectedUserJwt({
            userId: validator.id,
            version: currentJwtVersions.connectedUser,
            iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
          }),
        )
        .exhaustive();

      const response = await magicLinkRequest.updateConventionStatus({
        headers: { authorization: jwt },
        body: {
          status: "REJECTED",
          statusJustification: "test-justification",
          conventionId: convention.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: { id: convention.id },
      });

      await eventCrawler.processNewEvents();

      expectToEqual(
        gateways.franceTravailGateway.legacyBroadcastConventionCalls,
        [
          {
            activitesObservees: convention.immersionActivities,
            adresseImmersion: convention.immersionAddress,
            codeAppellation: "017751",
            codeRome: convention.immersionAppellation.romeCode,
            competencesObservees:
              "Utilisation des pneus optimale, gestion de carburant",
            dateDebut: convention.dateStart,
            dateDemande: convention.dateSubmission,
            dateFin: convention.dateEnd,
            dateNaissance: new Date(
              convention.signatories.beneficiary.birthdate,
            ).toISOString(),
            descriptionPreventionSanitaire: "fourniture de gel",
            dureeImmersion: 70,
            email: "beneficiary@email.fr",
            emailTuteur: "establishment@example.com",
            id: externalId,
            nom: "Ocon",
            nomPrenomFonctionTuteur: "Alain Prost Big Boss",
            objectifDeImmersion: 2,
            originalId: "a99eaca1-ee70-4c90-b3f4-668d492f7392",
            peConnectId: "some-id",
            prenom: "Esteban",
            preventionSanitaire: true,
            protectionIndividuelle: true,
            raisonSociale: "Beta.gouv.fr",
            signatureBeneficiaire: true,
            signatureEntreprise: true,
            siret: "12345678901234",
            statut: "REJETÉ",
            telephone: "+33123456780",
            telephoneTuteur: "+33601010101",
            typeAgence: "france-travail",
            nomAgence: peAgency.name,
            prenomValidateurRenseigne:
              convention.validators?.agencyValidator?.firstname,
            nomValidateurRenseigne:
              convention.validators?.agencyValidator?.lastname,
            rqth: "N",
            prenomTuteur: convention.establishmentTutor.firstName,
            nomTuteur: convention.establishmentTutor.lastName,
            fonctionTuteur: convention.establishmentTutor.job,
          },
        ],
      );
    });

    it("when a convention is ACCEPTED_BY_VALIDATOR, an Establishment Lead is created", async () => {
      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: convention.id,
          role: "validator",
          email: "validator@pe.fr",
          now: gateways.timeGateway.now(),
        }),
      );

      gateways.shortLinkGenerator.addMoreShortLinkIds([
        "short-link-1",
        "short-link-2",
        "short-link-3",
      ]);

      await magicLinkRequest.updateConventionStatus({
        headers: { authorization: jwt },
        body: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: convention.id,
          firstname: "John",
          lastname: "Doe",
        },
      });

      await eventCrawler.processNewEvents();

      expectArraysToEqual(
        inMemoryUow.establishmentLeadRepository.establishmentLeads,
        [
          {
            siret: convention.siret,
            lastEventKind: "to-be-reminded",
            events: [
              {
                conventionId: convention.id,
                kind: "to-be-reminded",
                occurredAt: gateways.timeGateway.now(),
              },
            ],
          },
        ],
      );
    });

    it("400 - no JWT", async () => {
      const response = await magicLinkRequest.updateConventionStatus({
        body: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: convention.id,
          firstname: "John",
          lastname: "Doe",
        },
        headers: undefined as unknown as WithAuthorizationHeader,
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: [
            "authorization : Invalid input: expected string, received undefined",
          ],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /auth/update-application-status",
          status: 400,
        },
        status: 400,
      });
    });

    it("403 - unauthorized role for expected status update", async () => {
      const response = await magicLinkRequest.updateConventionStatus({
        body: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: convention.id,
          firstname: "John",
          lastname: "Doe",
        },
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "establishment-representative",
              email: convention.signatories.establishmentRepresentative.email,
              now: gateways.timeGateway.now(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: errors.convention.badRoleStatusChange({
            roles: ["establishment-representative"],
            status: "ACCEPTED_BY_VALIDATOR",
            conventionId: convention.id,
          }).message,
        },
      });
    });

    it("404 - unknown convention id", async () => {
      const response = await magicLinkRequest.updateConventionStatus({
        body: {
          status: "ACCEPTED_BY_COUNSELLOR",
          conventionId: unknownId,
          firstname: "John",
          lastname: "Doe",
        },
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: unknownId,
              role: "counsellor",
              email: "counsellor@pe.fr",
              now: gateways.timeGateway.now(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.convention.notFound({
            conventionId: unknownId,
          }).message,
        },
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.sendAssessmentLink,
  )} sends assessment link`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
      inMemoryUow.userRepository.users = [validator, backofficeAdminUser];
    });

    it("200 - Successfully sends assessment link", async () => {
      const conventionWithValidStatus = new ConventionDtoBuilder(convention)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
      inMemoryUow.conventionRepository.setConventions([
        conventionWithValidStatus,
      ]);

      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionWithValidStatus.id,
          role: "beneficiary",
          email: conventionWithValidStatus.signatories.beneficiary.email,
          now: gateways.timeGateway.now(),
        }),
      );

      gateways.shortLinkGenerator.addMoreShortLinkIds(["shortLink1"]);

      const response = await magicLinkRequest.sendAssessmentLink({
        headers: { authorization: jwt },
        body: { conventionId: conventionWithValidStatus.id },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: "",
      });

      await processEventsForEmailToBeSent(eventCrawler);

      const sentSms = gateways.notification.getSentSms();
      expectToEqual(sentSms.length, 1);
    });

    it("400 - Cannot send assessment link when convention is READY_TO_SIGN", async () => {
      const conventionReadyToSign = new ConventionDtoBuilder(convention)
        .withStatus("READY_TO_SIGN")
        .build();
      inMemoryUow.conventionRepository.setConventions([conventionReadyToSign]);

      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionReadyToSign.id,
          role: "beneficiary",
          email: conventionReadyToSign.signatories.beneficiary.email,
          now: gateways.timeGateway.now(),
        }),
      );

      const response = await magicLinkRequest.sendAssessmentLink({
        headers: { authorization: jwt },
        body: { conventionId: conventionReadyToSign.id },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          status: 400,
          message: errors.assessment.sendAssessmentLinkNotAllowedForStatus({
            status: "READY_TO_SIGN",
          }).message,
        },
      });
    });

    it("403 - Forbidden when unauthorized user tries to send assessment link", async () => {
      const conventionWithValidStatus = new ConventionDtoBuilder(convention)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
      inMemoryUow.conventionRepository.setConventions([
        conventionWithValidStatus,
      ]);

      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionWithValidStatus.id,
          role: "agency-viewer" as ConventionRole,
          email: conventionWithValidStatus.establishmentTutor.email,
          now: gateways.timeGateway.now(),
        }),
      );

      const response = await magicLinkRequest.sendAssessmentLink({
        headers: { authorization: jwt },
        body: { conventionId: conventionWithValidStatus.id },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          status: 403,
          message: errors.assessment.sendAssessmentLinkForbidden().message,
        },
      });
    });

    it("401 - Invalid JWT", async () => {
      const response = await magicLinkRequest.sendAssessmentLink({
        headers: { authorization: "invalid-token" },
        body: { conventionId: convention.id },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "Provided token is invalid",
        },
      });
    });

    it("404 - Convention not found", async () => {
      const jwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: unknownId,
          role: "beneficiary",
          email: "some@email.com",
          now: gateways.timeGateway.now(),
        }),
      );

      const response = await magicLinkRequest.sendAssessmentLink({
        headers: { authorization: jwt },
        body: { conventionId: unknownId },
      });

      expectHttpResponseToEqual(response, {
        status: 404,
        body: {
          status: 404,
          message: errors.convention.notFound({ conventionId: unknownId })
            .message,
        },
      });
    });
  });
});
