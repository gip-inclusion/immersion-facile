import { SuperTest, Test } from "supertest";
import {
  defaultValidFormEstablishment,
  displayRouteName,
  EstablishmentRoutes,
  establishmentRoutes,
  expectHttpResponseToEqual,
  expectToEqual,
  FormEstablishmentDtoBuilder,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
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
  unauthorizedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { FormEstablishmentDtoPublicV0 } from "../DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";

describe("Add form establishment", () => {
  let request: SuperTest<Test>;
  let httpClient: HttpClient<EstablishmentRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateApiConsumerJwt, gateways, eventCrawler } =
      await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
    await inMemoryUow.featureFlagRepository.update({
      flagName: "enableApiV0",
      flagContent: { isActive: true },
    });
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorizedApiConsumer,
      outdatedApiConsumer,
    ];
  });

  describe(`${displayRouteName(
    establishmentRoutes.addFormEstablishment,
  )} Route to post form establishments from front (hence, without API key)`, () => {
    // from front
    it(`${displayRouteName(
      establishmentRoutes.addFormEstablishment,
    )} 200 support posting valid establishment from front`, async () => {
      inMemoryUow.romeRepository.appellations =
        defaultValidFormEstablishment.appellations;

      const formEstablishment = FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
        .build();

      const response = await httpClient.addFormEstablishment({
        body: formEstablishment,
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });
      expectToEqual(await inMemoryUow.formEstablishmentRepository.getAll(), [
        formEstablishment,
      ]);
    });

    it(`${displayRouteName(
      establishmentRoutes.addFormEstablishment,
    )} 200 Check if email notification has been sent and published after FormEstablishment added`, async () => {
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

      const response = await httpClient.addFormEstablishment({
        body: FormEstablishmentDtoBuilder.valid()
          .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
          .withBusinessContactEmail(email)
          .build(),
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });

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

        expectToEqual(body, { errors: "Accès refusé" });
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
  });
});
