import { SuperTest, Test } from "supertest";
import { match } from "ts-pattern";
import {
  adminTargets,
  AgencyDtoBuilder,
  BackOfficeJwt,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  conventionMagicLinkTargets,
  createConventionMagicLinkPayload,
  currentJwtVersions,
  expectEmailOfType,
  expectToEqual,
  InclusionConnectedUser,
  stringToMd5,
  unauthenticatedConventionTargets,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import {
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  GenerateInclusionConnectJwt,
} from "../../../../domain/auth/jwt";
import { conventionMissingMessage } from "../../../../domain/convention/entities/Convention";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import {
  TEST_AGENCY_DEPARTMENT,
  TEST_AGENCY_NAME,
} from "../../../secondary/InMemoryConventionQueries";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const peAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();
const inclusionConnectedUser: InclusionConnectedUser = {
  id: "my-user-id",
  email: "my-user@email.com",
  firstName: "John",
  lastName: "Doe",
  agencyRights: [{ role: "validator", agency: peAgency }],
};
const convention = new ConventionDtoBuilder()
  .withAgencyId(peAgency.id)
  .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
  .build();
const { externalId, ...createConventionParams } = convention;
const unknownId: ConventionId = "add5c20e-6dd2-45af-affe-927358005251";

describe("convention e2e", () => {
  let request: SuperTest<Test>;
  let generateConventionJwt: GenerateConventionJwt;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let gateways: InMemoryGateways;
  let adminToken: BackOfficeJwt;
  let appConfig: AppConfig;

  beforeEach(async () => {
    ({
      eventCrawler,
      gateways,
      request,
      generateConventionJwt,
      generateBackOfficeJwt,
      generateInclusionConnectJwt,
      inMemoryUow,
      appConfig,
    } = await buildTestApp(new AppConfigBuilder().build()));

    gateways.timeGateway.setNextDate(new Date());

    const response = await request.post("/admin/login").send({
      user: appConfig.backofficeUsername,
      password: appConfig.backofficePassword,
    });

    adminToken = response.body;
  });

  describe(`${unauthenticatedConventionTargets.createConvention.method} ${unauthenticatedConventionTargets.createConvention.url}`, () => {
    it("200 - Create convention without auth", async () => {
      expectToEqual(inMemoryUow.conventionRepository.conventions, []);

      const response = await request
        .post(unauthenticatedConventionTargets.createConvention.url)
        .send(createConventionParams);

      expectToEqual(response.status, 200);
      expectToEqual(response.body, { id: convention.id });
      expectToEqual(inMemoryUow.conventionRepository.conventions, [convention]);
    });

    it("400 - Invalid body", async () => {
      const response = await request
        .post(unauthenticatedConventionTargets.createConvention.url)
        .send({ invalid_params: true });
      expectToEqual(response.status, 400);
    });

    it("409 - Conflict", async () => {
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });

      const response = await request
        .post(unauthenticatedConventionTargets.createConvention.url)
        .send({
          ...createConventionParams,
          email: "another@email.fr",
        });

      expectToEqual(response.statusCode, 409);
      expectToEqual(response.body, {
        errors: `Convention with id ${convention.id} already exists`,
      });
    });
  });

  describe(`${unauthenticatedConventionTargets.shareConvention.method} ${unauthenticatedConventionTargets.shareConvention.url}`, () => {
    describe("200 - Share convention without auth", () => {
      it("should successfully ask for a short link", async () => {
        const shortLinkId = "shortLink1";
        gateways.shortLinkGenerator.addMoreShortLinkIds([shortLinkId]);
        const veryLongConventionLink =
          "http://localhost:3000/demande-immersion?email=&firstName=&lastName=&phone=&financiaryHelp=&emergencyContact=&emergencyContactPhone=&isRqth=false&birthdate=&agencyDepartment=&siret=&businessName=&businessAdvantages=&etFirstName=&etLastName=&etJob=&etPhone=&etEmail=&erFirstName=&erLastName=&erPhone=&erEmail=&immersionAddress=&immersionActivities=&immersionSkills=&sanitaryPreventionDescription=&workConditions=&dateStart=2023-08-05&dateEnd=2023-08-06&schedule=%7B%22totalHours%22%3A0%2C%22workedDays%22%3A0%2C%22isSimple%22%3Atrue%2C%22selectedIndex%22%3A0%2C%22complexSchedule%22%3A%5B%7B%22date%22%3A%222023-08-05T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%5D%7D%2C%7B%22date%22%3A%222023-08-06T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%5D%7D%5D%7D";
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);

        const response = await request
          .post(unauthenticatedConventionTargets.shareConvention.url)
          .send({
            conventionLink: veryLongConventionLink,
            details: "Le message du mail",
            email: "any@email.fr",
            internshipKind: "immersion",
          });

        expectToEqual(response.status, 200);
        expectToEqual(response.body, "");
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
            request,
          );

        expectToEqual(veryLongConventionLink, sharedConventionLink);
      });
    });

    describe("400 - Invalid body", () => {
      it("should return error message when missing mandatory fields", async () => {
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);

        const response = await request
          .post(unauthenticatedConventionTargets.shareConvention.url)
          .send({
            details: "any@email.fr",
            email: "any@email.fr",
            internshipKind: "immersion",
          });

        expectToEqual(response.status, 400);
        expectToEqual(response.body, {
          errors: [
            {
              code: "invalid_type",
              expected: "string",
              received: "undefined",
              path: ["conventionLink"],
              message: "Obligatoire",
            },
          ],
        });
      });
    });
  });

  describe(`${conventionMagicLinkTargets.getConvention.method} ${conventionMagicLinkTargets.getConvention.url}`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });
      inMemoryUow.agencyRepository.setAgencies([peAgency]);
    });

    it.each(["ConventionJwt", "BackOfficeJwt", "InclusionConnectJwt"] as const)(
      "200 - succeeds with JWT %s",
      async (scenario) => {
        inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers(
          [inclusionConnectedUser],
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
            generateBackOfficeJwt({
              role: "backOffice",
              sub: "",
              version: 1,
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            }),
          )
          .with("InclusionConnectJwt", () =>
            generateInclusionConnectJwt({
              userId: inclusionConnectedUser.id,
              version: currentJwtVersions.inclusion,
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            }),
          )
          .exhaustive();

        const response = await request
          .get(
            conventionMagicLinkTargets.getConvention.url.replace(
              ":conventionId",
              convention.id,
            ),
          )
          .set("Authorization", jwt);

        expect(response.body).toEqual({
          ...convention,
          agencyName: TEST_AGENCY_NAME,
          agencyDepartment: TEST_AGENCY_DEPARTMENT,
        });
        expect(response.status).toBe(200);
      },
    );

    it("403 - JWT Expired", async () => {
      const response = await request
        .get(
          conventionMagicLinkTargets.getConvention.url.replace(
            ":conventionId",
            convention.id,
          ),
        )
        .set(
          "Authorization",
          generateConventionJwt(
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
        );

      // GETting the created convention 403's and sets needsNewMagicLink flag to inform the front end to go to the link renewal page.
      expectToEqual(response.statusCode, 403);
      expectToEqual(response.body, {
        message: "Le lien magique est périmé",
        needsNewMagicLink: true,
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
      const response = await request
        .get(
          conventionMagicLinkTargets.getConvention.url.replace(
            ":conventionId",
            unknownId,
          ),
        )
        .set("Authorization", jwt);

      expect(response.body).toEqual({
        errors:
          "No convention found with id add5c20e-6dd2-45af-affe-927358005251",
      });
      expect(response.status).toBe(404);
    });
  });

  describe(`${conventionMagicLinkTargets.updateConvention.method} ${conventionMagicLinkTargets.updateConvention.url}`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });
    });

    it(`200 - Success with JWT ConventionJwt`, async () => {
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

      const response = await request
        .post(
          conventionMagicLinkTargets.updateConvention.url.replace(
            ":conventionId",
            convention.id,
          ),
        )
        .set("Authorization", jwt)
        .send({
          convention: updatedConvention,
        });
      expectToEqual(response.body, {
        id: convention.id,
      });
      expectToEqual(response.statusCode, 200);
    });

    it("404 - Updating an unknown convention id", async () => {
      const conventionWithUnknownId = new ConventionDtoBuilder()
        .withId(unknownId)
        .withStatus("READY_TO_SIGN")
        .build();
      const { externalId, ...createConventionParams } = conventionWithUnknownId;

      const response = await request
        .post(
          conventionMagicLinkTargets.updateConvention.url.replace(
            ":conventionId",
            unknownId,
          ),
        )
        .set(
          "Authorization",
          generateConventionJwt(
            createConventionMagicLinkPayload({
              id: unknownId,
              role: "beneficiary",
              email: "some email",
              now: gateways.timeGateway.now(),
            }),
          ),
        )
        .send({
          convention: { ...createConventionParams, externalId: "0001" },
        });

      expectToEqual(response.body, {
        errors: `Convention with id ${unknownId} was not found`,
      });
      expect(response.status).toBe(404);
    });
  });

  describe(`${conventionMagicLinkTargets.updateConventionStatus.method} ${conventionMagicLinkTargets.updateConventionStatus.url}`, () => {
    beforeEach(() => {
      inMemoryUow.agencyRepository.setAgencies([peAgency]);
      const inReviewConvention = new ConventionDtoBuilder(convention)
        .withStatus("IN_REVIEW")
        .build();
      inMemoryUow.conventionRepository.setConventions({
        [inReviewConvention.id]: inReviewConvention,
      });
      inMemoryUow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
        inclusionConnectedUser,
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
            generateBackOfficeJwt({
              role: "backOffice",
              sub: "",
              version: 1,
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            }),
          )
          .with("InclusionConnectJwt", () =>
            generateInclusionConnectJwt({
              userId: inclusionConnectedUser.id,
              version: currentJwtVersions.inclusion,
              iat: Math.round(gateways.timeGateway.now().getTime() / 1000),
            }),
          )
          .exhaustive();

        const response = await request
          .post(
            conventionMagicLinkTargets.updateConventionStatus.url.replace(
              ":conventionId",
              convention.id,
            ),
          )
          .set("Authorization", jwt)
          .send({
            status: "REJECTED",
            statusJustification: "test-justification",
          });

        expectToEqual(response.body, { id: convention.id });
        expectToEqual(response.statusCode, 200);

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
            id: "00000000001",
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

    it("401 - no JWT", async () => {
      const response = await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            convention.id,
          ),
        )
        .send({ status: "ACCEPTED_BY_VALIDATOR" });

      expectToEqual(response.statusCode, 401);
      expectToEqual(response.body, { error: "forbidden: unauthenticated" });
    });

    it("403 - unauthorized role for expected status update", async () => {
      const response = await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            convention.id,
          ),
        )
        .set(
          "Authorization",
          generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "establishment",
              email: convention.signatories.establishmentRepresentative.email,
              now: gateways.timeGateway.now(),
            }),
          ),
        )
        .send({ status: "ACCEPTED_BY_VALIDATOR" });

      expectToEqual(response.statusCode, 403);
      expectToEqual(response.body, {
        errors:
          "establishment is not allowed to go to status ACCEPTED_BY_VALIDATOR",
      });
    });

    it("404 - unknown convention id", async () => {
      const response = await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            unknownId,
          ),
        )
        .set(
          "Authorization",
          generateConventionJwt(
            createConventionMagicLinkPayload({
              id: unknownId,
              role: "counsellor",
              email: "counsellor@pe.fr",
              now: gateways.timeGateway.now(),
            }),
          ),
        )
        .send({ status: "ACCEPTED_BY_COUNSELLOR" });

      expectToEqual(response.statusCode, 404);
      expectToEqual(response.body, {
        errors: conventionMissingMessage(unknownId),
      });
    });
  });

  describe(`${adminTargets.getConventionById.method} ${adminTargets.getConventionById.url}`, () => {
    beforeEach(() => {
      inMemoryUow.conventionRepository.setConventions({
        [convention.id]: convention,
      });
    });

    it("200 - Success", async () => {
      // GETting the updated convention succeeds.
      const result = await request
        .get(adminTargets.getConventionById.url.replace(":id", convention.id))
        .set("Authorization", adminToken);

      expect(result.body).toEqual({
        ...convention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      });
      expect(result.status).toBe(200);
    });

    it("404 - Admin fetching unknown convention id", async () => {
      const adminResponse = await request
        .get(adminTargets.getConventionById.url.replace(":id", unknownId))
        .set("Authorization", adminToken);

      expect(adminResponse.body).toEqual({
        errors:
          "No convention found with id add5c20e-6dd2-45af-affe-927358005251",
      });
      expect(adminResponse.status).toBe(404);
    });
  });
});
