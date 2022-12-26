import {
  AdminToken,
  ConventionDto,
  ConventionDtoBuilder,
  conventionsRoute,
  createConventionMagicLinkPayload,
  currentJwtVersions,
  expectToEqual,
  Role,
  stringToMd5,
  updateConventionStatusRoute,
} from "shared";
import { SuperTest, Test } from "supertest";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { GenerateMagicLinkJwt } from "../../../../domain/auth/jwt";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { TEST_AGENCY_NAME } from "../../../secondary/InMemoryConventionQueries";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

let request: SuperTest<Test>;
let generateMagicLinkJwt: GenerateMagicLinkJwt;
let inMemoryUow: InMemoryUnitOfWork;
let eventCrawler: BasicEventCrawler;
let gateways: InMemoryGateways;
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
  ({ eventCrawler, gateways, request, generateMagicLinkJwt, inMemoryUow } =
    await buildTestApp(config));

  if (withImmersionStored) {
    const conventionRepository = inMemoryUow.conventionRepository;
    conventionRepository.setConventions({ [convention.id]: convention });
  }

  const response = await request.post("/admin/login").send({
    user: config.backofficeUsername,
    password: config.backofficePassword,
  });

  adminToken = response.body;
};

const now = new Date();

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
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);

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
          expectToEqual(inMemoryUow.conventionRepository.conventions, []);

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
            emailHash: stringToMd5(convention.signatories.beneficiary.email),
            iat: Math.round(now.getTime() / 1000),
            exp: Math.round(now.getTime() / 1000) + 31 * 24 * 3600,
            version: currentJwtVersions.application,
          };
          const jwt = generateMagicLinkJwt(payload);

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
          const payload = createConventionMagicLinkPayload({
            id: convention.id,
            role: "beneficiary",
            email: convention.signatories.beneficiary.email,
            durationDays: 1,
            now,
            exp: Math.round(now.getTime() / 1000) - 2 * 24 * 3600,
          });
          const jwt = generateMagicLinkJwt(payload);

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
        const updatedConvention: ConventionDto = {
          ...convention,
          signatories: {
            beneficiary: {
              ...convention.signatories.beneficiary,
              email: "new@email.fr",
            },
            establishmentRepresentative:
              convention.signatories.establishmentRepresentative,
          },
          status: "READY_TO_SIGN",
        };

        const jwt = generateMagicLinkJwt(
          createConventionMagicLinkPayload({
            id: convention.id,
            role: "beneficiary",
            email: convention.signatories.beneficiary.email,
            now,
          }),
        );

        await request
          .post(`/auth/${conventionsRoute}/${convention.id}`)
          .set("Authorization", jwt)
          .send(updatedConvention)
          .expect(200);

        // GETting the updated application succeeds.
        const result = await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .set("Authorization", adminToken);

        expect(result.body).toEqual({
          ...updatedConvention,
          agencyName: TEST_AGENCY_NAME,
        });
        expect(result.status).toBe(200);
      });

      it("Fetching unknown application IDs fails with 404 Not Found", async () => {
        const unknownId = "unknown-demande-immersion-id";
        const jwt = generateMagicLinkJwt(
          createConventionMagicLinkPayload({
            id: unknownId,
            role: "beneficiary",
            email: "some email",
            now,
          }),
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

        const jwt = generateMagicLinkJwt(
          createConventionMagicLinkPayload({
            id: unknownId,
            role: "beneficiary",
            email: "some email",
            now,
          }),
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
      const counsellorJwt = generateMagicLinkJwt(
        createConventionMagicLinkPayload({
          id: conventionId,
          role: "counsellor",
          email: "counsellor@pe.fr",
          now,
        }),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/${counsellorJwt}`)
        .set("Authorization", counsellorJwt)
        .send({ status: "REJECTED", justification: "test-justification" })
        .expect(200);

      await eventCrawler.processNewEvents();

      const notifications = gateways.poleEmploiGateway.notifications;
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
      const tutorJwt = generateMagicLinkJwt(
        createConventionMagicLinkPayload({
          id: conventionId,
          role: "establishment",
          email: convention.signatories.establishmentRepresentative.email,
          now,
        }),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/${conventionId}`)
        .set("Authorization", tutorJwt)
        .send({ status: "ACCEPTED_BY_VALIDATOR" })
        .expect(403);
    });

    it("Returns error 404 for unknown application ids", async () => {
      const counsellorJwt = generateMagicLinkJwt(
        createConventionMagicLinkPayload({
          id: "unknown_application_id",
          role: "counsellor",
          email: "counsellor@pe.fr",
          now,
        }),
      );
      await request
        .post(`/auth/${updateConventionStatusRoute}/unknown_application_id`)
        .set("Authorization", counsellorJwt)
        .send({ status: "ACCEPTED_BY_COUNSELLOR" })
        .expect(404); // Not found
    });
  });
});
