import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  formEstablishmentsRoute,
} from "shared";
import { avenueChampsElysees } from "../../_testBuilders/addressDtos";
import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoPublicV0 } from "../../adapters/primary/routers/DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { FormEstablishmentDtoPublicV1 } from "../../adapters/primary/routers/DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/sirene/InMemorySireneGateway";

describe("Route to post form establishments from front (hence, without API key)", () => {
  // from front
  it("support posting valid establishment from front", async () => {
    const { request, inMemoryUow } = await buildTestApp();

    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();

    const response = await request
      .post(`/${formEstablishmentsRoute}`)
      .send(formEstablishment);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(formEstablishment.siret);

    const inRepo = await inMemoryUow.formEstablishmentRepository.getAll();
    expect(inRepo).toEqual([formEstablishment]);
  });

  it("Check if email notification has been sent and published after FormEstablishment added", async () => {
    const { eventCrawler, gateways, request }: TestAppAndDeps =
      await buildTestApp();

    const formEstablishment: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build();
    const formEstablishmentWithBusinessContact: FormEstablishmentDto = {
      ...formEstablishment,
      businessContact: {
        ...formEstablishment.businessContact,
        email: "tiredofthismess@seriously.com",
      },
    };

    const response = await request
      .post(`/${formEstablishmentsRoute}`)
      .send(formEstablishmentWithBusinessContact);

    expect(response.status).toBe(200);

    await eventCrawler.processNewEvents();

    const sentEmails = gateways.email.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails.map((e) => e.recipients)).toEqual([
      ["tiredofthismess@seriously.com"],
    ]);
  });
});

describe("Route to add an establishment form with API key (for exemple for un-jeune-une-solution)", () => {
  // from external
  describe("v0", () => {
    // we don't want to use variables from src/routes.ts so that we can check if contract breaks
    it("forbids access to route if no api consumer", async () => {
      const { request } = await buildTestApp();

      const response = await request.post(`/immersion-offers`).send({});

      expect(response.status).toBe(403);
    });

    it("support adding establishment from known api consumer", async () => {
      const { request, generateApiJwt } = await buildTestApp();

      const formEstablishmentDtoPublicV0: FormEstablishmentDtoPublicV0 = {
        businessAddress: "1 Rue du Moulin 12345 Quelque Part",
        businessContacts: [
          {
            email: "amil@mail.com",
            firstName: "Esteban",
            lastName: "Ocon",
            phone: "+33012345678",
            job: "a job",
          },
        ],
        preferredContactMethods: ["EMAIL"],
        naf: { code: "A", nomenclature: "nomenclature code A" },
        businessName: "Mon entreprise",
        businessNameCustomized: "Ma belle enseigne du quartier",
        isEngagedEnterprise: false,
        siret: TEST_ESTABLISHMENT1_SIRET,
        professions: [
          {
            romeCodeMetier: "A1111",
            romeCodeAppellation: "11111",
            description: "Boulangerie",
          },
          {
            romeCodeMetier: "B9112",
            romeCodeAppellation: "22222",
            description: "Patissier",
          },
          {
            romeCodeMetier: "D1103",
            romeCodeAppellation: undefined,
            description: "Boucherie",
          },
        ],
      };

      const jwt = generateApiJwt({ id: "my-authorized-id" });

      const response = await request
        .post(`/immersion-offers`)
        .set("Authorization", jwt)
        .send(formEstablishmentDtoPublicV0);

      expect(response.body).toBe(formEstablishmentDtoPublicV0.siret);
      expect(response.status).toBe(200);
    });
  });

  describe("v1", () => {
    it("forbids access to route if no api consumer", async () => {
      const { request } = await buildTestApp();
      const response = await request.post(`/v1/form-establishments`).send({});
      expect(response.body).toEqual({ error: "forbidden: unauthenticated" });
      expect(response.status).toBe(401);
    });

    it("forbids access to route if invalid jwt", async () => {
      const { request } = await buildTestApp();
      const response = await request
        .post(`/v1/form-establishments`)
        .set("Authorization", "jwt-invalid")
        .send({});
      expect(response.body).toEqual({ error: "forbidden: incorrect Jwt" });
      expect(response.status).toBe(401);
    });

    it("forbids adding establishment from unauthorized api consumer", async () => {
      const { request, generateApiJwt } = await buildTestApp();
      const jwt = generateApiJwt({ id: "my-unknown-id" });
      const response = await request
        .post(`/v1/form-establishments`)
        .set("Authorization", jwt)
        .send({});

      expect(response.body).toEqual({ error: "forbidden: consumer not found" });
      expect(response.status).toBe(403);
    });

    it("forbids access to route if id is unauthorized", async () => {
      const { request, generateApiJwt } = await buildTestApp();
      const jwt = generateApiJwt({ id: "my-unauthorized-id" });
      const response = await request
        .post(`/v1/form-establishments`)
        .set("Authorization", jwt)
        .send({});
      expect(response.body).toEqual({
        error: "forbidden: unauthorised consumer Id",
      });
      expect(response.status).toBe(403);
    });

    it("forbids access to route if token has expired", async () => {
      const { request, generateApiJwt } = await buildTestApp();
      const jwt = generateApiJwt({ id: "my-outdated-id" });
      const response = await request
        .post(`/v1/form-establishments`)
        .set("Authorization", jwt)
        .send({});
      expect(response.body).toEqual({
        error: "forbidden: expired token",
      });
      expect(response.status).toBe(403);
    });

    it("support adding establishment from known api consumer (for exemple Un Jeune Une Solution)", async () => {
      const { request, generateApiJwt } = await buildTestApp();
      const formEstablishmentDto = FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build();

      const formEstablishmentDtoPublicV1: FormEstablishmentDtoPublicV1 = {
        ...formEstablishmentDto,
        businessAddress: avenueChampsElysees,
      };

      const jwt = generateApiJwt({ id: "my-authorized-id" });

      const response = await request
        .post(`/v1/form-establishments`)
        .set("Authorization", jwt)
        .send(formEstablishmentDtoPublicV1);

      expect(response.status).toBe(200);
    });
  });
});
