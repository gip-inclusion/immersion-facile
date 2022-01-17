import {
  currentJwtVersion,
  emailHashForMagicLink,
} from "./../../shared/tokens/MagicLinkPayload";
import supertest, { SuperTest, Test } from "supertest";
import { AppConfig } from "../../adapters/primary/appConfig";
import { createApp } from "../../adapters/primary/server";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import {
  immersionApplicationsRoute,
  updateApplicationStatusRoute,
  validateDemandeRoute,
} from "../../shared/routes";
import {
  createMagicLinkPayload,
  Role,
} from "../../shared/tokens/MagicLinkPayload";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { GenerateMagicLinkJwt } from "../../domain/auth/jwt";

let request: SuperTest<Test>;
let generateJwt: GenerateMagicLinkJwt;

const initializeSystemUnderTest = async (config: AppConfig) => {
  const { app } = await createApp(config);
  request = supertest(app);
  generateJwt = makeGenerateJwt(config);
};

describe("/demandes-immersion route", () => {
  describe("Backoffice", () => {
    beforeEach(async () => {
      await initializeSystemUnderTest(new AppConfigBuilder().build());
    });

    describe("Application validation", () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();

      beforeEach(async () => {
        // POST a valid application.
        await request
          .post(`/${immersionApplicationsRoute}`)
          .send(immersionApplication)
          .expect(200, { id: immersionApplication.id });
      });

      it("Validating an existing application succeeds, with auth", async () => {
        // Validating an application with existing id succeeds (with auth).
        await request
          .get(`/${validateDemandeRoute}/${immersionApplication.id}`)
          .auth("e2e_tests", "e2e")
          .expect(200, { id: immersionApplication.id });

        const validatedImmersionApplication = {
          ...immersionApplication,
          status: "VALIDATED",
        };

        // Getting the application succeeds and shows that it's validated.
        await request
          .get(
            `/admin/${immersionApplicationsRoute}/${immersionApplication.id}`,
          )
          .auth("e2e_tests", "e2e")
          .expect(200, validatedImmersionApplication);
      });

      it("Validating applications without credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateDemandeRoute}/${immersionApplication.id}`)
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(
            `/admin/${immersionApplicationsRoute}/${immersionApplication.id}`,
          )
          .auth("e2e_tests", "e2e")
          .expect(200, immersionApplication);
      });

      it("Validating applications with invalid credentials fails with 403 Forbidden", async () => {
        await request
          .get(`/${validateDemandeRoute}/${immersionApplication.id}`)
          .auth("not real user", "not real password")
          .expect(403);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(
            `/admin/${immersionApplicationsRoute}/${immersionApplication.id}`,
          )
          .auth("e2e_tests", "e2e")
          .expect(200, immersionApplication);
      });

      it("Validating non-existent application with valid credentials fails with 404", async () => {
        await request
          .get(`/${validateDemandeRoute}/unknown-demande-immersion-id`)
          .auth("e2e_tests", "e2e")
          .expect(404);

        // Getting the existing application succeeds and shows that it's NOT validated.
        await request
          .get(
            `/admin/${immersionApplicationsRoute}/${immersionApplication.id}`,
          )
          .auth("e2e_tests", "e2e")
          .expect(200, immersionApplication);
      });
    });
  });

  describe("DEV environment", () => {
    beforeEach(async () => {
      await initializeSystemUnderTest(new AppConfigBuilder().build());
    });

    it("Creating an invalid application fails", async () => {
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send({ invalid_params: true })
        .expect(400);
    });

    it("Creating a valid application succeeds", async () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder().build();

      // GET /demandes-immersion returns an empty list.
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(200, []);

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(immersionApplication)
        .expect(200, { id: immersionApplication.id });

      // GETting the created application succeeds.
      await request
        .get(`/admin/${immersionApplicationsRoute}/${immersionApplication.id}`)
        .auth("e2e_tests", "e2e")
        .expect(200, immersionApplication);
    });

    describe("Getting an application", () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder().build();

      beforeEach(async () => {
        // GET /demandes-immersion returns an empty list.
        await request
          .get(`/${immersionApplicationsRoute}`)
          .auth("e2e_tests", "e2e")
          .expect(200, []);

        // POSTing a valid application succeeds.
        await request
          .post(`/${immersionApplicationsRoute}`)
          .send(immersionApplication)
          .expect(200, { id: immersionApplication.id });
      });

      it("succeeds with correct magic link", async () => {
        const payload = {
          applicationId: immersionApplication.id,
          role: "beneficiary" as Role,
          emailHash: emailHashForMagicLink(immersionApplication.email),
          iat: Math.round(Date.now() / 1000),
          exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
          version: currentJwtVersion,
        };
        const jwt = generateJwt(payload);

        // GETting the created application succeeds.
        await request
          .get(`/auth/${immersionApplicationsRoute}/${jwt}`)
          .expect(200, immersionApplication);
      });

      it("redirects expired magic links to a renewal page", async () => {
        const payload = createMagicLinkPayload(
          immersionApplication.id,
          "beneficiary",
          immersionApplication.email,
          1,
          undefined,
          undefined,
          Math.round(Date.now() / 1000) - 2 * 24 * 3600,
        );
        const jwt = generateJwt(payload);

        // GETting the created application 403's and sets needsNewMagicLink flag to inform the front end to go to the link renewal page.
        await request
          .get(`/auth/${immersionApplicationsRoute}/${jwt}`)
          .expect(403, {
            message: "Le lien magique est périmé",
            needsNewMagicLink: true,
          });
      });
    });

    it("Updating an existing application succeeds", async () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(immersionApplication)
        .expect(200, { id: immersionApplication.id });

      // POSTing an updated application to the same id succeeds.
      const updatedImmersionApplication = {
        ...immersionApplication,
        email: "new@email.fr",
      };

      const link = generateJwt(
        createMagicLinkPayload(
          immersionApplication.id,
          "beneficiary",
          immersionApplication.email,
        ),
      );

      await request
        .post(`/auth/${immersionApplicationsRoute}/${link}`)
        .send(updatedImmersionApplication)
        .expect(200);

      // GETting the updated application succeeds.
      await request
        .get(`/admin/${immersionApplicationsRoute}/${immersionApplication.id}`)
        .auth("e2e_tests", "e2e")
        .expect(200, updatedImmersionApplication);
    });

    it("Fetching unknown application IDs fails with 404 Not Found", async () => {
      const link = generateJwt(
        createMagicLinkPayload(
          "unknown-demande-immersion-id",
          "beneficiary",
          "some email",
        ),
      );
      await request.get(`/${immersionApplicationsRoute}/${link}`).expect(404);

      await request
        .get(
          `/admin/${immersionApplicationsRoute}/unknown-demande-immersion-id`,
        )
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Updating an unknown application IDs fails with 404 Not Found", async () => {
      const unknownId = "unknown-demande-immersion-id";
      const immersionApplicationWithUnknownId =
        new ImmersionApplicationDtoBuilder().withId(unknownId).build();

      const link = generateJwt(
        createMagicLinkPayload(unknownId, "beneficiary", "some email"),
      );

      await request
        .post(`/${immersionApplicationsRoute}/${link}`)
        .send(immersionApplicationWithUnknownId)
        .expect(404);
    });

    it("Creating an application with an existing ID fails with 409 Conflict", async () => {
      const immersionApplication = new ImmersionApplicationDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(immersionApplication)
        .expect(200, { id: immersionApplication.id });

      // POSTing a another valid application with the same ID fails.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send({
          ...immersionApplication,
          email: "another@email.fr",
        })
        .expect(409);
    });

    it("Listing applications without credentials fails with 401 Unauthorized", async () => {
      await request.get(`/${immersionApplicationsRoute}`).expect(401);
    });

    it("Listing applications with invalid credentials fails with 403 Forbidden", async () => {
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("not real user", "not real password")
        .expect(403);
    });

    it("Listing applications with valid credentials succeeds", async () => {
      // GET /demandes-immersion succeeds with login/pass.
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(200);
    });
  });
});

