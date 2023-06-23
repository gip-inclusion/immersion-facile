import { SuperTest, Test } from "supertest";
import {
  adminTargets,
  AgencyDtoBuilder,
  BackOfficeJwt,
  BackOfficeJwtPayload,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionMagicLinkPayload,
  conventionMagicLinkTargets,
  createConventionMagicLinkPayload,
  currentJwtVersions,
  expectToEqual,
  stringToMd5,
  unauthenticatedConventionTargets,
  UpdateConventionRequestDto,
} from "shared";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import {
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
} from "../../../../domain/auth/jwt";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import {
  TEST_AGENCY_DEPARTMENT,
  TEST_AGENCY_NAME,
} from "../../../secondary/InMemoryConventionQueries";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

let request: SuperTest<Test>;
let generateConventionJwt: GenerateConventionJwt;
let generateBackOfficeJwt: GenerateBackOfficeJwt;
let inMemoryUow: InMemoryUnitOfWork;
let eventCrawler: BasicEventCrawler;
let gateways: InMemoryGateways;
let adminToken: BackOfficeJwt;

const peAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();

const convention = new ConventionDtoBuilder()
  .withAgencyId(peAgency.id)
  .withStatus("IN_REVIEW")
  .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
  .build();

const conventionId = convention.id;

