import { addDays } from "date-fns";
import {
  type AddConventionInput,
  AgencyDtoBuilder,
  type AuthenticatedConventionRoutes,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionMagicLinkRoutes,
  type InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  type Role,
  type TechnicalRoutes,
  type UnauthenticatedConventionRoutes,
  type User,
  type WithAuthorizationHeader,
  authenticatedConventionRoutes,
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
  frontRoutes,
  technicalRoutes,
  unauthenticatedConventionRoutes,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { match } from "ts-pattern";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import {
  type GenerateConventionJwt,
  type GenerateInclusionConnectJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type InMemoryGateways,
  buildTestApp,
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

  const backofficeAdminUser = new InclusionConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true)
    .buildUser();

  const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
    version: currentJwtVersions.inclusion,
    iat: new Date().getTime(),
    exp: addDays(new Date(), 30).getTime(),
    userId: backofficeAdminUser.id,
  };

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
          issues: ["convention : Required"],
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
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
    });

    it.each(["ConventionJwt", "BackOfficeJwt", "InclusionConnectJwt"] as const)(
      "200 - succeeds with JWT %s",
      async (scenario) => {
        inMemoryUow.userRepository.users = [validator, backofficeAdminUser];

        const jwt = match(scenario)
          .with("ConventionJwt", () =>
            generateConventionJwt({
              applicationId: convention.id,
              role: "beneficiary",
              emailHash: makeEmailHash(
                convention.signatories.beneficiary.email,
              ),
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
              userId: validator.id,
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
            agencyValidatorEmails: [validator.email],
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
            generateInclusionConnectJwt({
              userId: validator.id,
              version: currentJwtVersions.inclusion,
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
              exp:
                Math.round(gateways.timeGateway.now().getTime() / 1000) + 3600,
            }),
          )
          .with("InclusionConnectJwt", () =>
            generateInclusionConnectJwt({
              userId: validator.id,
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
    conventionMagicLinkRoutes.renewConvention,
  )} renews a magic link`, () => {
    it("200 - sends the updated magic link", async () => {
      const validConvention = new ConventionDtoBuilder().build();

      const agency = AgencyDtoBuilder.create(validConvention.agencyId)
        .withName("TEST-name")
        .withSignature("TEST-signature")
        .build();

      const convention = new ConventionDtoBuilder().build();
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.agencies = [toAgencyWithRights(agency)];

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

    it("400 - renew not allowed for back-office", async () => {
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(
          AgencyDtoBuilder.create(convention.agencyId)
            .withName("TEST-name")
            .withSignature("TEST-signature")
            .build(),
        ),
      ];
      gateways.timeGateway.setNextDate(new Date());

      generateConventionJwt = makeGenerateJwtES256<"convention">(
        appConfig.jwtPrivateKey,
        3600 * 24, // one day
      );

      const unsupportedRole: Role = "back-office";

      const response = await unauthenticatedRequest.renewMagicLink({
        queryParams: {
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: unsupportedRole,
              email: convention.establishmentTutor.email,
              now: gateways.timeGateway.now(),
            }),
          ),
          originalUrl: encodeURIComponent(
            `https://${appConfig.immersionFacileBaseUrl}/${frontRoutes.assessment}`,
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          message: errors.convention.roleHasNoMagicLink({
            role: unsupportedRole,
          }).message,
          status: 400,
        },
      });
    });
  });

  describe("GetConventionsForAgencyUser", () => {
    let authenticatedRequest: HttpClient<AuthenticatedConventionRoutes>;

    const convention1 = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa")
      .withAgencyId(peAgency.id)
      .withDateStart(new Date("2023-03-15").toISOString())
      .withDateEnd(new Date("2023-03-20").toISOString())
      .withDateSubmission(new Date("2023-03-10").toISOString())
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build();

    const convention2 = new ConventionDtoBuilder()
      .withId("bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb")
      .withAgencyId(peAgency.id)
      .withDateStart(new Date("2023-02-15").toISOString())
      .withDateEnd(new Date("2023-02-20").toISOString())
      .withDateSubmission(new Date("2023-02-10").toISOString())
      .withStatus("PARTIALLY_SIGNED")
      .build();

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

      authenticatedRequest = createSupertestSharedClient(
        authenticatedConventionRoutes,
        request,
      );

      inMemoryUow.userRepository.users = [validator];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(peAgency, {
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];
      inMemoryUow.conventionRepository.setConventions([
        convention1,
        convention2,
      ]);
    });

    it("401 - Unauthorized when not correctly authenticated", async () => {
      const response = await authenticatedRequest.getConventionsForAgencyUser({
        headers: { authorization: "invalid-token" },
        queryParams: {},
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          status: 401,
          message: "Provided token is invalid",
        },
      });
    });

    it("200 - Successfully gets conventions with date filter", async () => {
      gateways.timeGateway.setNextDate(new Date());
      const jwt = generateInclusionConnectJwt({
        userId: validator.id,
        version: currentJwtVersions.inclusion,
        iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
      });

      const response = await authenticatedRequest.getConventionsForAgencyUser({
        headers: { authorization: jwt },
        queryParams: {
          dateStartFrom: "2023-01-01",
          statuses: ["ACCEPTED_BY_VALIDATOR", "PARTIALLY_SIGNED"],
          sortBy: "dateStart",
          page: 1,
          perPage: 10,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: {
          data: [convention1, convention2],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            numberPerPage: 10,
            totalRecords: 2,
          },
        },
      });

      expectToEqual(inMemoryUow.conventionQueries.paginatedConventionsParams, [
        {
          agencyUserId: validator.id,
          filters: {
            dateStart: { from: "2023-01-01" },
            statuses: ["ACCEPTED_BY_VALIDATOR", "PARTIALLY_SIGNED"],
          },
          pagination: {
            page: 1,
            perPage: 10,
          },
          sortBy: "dateStart",
        },
      ]);
    });
  });
});
