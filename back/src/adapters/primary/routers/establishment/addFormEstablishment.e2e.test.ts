import { SuperTest, Test } from "supertest";
import {
  defaultValidFormEstablishment,
  establishmentTargets,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { avenueChampsElysees } from "../../../../_testBuilders/addressDtos";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../_testBuilders/processEventsForEmailToBeSent";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  outdatedApiConsumer,
  unauthorisedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { FormEstablishmentDtoPublicV0 } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { FormEstablishmentDtoPublicV1 } from "../DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";

describe("Add form establishment", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateApiConsumerJwt, gateways, eventCrawler } =
      await buildTestApp());
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorisedApiConsumer,
      outdatedApiConsumer,
    ];
  });

  describe("Route to post form establishments from front (hence, without API key)", () => {
    // from front
    it("support posting valid establishment from front", async () => {
      inMemoryUow.romeRepository.appellations =
        defaultValidFormEstablishment.appellations;

      const formEstablishment = FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
        .build();

      const { status, body } = await request
        .post(establishmentTargets.addFormEstablishment.url)
        .send(formEstablishment);

      expectToEqual(status, 200);
      expectToEqual(body, "");
      expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
        formEstablishment,
      ]);
    });

    it("Check if email notification has been sent and published after FormEstablishment added", async () => {
      gateways.addressApi.setAddressAndPosition([
        {
          position: {
            lat: 48.8715,
            lon: 2.3019,
          },
          address: {
            city: "Paris",
            streetNumberAndAddress: "10 avenue des Champs Elysées",
            postcode: "75008",
            departmentCode: "75",
          },
        },
      ]);

      inMemoryUow.romeRepository.appellations =
        defaultValidFormEstablishment.appellations;

      const email = "tiredofthismess@seriously.com";

      const { body, status } = await request
        .post(establishmentTargets.addFormEstablishment.url)
        .send(
          FormEstablishmentDtoBuilder.valid()
            .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
            .withBusinessContactEmail(email)
            .build(),
        );

      expectToEqual(body, "");
      expectToEqual(status, 200);

      await processEventsForEmailToBeSent(eventCrawler);

      expectToEqual(
        gateways.notification.getSentEmails().map((e) => e.recipients),
        [[email]],
      );
    });
  });

  describe("Route to add an establishment form with API key (for exemple for un-jeune-une-solution)", () => {
    // from external
    describe("v0", () => {
      // we don't want to use variables from src/routes.ts so that we can check if contract breaks
      const formEstablishment = {
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
        siret: TEST_OPEN_ESTABLISHMENT_1.siret,
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
      } satisfies FormEstablishmentDtoPublicV0;

      it("forbids access to route if no api consumer", async () => {
        const { body, status } = await request
          .post(`/immersion-offers`)
          .send(formEstablishment);

        expectToEqual(body, { status: 403, message: "Accès refusé" });
        expectToEqual(status, 403);
      });

      it("support adding establishment from known api consumer", async () => {
        const { body, status } = await request
          .post(`/immersion-offers`)
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          )
          .send(formEstablishment);

        expectToEqual(body, "");
        expectToEqual(status, 200);
      });
    });

    describe("v1", () => {
      const consumerv1FormEstablishmentsRoute = `/v1/form-establishments`;

      it("forbids access to route if no api consumer", async () => {
        const { body, status } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .send({});

        expectToEqual(body, {
          error: "forbidden: unauthenticated",
        });
        expectToEqual(status, 401);
      });

      it("forbids access to route if invalid jwt", async () => {
        const { body, status } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .set("Authorization", "jwt-invalid")
          .send({});

        expectToEqual(body, {
          error: "forbidden: incorrect Jwt",
        });
        expectToEqual(status, 401);
      });

      it("forbids adding establishment from unauthorized api consumer", async () => {
        const { body, status } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .set("Authorization", generateApiConsumerJwt({ id: "my-unknown-id" }))
          .send({});

        expectToEqual(body, {
          error: "forbidden: consumer not found",
        });
        expectToEqual(status, 403);
      });

      it("forbids access to route if id is unauthorized", async () => {
        const { body, status } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: unauthorisedApiConsumer.id }),
          )
          .send({});

        expectToEqual(body, {
          error: "forbidden: consumer has not enough privileges",
        });
        expectToEqual(status, 403);
      });

      it("forbids access to route if token has expired", async () => {
        gateways.timeGateway.setNextDate(new Date());

        const { body, status } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .set(
            "Authorization",
            generateApiConsumerJwt({ id: outdatedApiConsumer.id }),
          )
          .send({});

        expectToEqual(body, {
          error: "forbidden: expired token",
        });
        expectToEqual(status, 403);
      });

      it("support adding establishment from known api consumer (for exemple Un Jeune Une Solution)", async () => {
        const { status, body } = await request
          .post(consumerv1FormEstablishmentsRoute)
          .set(
            "Authorization",
            generateApiConsumerJwt({
              id: authorizedUnJeuneUneSolutionApiConsumer.id,
            }),
          )
          .send({
            ...FormEstablishmentDtoBuilder.valid()
              .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
              .build(),
            isSearchable: true,
            businessAddress: avenueChampsElysees,
          } satisfies FormEstablishmentDtoPublicV1);

        expectToEqual(body, "");
        expectToEqual(status, 200);
      });
    });
  });
});
