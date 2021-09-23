import { validateDemandeRoute } from "./../../shared/routes";
import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { demandesImmersionRoute } from "../../shared/routes";
import { DemandeImmersionDtoBuilder } from "../../_testBuilders/DemandeImmersionDtoBuilder";
import { FeatureFlagsBuilder } from "../../_testBuilders/FeatureFlagsBuilder";

describe("/demandes-immersion route", () => {
  let request: SuperTest<Test>;

  describe("Backoffice", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: new FeatureFlagsBuilder()
            .enableViewableApplications()
            .enableGenericApplicationForm()
            .build(),
        }),
      );
    });

    describe("Application validation", () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();

      beforeEach(async () => {
        // POST a valid application.
        await request
          .post(`/${demandesImmersionRoute}`)
          .send(demandeImmersion)
          .expect("Content-Type", /json/)
          .expect(200, { id: demandeImmersion.id });
      });

      it("Validating an existing application succeeds, with auth", async () => {
        // Validating an application with existing id succeeds (with auth).
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, { id: demandeImmersion.id });

        const validatedDemandeImmersion = {
          ...demandeImmersion,
          status: "VALIDATED",
        };

        // Getting the application succeeds and shows that it's validated.
        await request
          .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
          .expect("Content-Type", /json/)
          .expect(200, validatedDemandeImmersion);
      });

      it("Validating applications without credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });

      it("Validating applications with invalid credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .auth("not real user", "not real password")
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });

      it("Validating non-existent application with valid credentials fails with 404", async () => {
        await request
          .get(`/${validateDemandeRoute}/unknown-demande-immersion-id`)
          .auth("e2e_tests", "e2e")
          .expect(404);

        // Getting the existing application succeeds and shows that it's NOT validated.
        await request
          .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });
    });
  });

  describe("DEV environment", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: new FeatureFlagsBuilder()
            .enableViewableApplications()
            .enableGenericApplicationForm()
            .build(),
        }),
      );
    });

    it("Creating an invalid application fails", async () => {
      await request
        .post(`/${demandesImmersionRoute}`)
        .send({ invalid_params: true })
        .expect(400);
    });

    it("Creating a valid application succeeds", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // GET /demandes-immersion returns an empty list.
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200, []);

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // GETting the created application succeeds.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect("Content-Type", /json/)
        .expect(200, demandeImmersion);
    });

    it("Creating an application with invalid sources fails with 404 Not Found", async () => {
      const application1 = new DemandeImmersionDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(application1)
        .expect(404);

      const application2 = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(application2)
        .expect(404);
    });

    it("Updating an existing application succeeds", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing an updated application to the same id succeeds.
      const updatedDemandeImmersion = {
        ...demandeImmersion,
        email: "new@email.fr",
      };
      await request
        .post(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .send(updatedDemandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // GETting the updated application succeeds.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect("Content-Type", /json/)
        .expect(200, updatedDemandeImmersion);
    });

    it("Fetching unknown application IDs fails with 404 Not Found", async () => {
      await request
        .get(`/${demandesImmersionRoute}/unknown-demande-immersion-id`)
        .expect(404);
    });

    it("Updating an unknown application IDs fails with 404 Not Found", async () => {
      const unknownId = "unknown-demande-immersion-id";
      const demandeImmersionWithUnknownId = new DemandeImmersionDtoBuilder()
        .withId(unknownId)
        .build();
      await request
        .post(`/${demandesImmersionRoute}/${unknownId}`)
        .send(demandeImmersionWithUnknownId)
        .expect(404);
    });

    it("Creating an application with an existing ID fails with 409 Conflict", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing a another valid application with the same ID fails.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(409);
    });

    it("Listing applications without credentials fails with 401 Unauthorized", async () => {
      await request.get(`/${demandesImmersionRoute}`).expect(401);
    });

    it("Listing applications with invalid credentials fails with 401 Unauthorized", async () => {
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("not real user", "not real password")
        .expect(401);
    });

    it("Listing applications with valid credentials succeeds", async () => {
      // GET /demandes-immersion succeeds with login/pass.
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("BETA environment", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: new FeatureFlagsBuilder()
            .enableBoulogneSurMerApplicationForm()
            .enableNarbonneApplicationForm()
            .build(),
        }),
      );
    });

    it("Creating an application with valid sources succeeds", async () => {
      const application1 = new DemandeImmersionDtoBuilder()
        .withId("id1")
        .withSource("BOULOGNE_SUR_MER")
        .build();
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(application1)
        .expect(200, { id: "id1" });

      const application2 = new DemandeImmersionDtoBuilder()
        .withId("id2")
        .withSource("NARBONNE")
        .build();
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(application2)
        .expect(200, { id: "id2" });
    });

    it("Creating an application with invalid sources fails with 404 Not Found", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder()
        .withSource("GENERIC")
        .build();
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect(404);
    });

    it("Listing applications fails with 404 Not Found despite valid credentials", async () => {
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Geting an existing application succeeds", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // GETting the created application succeeds.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect(200, demandeImmersion);
    });

    it("Updating an existing application fails with 404 Not Found", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // POSTing a valid application returns 404 Not Found.
      await request
        .post(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(404);
    });
  });
});
