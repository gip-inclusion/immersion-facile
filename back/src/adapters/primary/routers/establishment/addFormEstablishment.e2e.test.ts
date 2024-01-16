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
import { buildTestApp, InMemoryGateways } from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  outdatedApiConsumer,
  unauthorizedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("Add form establishment", () => {
  let request: SuperTest<Test>;
  let httpClient: HttpClient<EstablishmentRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;

  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;

  beforeEach(async () => {
    ({ request, inMemoryUow, gateways, eventCrawler } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
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
});