const initializeSystemUnderTest = async (
  config: AppConfig,
  { withImmersionStored }: { withImmersionStored: boolean },
) => {
  ({
    eventCrawler,
    gateways,
    request,
    generateConventionJwt,
    generateBackOfficeJwt,
    inMemoryUow,
  } = await buildTestApp(config));

  inMemoryUow.agencyRepository.setAgencies([peAgency]);

  if (withImmersionStored) {
    const conventionRepository = inMemoryUow.conventionRepository;
    conventionRepository.setConventions({ [convention.id]: convention });
  }

  gateways.timeGateway.setNextDate(now);

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

      it("Creating an invalid convention fails", async () => {
        await request
          .post(unauthenticatedConventionTargets.createConvention.url)
          .send({ invalid_params: true })
          .expect(400);
      });

      it("Creating a valid convention succeeds", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;
        expectToEqual(inMemoryUow.conventionRepository.conventions, []);

        // POSTing a valid convention succeeds.
        await request
          .post(unauthenticatedConventionTargets.createConvention.url)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // GETting the created convention succeeds.
        await request
          .get(adminTargets.getConventionById.url.replace(":id", convention.id))
          .set("Authorization", adminToken)
          .expect(200, {
            ...convention,
            agencyName: TEST_AGENCY_NAME,
            agencyDepartment: TEST_AGENCY_DEPARTMENT,
          });
      });

      describe("Getting an convention", () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } =
          new ConventionDtoBuilder().build();

        beforeEach(async () => {
          // GET /demandes-immersion returns an empty list.
          expectToEqual(inMemoryUow.conventionRepository.conventions, []);

          // POSTing a valid convention succeeds.
          await request
            .post(unauthenticatedConventionTargets.createConvention.url)
            .send(createConventionParams)
            .expect(200, { id: convention.id });
        });

        it("succeeds with JWT ConventionMagicLinkPayload", async () => {
          const payload: ConventionMagicLinkPayload = {
            applicationId: convention.id,
            role: "beneficiary",
            emailHash: stringToMd5(convention.signatories.beneficiary.email),
            iat: Math.round(now.getTime() / 1000),
            exp: Math.round(now.getTime() / 1000) + 31 * 24 * 3600,
            version: currentJwtVersions.convention,
          };
          const jwt = generateConventionJwt(payload);

          // GETting the created convention succeeds.
          await request
            .get(
              conventionMagicLinkTargets.getConvention.url.replace(
                ":conventionId",
                "OSEF",
              ),
            )
            .set("Authorization", jwt)
            .expect(200, {
              ...convention,
              agencyName: TEST_AGENCY_NAME,
              agencyDepartment: TEST_AGENCY_DEPARTMENT,
            });
        });

        it("succeeds with JWT BackOfficeJwtPayload", async () => {
          const payload: BackOfficeJwtPayload = {
            role: "backOffice",
            sub: "",
            version: 1,
            iat: Math.round(now.getTime() / 1000),
          };
          const jwt = generateBackOfficeJwt(payload);

          // GETting the created convention succeeds.
          const response = await request
            .get(
              conventionMagicLinkTargets.getConvention.url.replace(
                ":conventionId",
                convention.id,
              ),
            )
            .set("Authorization", jwt);

          expectToEqual(response.body, {
            ...convention,
            agencyName: TEST_AGENCY_NAME,
            agencyDepartment: TEST_AGENCY_DEPARTMENT,
          });
          expectToEqual(response.status, 200);
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
          const jwt = generateConventionJwt(payload);

          // GETting the created convention 403's and sets needsNewMagicLink flag to inform the front end to go to the link renewal page.
          await request
            .get(
              conventionMagicLinkTargets.getConvention.url.replace(
                ":conventionId",
                convention.id,
              ),
            )
            .set("Authorization", jwt)
            .expect(403, {
              message: "Le lien magique est périmé",
              needsNewMagicLink: true,
            });
        });
      });

      it("Updating an existing convention succeeds", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;

        // POSTing a valid convention succeeds.
        await request
          .post(unauthenticatedConventionTargets.createConvention.url)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // POSTing an updated convention to the same id succeeds.
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
            now,
          }),
        );

        await request
          .post(
            conventionMagicLinkTargets.updateConvention.url.replace(
              ":conventionId",
              convention.id,
            ),
          )
          .set("Authorization", jwt)
          .send({
            convention: updatedConvention,
          })
          .expect(200);

        // GETting the updated convention succeeds.
        const result = await request
          .get(adminTargets.getConventionById.url.replace(":id", convention.id))
          .set("Authorization", adminToken);

        expect(result.body).toEqual({
          ...updatedConvention,
          agencyName: TEST_AGENCY_NAME,
          agencyDepartment: TEST_AGENCY_DEPARTMENT,
        });
        expect(result.status).toBe(200);
      });

      it("Fetching unknown convention IDs fails with 404 Not Found", async () => {
        const unknownId = "add5c20e-6dd2-45af-affe-927358005251";
        const jwt = generateConventionJwt(
          createConventionMagicLinkPayload({
            id: unknownId,
            role: "beneficiary",
            email: "some email",
            now,
          }),
        );
        await request
          .get(
            conventionMagicLinkTargets.getConvention.url.replace(
              ":conventionId",
              "anything",
            ),
          )
          .set("Authorization", jwt)
          .expect(404);

        await request
          .get(adminTargets.getConventionById.url.replace(":id", unknownId))
          .set("Authorization", adminToken)
          .expect(404);
      });

      it("Updating an unknown convention IDs fails with 404 Not Found", async () => {
        const unknownId = "40400000-0000-4000-0000-000000000404";
        const conventionWithUnknownId = new ConventionDtoBuilder()
          .withId(unknownId)
          .withStatus("READY_TO_SIGN")
          .build();
        const { externalId, ...createConventionParams } =
          conventionWithUnknownId;

        const jwt = generateConventionJwt(
          createConventionMagicLinkPayload({
            id: unknownId,
            role: "beneficiary",
            email: "some email",
            now,
          }),
        );

        const updatedConvention: UpdateConventionRequestDto = {
          convention: { ...createConventionParams, externalId: "0001" },
        };

        const response = await request
          .post(
            conventionMagicLinkTargets.updateConvention.url.replace(
              ":conventionId",
              unknownId,
            ),
          )
          .set("Authorization", jwt)
          .send(updatedConvention);

        expectToEqual(response.body, {
          errors: `Convention with id ${unknownId} was not found`,
        });
        expect(response.status).toBe(404);
      });

      it("Creating an convention with an existing ID fails with 409 Conflict", async () => {
        const convention = new ConventionDtoBuilder().build();
        const { externalId, ...createConventionParams } = convention;

        // POSTing a valid convention succeeds.
        await request
          .post(unauthenticatedConventionTargets.createConvention.url)
          .send(createConventionParams)
          .expect(200, { id: convention.id });

        // POSTing a another valid convention with the same ID fails.
        await request
          .post(unauthenticatedConventionTargets.createConvention.url)
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

    it("Succeeds for rejected convention and notifies Pole Emploi", async () => {
      // A counsellor rejects the convention.
      const counsellorJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionId,
          role: "counsellor",
          email: "counsellor@pe.fr",
          now,
        }),
      );
      await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            counsellorJwt,
          ),
        )
        .set("Authorization", counsellorJwt)
        .send({ status: "REJECTED", statusJustification: "test-justification" })
        .expect(200);

      await eventCrawler.processNewEvents();

      const notifications = gateways.poleEmploiGateway.notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].statut).toBe("REJETÉ");
    });

    it("Succeeds for BackOfficeJwt", async () => {
      // A counsellor rejects the convention.
      const payload: BackOfficeJwtPayload = {
        role: "backOffice",
        sub: "",
        version: 1,
        iat: Math.round(now.getTime() / 1000),
      };
      const backOfficeJwt = generateBackOfficeJwt(payload);
      await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            conventionId,
          ),
        )
        .set("Authorization", backOfficeJwt)
        .send({ status: "REJECTED", statusJustification: "test-justification" })
        .expect(200);
    });

    it("Returns error 401 if no JWT", async () => {
      await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            conventionId,
          ),
        )
        .send({ status: "ACCEPTED_BY_VALIDATOR" })
        .expect(401);
    });

    it("Returns error 403 for unauthorized requests", async () => {
      // A tutor tries to validate the convention, but fails.
      const tutorJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: conventionId,
          role: "establishment",
          email: convention.signatories.establishmentRepresentative.email,
          now,
        }),
      );
      await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            conventionId,
          ),
        )
        .set("Authorization", tutorJwt)
        .send({ status: "ACCEPTED_BY_VALIDATOR" })
        .expect(403);
    });

    it("Returns error 404 for unknown convention ids", async () => {
      const counsellorJwt = generateConventionJwt(
        createConventionMagicLinkPayload({
          id: "unknown_application_id",
          role: "counsellor",
          email: "counsellor@pe.fr",
          now,
        }),
      );
      await request
        .post(
          conventionMagicLinkTargets.updateConventionStatus.url.replace(
            ":conventionId",
            "unknown_application_id",
          ),
        )
        .set("Authorization", counsellorJwt)
        .send({ status: "ACCEPTED_BY_COUNSELLOR" })
        .expect(404); // Not found
    });
  });
});