describe("/update-application-status route", () => {
  beforeEach(async () => {
    await initializeSystemUnderTest(new AppConfigBuilder().build());
  });

  test("Succeeds for fully validated applications", async () => {
    // A beneficiary creates a new application in state IN_REVIEW.
    const application = new ImmersionApplicationDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();
    await request
      .post(`/${immersionApplicationsRoute}`)
      .send(application)
      .expect(200);

    // A counsellor accepts the application.
    const counsellorJwt = generateJwt(
      createMagicLinkPayload(
        application.id,
        "counsellor",
        "councellor@poleemploi.fr",
      ),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${counsellorJwt}`)
      .send({ status: "ACCEPTED_BY_COUNSELLOR" })
      .expect(200);

    // A validator accepts the application.
    const validatorJwt = generateJwt(
      createMagicLinkPayload(
        application.id,
        "validator",
        "validator@poleemploi.fr",
      ),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${validatorJwt}`)
      .send({ status: "ACCEPTED_BY_VALIDATOR" })
      .expect(200);

    // An admin validates the application.
    const adminJwt = generateJwt(
      createMagicLinkPayload(application.id, "admin", "admin@if.fr"),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${adminJwt}`)
      .send({ status: "VALIDATED" })
      .expect(200);
  });

  test("Succeeds for rejected application", async () => {
    // A beneficiary creates a new application in state IN_REVIEW.
    const application = new ImmersionApplicationDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();
    await request
      .post(`/${immersionApplicationsRoute}`)
      .send(application)
      .expect(200);

    // A counsellor rejects the application.
    const counsellorJwt = generateJwt(
      createMagicLinkPayload(application.id, "counsellor", "counsellor@pe.fr"),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${counsellorJwt}`)
      .send({ status: "REJECTED", justification: "test-justification" })
      .expect(200);
  });

  // Skip: Currently no configuration returns 400. Reenable this test if one is added.
  xtest("Returns error 400 for invalid requests", async () => {
    // A beneficiary creates a new application in state IN_REVIEW.
    const application = new ImmersionApplicationDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();
    await request
      .post(`/${immersionApplicationsRoute}`)
      .send(application)
      .expect(200);

    // An establishment tries to change it to DRAFT but fails.
    const establishmentJwt = generateJwt(
      createMagicLinkPayload(
        application.id,
        "establishment",
        application.mentorEmail,
      ),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${establishmentJwt}`)
      .send({ status: "DRAFT" })
      .expect(400);

    // An admin tries to change it to VALIDATED but fails.
    const adminJwt = generateJwt(
      createMagicLinkPayload(application.id, "admin", "admin@if.fr"),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${adminJwt}`)
      .send({ status: "VALIDATED" })
      .expect(400);
  });

  test("Returns error 403 for unauthorized requests", async () => {
    // A beneficiary creates a new application in state IN_REVIEW.
    const application = new ImmersionApplicationDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();
    await request
      .post(`/${immersionApplicationsRoute}`)
      .send(application)
      .expect(200);

    // An establishment tries to validate the application, but fails.
    const establishmentJwt = generateJwt(
      createMagicLinkPayload(
        application.id,
        "establishment",
        application.mentorEmail,
      ),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${establishmentJwt}`)
      .send({ status: "VALIDATED" })
      .expect(403);
  });

  test("Returns error 404 for unknown application ids", async () => {
    const jwt = generateJwt(
      createMagicLinkPayload(
        "unknown_application_id",
        "counsellor",
        "counsellor@pe.fr",
      ),
    );
    await request
      .post(`/auth/${updateApplicationStatusRoute}/${jwt}`)
      .send({ status: "ACCEPTED_BY_COUNSELLOR" })
      .expect(404);
  });
});
