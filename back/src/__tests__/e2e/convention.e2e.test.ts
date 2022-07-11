import { AdminToken } from "shared/src/admin/admin.dto";
import { InMemoryConventionRepository } from "../../adapters/secondary/InMemoryConventionRepository";
import {
  currentJwtVersions,
  stringToMd5,
} from "shared/src/tokens/MagicLinkPayload";
import { SuperTest, Test } from "supertest";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import {
  conventionsRoute,
  updateConventionStatusRoute,
} from "shared/src/routes";
import {
  createConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { GenerateMagicLinkJwt } from "../../domain/auth/jwt";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import {
  buildTestApp,
  InMemoryRepositories,
  TestAppAndDeps,
} from "../../_testBuilders/buildTestApp";
import { TEST_AGENCY_NAME } from "../../adapters/secondary/InMemoryConventionQueries";

let request: SuperTest<Test>;
let generateJwt: GenerateMagicLinkJwt;
let eventCrawler: BasicEventCrawler;
let reposAndGateways: InMemoryRepositories;
let adminToken: AdminToken;

const convention = new ConventionDtoBuilder()
  .withStatus("IN_REVIEW")
  .withFederatedIdentity("peConnect:some-id")
  .build();

const conventionId = convention.id;

const initializeSystemUnderTest = async (
  config: AppConfig,
  { withImmersionStored }: { withImmersionStored: boolean },
) => {
  const {
    eventCrawler: testEventCrawler,
    reposAndGateways: testReposAndGateways,
    request: testRequest,
    generateMagicLinkJwt,
  }: TestAppAndDeps = await buildTestApp(config);
  eventCrawler = testEventCrawler;
  request = testRequest;
  reposAndGateways = testReposAndGateways;

  if (withImmersionStored) {
    const conventionRepository =
      reposAndGateways.convention as InMemoryConventionRepository;
    conventionRepository.setConventions({ [convention.id]: convention });
  }
  generateJwt = generateMagicLinkJwt;
  const response = await request.post("/admin/login").send({
    user: config.backofficeUsername,
    password: config.backofficePassword,
  });

  adminToken = response.body;
};

describe("convention e2e", () => {
  describe("/demandes-immersion route", () => {
    describe("DEV environment", () => {
      beforeEach(async () => {
        await initializeSystemUnderTest(new AppConfigBuilder().build(), {
          withImmersionStored: false,
        });
      });

      it("Creating an invalid application fails", async () => {
        await request
          .post(`/${conventionsRoute}`)
          .send({ invalid_params: true })
          .expect(400);
      });

      it("Creating a valid application succeeds", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;

        // GET /demandes-immersion returns an empty list.
        await request
          .get(`/admin/${conventionsRoute}`)
          .set("Authorization", adminToken)
          .expect(200, []);

        // POSTing a valid application succeeds.
        await request
          .post(`/${conventionsRoute}`)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // GETting the created application succeeds.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .set("Authorization", adminToken)
          .expect(200, {
            ...convention,
            agencyName: TEST_AGENCY_NAME,
          });
      });

      describe("Getting an application", () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } =
          new ConventionDtoBuilder().build();

        beforeEach(async () => {
          // GET /demandes-immersion returns an empty list.
          await request
            .get(`/admin/${conventionsRoute}`)
            .set("Authorization", adminToken)
            .expect(200, []);

          // POSTing a valid application succeeds.
          await request
            .post(`/${conventionsRoute}`)
            .send(createConventionParams)
            .expect(200, { id: convention.id });
        });

        it("succeeds with correct magic link", async () => {
          const payload = {
            applicationId: convention.id,
            role: "beneficiary" as Role,
            emailHash: stringToMd5(convention.email),
            iat: Math.round(Date.now() / 1000),
            exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
            version: currentJwtVersions.application,
          };
          const jwt = generateJwt(payload);

          // GETting the created application succeeds.
          await request
            .get(`/auth/${conventionsRoute}/${convention.id}`)
            .set("Authorization", jwt)
            .expect(200, {
              ...convention,
              agencyName: TEST_AGENCY_NAME,
            });
        });

        it("redirects expired magic links to a renewal page", async () => {
          const payload = createConventionMagicLinkPayload(
            convention.id,
            "beneficiary",
            convention.email,
            1,
            undefined,
            undefined,
            Math.round(Date.now() / 1000) - 2 * 24 * 3600,
          );
          const jwt = generateJwt(payload);

          // GETting the created application 403's and sets needsNewMagicLink flag to inform the front end to go to the link renewal page.
          await request
            .get(`/auth/${conventionsRoute}/${convention.id}`)
            .set("Authorization", jwt)
            .expect(403, {
              message: "Le lien magique est périmé",
              needsNewMagicLink: true,
            });
        });
      });

      it("Updating an existing application succeeds", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;

        // POSTing a valid application succeeds.
        await request
          .post(`/${conventionsRoute}`)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // POSTing an updated application to the same id succeeds.
        const updatedConvention = {
          ...convention,
          email: "new@email.fr",
          status: "READY_TO_SIGN",
        };

        const jwt = generateJwt(
          createConventionMagicLinkPayload(
            convention.id,
            "beneficiary",
            convention.email,
          ),
        );

        await request
          .post(`/auth/${conventionsRoute}/${convention.id}`)
          .set("Authorization", jwt)
          .send(updatedConvention)
          .expect(200);

        // GETting the updated application succeeds.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .set("Authorization", adminToken)
          .expect(200, {
            ...updatedConvention,
            agencyName: TEST_AGENCY_NAME,
          });
      });

      it("Fetching unknown application IDs fails with 404 Not Found", async () => {
        const unknownId = "unknown-demande-immersion-id";
        const jwt = generateJwt(
          createConventionMagicLinkPayload(
            unknownId,
            "beneficiary",
            "some email",
          ),
        );
        await request
          .get(`/${conventionsRoute}/anything`)
          .set("Authorization", jwt)
          .expect(404);

        await request
          .get(`/admin/${conventionsRoute}/${unknownId}`)
          .set("Authorization", adminToken)
          .expect(404);
      });

      it("Updating an unknown application IDs fails with 404 Not Found", async () => {
        const unknownId = "unknown-demande-immersion-id";
        const conventionWithUnknownId = new ConventionDtoBuilder()
          .withId(unknownId)
          .build();
        const { externalId, ...createConventionParams } =
          conventionWithUnknownId;

        const jwt = generateJwt(
          createConventionMagicLinkPayload(
            unknownId,
            "beneficiary",
            "some email",
          ),
        );

        await request
          .post(`/${conventionsRoute}/${unknownId}`)
          .set("Authorization", jwt)
          .send(createConventionParams)
          .expect(404);
      });

      it("Creating an application with an existing ID fails with 409 Conflict", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;

        // POSTing a valid application succeeds.
        await request
          .post(`/${conventionsRoute}`)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // POSTing a another valid application with the same ID fails.
        await request
          .post(`/${conventionsRoute}`)
          .send({
            ...createConventionParams,
            email: "another@email.fr",
          })
          .expect(409);
      });
    });
  });

  describe("/update-application-status route", () => {
    beforeEach(async () => {
      await initializeSystemUnderTest(new AppConfigBuilder().build(), {
        withImmersionStored: true,
      });
    });

    it("Succeeds for rejected application and notifies Pole Emploi", async () => {
      // A counsellor rejects the application.
      const counsellorJwt = generateJwt(
        createConventionMagicLinkPayload(
          conventionId,
          "counsellor",
          "counsellor@pe.fr",
        ),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/${counsellorJwt}`)
        .set("Authorization", counsellorJwt)
        .send({ status: "REJECTED", justification: "test-justification" })
        .expect(200);

      await eventCrawler.processNewEvents();

      const notifications = reposAndGateways.poleEmploiGateway.notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].status).toBe("REJETÉ");
    });

    it("Returns error 401 if no JWT", async () => {
      await request
        .post(`/auth/${updateConventionStatusRoute}/${conventionId}`)
        .send({ status: "ACCEPTED_BY_VALIDATOR" })
        .expect(401);
    });

    it("Returns error 403 for unauthorized requests", async () => {
      // A tutor tries to validate the application, but fails.
      const tutorJwt = generateJwt(
        createConventionMagicLinkPayload(
          conventionId,
          "establishment",
          convention.mentorEmail,
        ),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/${conventionId}`)
        .set("Authorization", tutorJwt)
        .send({ status: "ACCEPTED_BY_VALIDATOR" })
        .expect(403);
    });

    it("Returns error 404 for unknown application ids", async () => {
      const counsellorJwt = generateJwt(
        createConventionMagicLinkPayload(
          "unknown_application_id",
          "counsellor",
          "counsellor@pe.fr",
        ),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/unknown_application_id`)
        .set("Authorization", counsellorJwt)
        .send({ status: "ACCEPTED_BY_COUNSELLOR" })
        .expect(404); // Not found
    });
  });
});
