import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionMagicLinkRoutes,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  TechnicalRoutes,
  UnauthenticatedConventionRoutes,
  WithAuthorizationHeader,
  conventionMagicLinkRoutes,
  createConventionMagicLinkPayload,
  currentJwtVersions,
  displayRouteName,
  expectArraysToEqual,
  expectEmailOfType,
  expectHttpResponseToEqual,
  expectToEqual,
  expiredMagicLinkErrorMessage,
  frontRoutes,
  stringToMd5,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { match } from "ts-pattern";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { conventionMissingMessage } from "../../../../domains/convention/entities/Convention";
import { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import {
  GenerateConventionJwt,
  GenerateInclusionConnectJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

const peAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();

const inclusionConnectedUser: InclusionConnectedUser = {
  id: "my-user-id",
  email: "my-user@email.com",
  firstName: "John",
  lastName: "Doe",
  agencyRights: [{ role: "validator", agency: peAgency }],
  dashboards: { agencies: {}, establishments: {} },
  externalId: "john-external-id",
  createdAt: new Date().toISOString(),
};
const convention = new ConventionDtoBuilder()
  .withAgencyId(peAgency.id)
  .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
  .build();

const unknownId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-user")
  .withIsAdmin(true)
  .build();

const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
  version: currentJwtVersions.inclusion,
  iat: new Date().getTime(),
  exp: addDays(new Date(), 30).getTime(),
  userId: backofficeAdminUser.id,
};

describe("convention e2e", () => {
  let unauthenticatedRequest: HttpClient<UnauthenticatedConventionRoutes>;
  let magicLinkRequest: HttpClient<ConventionMagicLinkRoutes>;
  let technicalRoutesClient: HttpClient<TechnicalRoutes>;
  let generateConventionJwt: GenerateConventionJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let gateways: InMemoryGateways;
  let appConfig: AppConfig;

  beforeEach(async () => {
    const testApp = await buildTestApp(new AppConfigBuilder().build());
    const request = testApp.request;

    ({
      eventCrawler,
      gateways,
      generateConventionJwt,
      generateInclusionConnectJwt,
      inMemoryUow,
      appConfig,
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
        body: convention,
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
        } as unknown as ConventionDto,
      });

      expectHttpResponseToEqual(response, {
        body: {
          message:
            "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /demandes-immersion",
          status: 400,
          issues: [
            "id : Required",
            "status : Required",
            "agencyId : Obligatoire",
            "dateSubmission : Obligatoire",
            "dateStart : Obligatoire",
            "dateEnd : Obligatoire",
            "siret : Obligatoire",
            "businessName : Obligatoire",
            "schedule : Required",
            "individualProtection : Obligatoire",
            "sanitaryPrevention : Obligatoire",
            "immersionAddress : Obligatoire",
            "immersionObjective : Vous devez choisir un objectif d'immersion",
            "immersionAppellation : Required",
            "immersionActivities : Obligatoire",
            "establishmentTutor : Required",
            "internshipKind : Invalid discriminator value. Expected 'immersion' | 'mini-stage-cci'",
          ],
        },
        status: 400,
      });
    });

    it("409 - Conflict", async () => {
      inMemoryUow.conventionRepository.setConventions([convention]);

      const response = await unauthenticatedRequest.createConvention({
        body: {
          ...convention,
        },
      });

      expectHttpResponseToEqual(response, {
        body: {
          errors: `Convention with id ${convention.id} already exists`,
        },
        status: 409,
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
            issues: ["conventionLink : Obligatoire"],
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
      inMemoryUow.agencyRepository.setAgencies([peAgency]);
    });

    it.each(["ConventionJwt", "BackOfficeJwt", "InclusionConnectJwt"] as const)(
      "200 - succeeds with JWT %s",
      async (scenario) => {
        inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers(
          [inclusionConnectedUser, backofficeAdminUser],
        );

        const jwt = match(scenario)
          .with("ConventionJwt", () =>
            generateConventionJwt({
              applicationId: convention.id,
              role: "beneficiary",
              emailHash: stringToMd5(convention.signatories.beneficiary.email),
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
              exp:
                Math.round(gateways.timeGateway.now().getTime() / 1000) +
                31 * 24 * 3600,
              version: currentJwtVersions.convention,
            }),
          )
          .with("BackOfficeJwt", () =>
            generateInclusionConnectJwt(backofficeAdminJwtPayload),
          )
          .with("InclusionConnectJwt", () =>
            generateInclusionConnectJwt({
              userId: inclusionConnectedUser.id,
              version: currentJwtVersions.inclusion,
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
            agencyKind: peAgency.kind,
            agencySiret: peAgency.agencySiret,
            agencyCounsellorEmails: peAgency.counsellorEmails,
            agencyValidatorEmails: peAgency.validatorEmails,
          },
        });
      },
    );

    it("400 - no JWT", async () => {
      const response = await magicLinkRequest.getConvention({
        urlParams: {
          conventionId: convention.id,
        },
        headers: undefined as unknown as WithAuthorizationHeader,
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
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
        body: {
          errors:
            "No convention found with id add5c20e-6dd2-45af-affe-927358005251",
        },
        status: 404,
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.updateConvention,
  )} updates a draft convention`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions([convention]);
    });

    it("200 - Success with JWT ConventionJwt", async () => {
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
        body: {
          errors: `Convention with id ${unknownId} was not found`,
        },
        status: 404,
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.updateConventionStatus,
  )} updates the status of a convention`, () => {
    const externalId = "00000000001";
    beforeEach(() => {
      inMemoryUow.agencyRepository.setAgencies([peAgency]);
      const inReviewConvention = new ConventionDtoBuilder(convention)
        .withStatus("IN_REVIEW")
        .build();
      inMemoryUow.conventionRepository.setConventions([inReviewConvention]);
      inMemoryUow.conventionExternalIdRepository.externalIdsByConventionId = {
        [inReviewConvention.id]: externalId,
      };
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
        backofficeAdminUser,
      ]);
    });

    it.each(["ConventionJwt", "BackOfficeJwt", "InclusionConnectJwt"] as const)(
      "200 - Succeeds with JWT %s",
      async (scenario) => {
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
            generateInclusionConnectJwt(backofficeAdminJwtPayload),
          )
          .with("InclusionConnectJwt", () =>
            generateInclusionConnectJwt({
              userId: inclusionConnectedUser.id,
              version: currentJwtVersions.inclusion,
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

        expectToEqual(gateways.poleEmploiGateway.notifications, [
          {
            activitesObservees: convention.immersionActivities,
            adresseImmersion: convention.immersionAddress,
            codeAppellation: "017751",
            codeRome: convention.immersionAppellation.romeCode,
            competencesObservees:
              "Utilisation des pneus optimale, gestion de carburant",
            dateDebut: "2021-01-06T00:00:00.000Z",
            dateDemande: "2021-01-04T00:00:00.000Z",
            dateFin: "2021-01-15T00:00:00.000Z",
            dateNaissance: "2002-10-05T14:48:00.000Z",
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
            telephone: "+33012345678",
            telephoneTuteur: "0601010101",
          },
        ]);
      },
    );

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
          issues: ["authorization : Required"],
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
        body: {
          errors:
            "Role 'establishment-representative' is not allowed to go to status 'ACCEPTED_BY_VALIDATOR' for convention 'a99eaca1-ee70-4c90-b3f4-668d492f7392'.",
        },
        status: 403,
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
        body: {
          errors: conventionMissingMessage(unknownId),
        },
        status: 404,
      });
    });
  });

  describe(`${displayRouteName(
    conventionMagicLinkRoutes.renewConvention,
  )} renews a magic link`, () => {
    it("200 - sends the updated magic link", async () => {
      const validConvention = new ConventionDtoBuilder().build();

      const agency = AgencyDtoBuilder.create(validConvention.agencyId)
        .withName("TEST-name")
        .withAdminEmails(["admin@email.fr"])
        .withQuestionnaireUrl("https://TEST-questionnaireUrl")
        .withSignature("TEST-signature")
        .build();

      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.setAgencies([agency]);

      gateways.timeGateway.setNextDate(new Date());

      generateConventionJwt = makeGenerateJwtES256<"convention">(
        appConfig.jwtPrivateKey,
        3600 * 24, // one day
      );
      const shortLinkIds = ["shortLink1", "shortLinkg2"];
      gateways.shortLinkGenerator.addMoreShortLinkIds(shortLinkIds);

      const originalUrl = `${appConfig.immersionFacileBaseUrl}/${frontRoutes.conventionToSign}`;

      const expiredJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: validConvention.id,
          role: "beneficiary",
          email: validConvention.signatories.beneficiary.email,
          now: new Date(),
        }),
      );

      const response = await unauthenticatedRequest.renewMagicLink({
        queryParams: {
          expiredJwt,
          originalUrl: encodeURIComponent(originalUrl),
        },
      });

      expect(response.status).toBe(200);

      await processEventsForEmailToBeSent(eventCrawler);

      const sentEmails = gateways.notification.getSentEmails();

      expect(sentEmails).toHaveLength(1);

      const email = expectEmailOfType(sentEmails[0], "MAGIC_LINK_RENEWAL");
      expect(email.recipients).toEqual([
        validConvention.signatories.beneficiary.email,
      ]);

      const magicLink = await shortLinkRedirectToLinkWithValidation(
        email.params.magicLink,
        technicalRoutesClient,
      );

      const newUrlStart = `${originalUrl}?jwt=`;

      expect(magicLink.startsWith(newUrlStart)).toBeTruthy();
      const renewedJwt = magicLink.replace(newUrlStart, "");
      expect(renewedJwt !== expiredJwt).toBeTruthy();
      expect(
        makeVerifyJwtES256(appConfig.jwtPublicKey)(renewedJwt),
      ).toBeDefined();
    });
  });
});
