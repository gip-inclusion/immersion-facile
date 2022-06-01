import { InMemoryConventionRepository } from "../../adapters/secondary/InMemoryConventionRepository";
import { ConventionEntity } from "../../domain/convention/entities/ConventionEntity";
import {
  currentJwtVersions,
  emailHashForMagicLink,
} from "shared/src/tokens/MagicLinkPayload";
import supertest, { SuperTest, Test } from "supertest";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { createApp } from "../../adapters/primary/server";
import {
  conventionsRoute,
  updateConventionStatusRoute,
  validateConventionRoute,
} from "shared/src/routes";
import {
  createConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { GenerateMagicLinkJwt } from "../../domain/auth/jwt";

let request: SuperTest<Test>;
let generateJwt: GenerateMagicLinkJwt;

const convention = new ConventionDtoBuilder().withStatus("IN_REVIEW").build();

const conventionId = convention.id;

const initializeSystemUnderTest = async (
  config: AppConfig,
  { withImmersionStored }: { withImmersionStored: boolean },
) => {
  const { app, repositories, generateMagicLinkJwt } = await createApp(config);
  if (withImmersionStored) {
    const entity = ConventionEntity.create(convention);
    const conventionRepository =
      repositories.convention as InMemoryConventionRepository;
    conventionRepository.setConventions({ [entity.id]: entity });
  }
  request = supertest(app);
  generateJwt = generateMagicLinkJwt;
};

describe("/demandes-immersion route", () => {
  describe("Backoffice", () => {
    beforeEach(async () => {
      await initializeSystemUnderTest(new AppConfigBuilder().build(), {
        withImmersionStored: true,
      });
    });
    describe("Application validation", () => {
      it("Validating an existing application succeeds, with auth", async () => {
        // Validating an application with existing id succeeds (with auth).
        await request
          .get(`/${validateConventionRoute}/${convention.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, { id: convention.id });

        const validatedConvention = {
          ...convention,
          status: "VALIDATED",
        };

        // Getting the application succeeds and shows that it's validated.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, validatedConvention);
      });

      it("Validating applications without credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateConventionRoute}/${convention.id}`)
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, convention);
      });

      it("Validating applications with invalid credentials fails with 403 Forbidden", async () => {
        await request
          .get(`/${validateConventionRoute}/${convention.id}`)
          .auth("not real user", "not real password")
          .expect(403);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, convention);
      });

      it("Validating non-existent application with valid credentials fails with 404", async () => {
        await request
          .get(`/${validateConventionRoute}/unknown-demande-immersion-id`)
          .auth("e2e_tests", "e2e")
          .expect(404);

        // Getting the existing application succeeds and shows that it's NOT validated.
        await request
          .get(`/admin/${conventionsRoute}/${convention.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, convention);
      });
    });
  });

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

      // GET /demandes-immersion returns an empty list.
      await request
        .get(`/${conventionsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(200, []);

      // POSTing a valid application succeeds.
      await request
        .post(`/${conventionsRoute}`)
        .send(convention)
        .expect(200, { id: convention.id });

      // GETting the created application succeeds.
      await request
        .get(`/admin/${conventionsRoute}/${convention.id}`)
        .auth("e2e_tests", "e2e")
        .expect(200, convention);
    });

    describe("Getting an application", () => {
      const convention = new ConventionDtoBuilder().build();

      beforeEach(async () => {
        // GET /demandes-immersion returns an empty list.
        await request
          .get(`/${conventionsRoute}`)
          .auth("e2e_tests", "e2e")
          .expect(200, []);

        // POSTing a valid application succeeds.
        await request
          .post(`/${conventionsRoute}`)
          .send(convention)
          .expect(200, { id: convention.id });
      });

      it("succeeds with correct magic link", async () => {
        const payload = {
          applicationId: convention.id,
          role: "beneficiary" as Role,
          emailHash: emailHashForMagicLink(convention.email),
          iat: Math.round(Date.now() / 1000),
          exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
          version: currentJwtVersions.application,
        };
        const jwt = generateJwt(payload);

        // GETting the created application succeeds.
        await request
          .get(`/auth/${conventionsRoute}/${jwt}`)
          .expect(200, convention);
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
        await request.get(`/auth/${conventionsRoute}/${jwt}`).expect(403, {
          message: "Le lien magique est périmé",
          needsNewMagicLink: true,
        });
      });
    });

    it("Updating an existing application succeeds", async () => {
      const convention = new ConventionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${conventionsRoute}`)
        .send(convention)
        .expect(200, { id: convention.id });

      // POSTing an updated application to the same id succeeds.
      const updatedConvention = {
        ...convention,
        email: "new@email.fr",
      };

      const jwt = generateJwt(
        createConventionMagicLinkPayload(
          convention.id,
          "beneficiary",
          convention.email,
        ),
      );

      await request
        .post(`/auth/${conventionsRoute}/${jwt}`)
        .send(updatedConvention)
        .expect(200);

      // GETting the updated application succeeds.
      await request
        .get(`/admin/${conventionsRoute}/${convention.id}`)
        .auth("e2e_tests", "e2e")
        .expect(200, updatedConvention);
    });

    it("Fetching unknown application IDs fails with 404 Not Found", async () => {
      const link = generateJwt(
        createConventionMagicLinkPayload(
          "unknown-demande-immersion-id",
          "beneficiary",
          "some email",
        ),
      );
      await request.get(`/${conventionsRoute}/${link}`).expect(404);

      await request
        .get(`/admin/${conventionsRoute}/unknown-demande-immersion-id`)
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Updating an unknown application IDs fails with 404 Not Found", async () => {
      const unknownId = "unknown-demande-immersion-id";
      const conventionWithUnknownId = new ConventionDtoBuilder()
        .withId(unknownId)
        .build();

      const link = generateJwt(
        createConventionMagicLinkPayload(
          unknownId,
          "beneficiary",
          "some email",
        ),
      );

      await request
        .post(`/${conventionsRoute}/${link}`)
        .send(conventionWithUnknownId)
        .expect(404);
    });

    it("Creating an application with an existing ID fails with 409 Conflict", async () => {
      const convention = new ConventionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${conventionsRoute}`)
        .send(convention)
        .expect(200, { id: convention.id });

      // POSTing a another valid application with the same ID fails.
      await request
        .post(`/${conventionsRoute}`)
        .send({
          ...convention,
          email: "another@email.fr",
        })
        .expect(409);
    });

    it("Listing applications without credentials fails with 401 Unauthorized", async () => {
      await request.get(`/${conventionsRoute}`).expect(401);
    });

    it("Listing applications with invalid credentials fails with 403 Forbidden", async () => {
      await request
        .get(`/${conventionsRoute}`)
        .auth("not real user", "not real password")
        .expect(403);
    });

    it("Listing applications with valid credentials succeeds", async () => {
      // GET /demandes-immersion succeeds with login/pass.
      await request
        .get(`/${conventionsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(200);
    });
  });
});

describe("/update-application-status route", () => {
  beforeEach(async () => {
    await initializeSystemUnderTest(new AppConfigBuilder().build(), {
      withImmersionStored: true,
    });
  });

  it("Succeeds for rejected application", async () => {
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
      .send({ status: "REJECTED", justification: "test-justification" })
      .expect(200);
  });

  // Skip: Currently no configuration returns 400. Reenable this test if one is added.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("Returns error 400 for invalid requests", async () => {
    // An establishment tries to change it to DRAFT but fails.
    const establishmentJwt = generateJwt(
      createConventionMagicLinkPayload(
        conventionId,
        "establishment",
        convention.mentorEmail,
      ),
    );
    await request
      .post(`/auth/${updateConventionStatusRoute}/${establishmentJwt}`)
      .send({ status: "DRAFT" })
      .expect(400);

    // An admin tries to change it to VALIDATED but fails.
    const adminJwt = generateJwt(
      createConventionMagicLinkPayload(conventionId, "admin", "admin@if.fr"),
    );
    await request
      .post(`/auth/${updateConventionStatusRoute}/${adminJwt}`)
      .send({ status: "VALIDATED" })
      .expect(400);
  });

  it("Returns error 403 for unauthorized requests", async () => {
    // An establishment tries to validate the application, but fails.
    const establishmentJwt = generateJwt(
      createConventionMagicLinkPayload(
        conventionId,
        "establishment",
        convention.mentorEmail,
      ),
    );
    await request
      .post(`/auth/${updateConventionStatusRoute}/${establishmentJwt}`)
      .send({ status: "VALIDATED" })
      .expect(403);
  });

  it("Returns error 404 for unknown application ids", async () => {
    const jwt = generateJwt(
      createConventionMagicLinkPayload(
        "unknown_application_id",
        "counsellor",
        "counsellor@pe.fr",
      ),
    );
    await request
      .post(`/auth/${updateConventionStatusRoute}/${jwt}`)
      .send({ status: "ACCEPTED_BY_COUNSELLOR" })
      .expect(404); // Not found
  });
});
