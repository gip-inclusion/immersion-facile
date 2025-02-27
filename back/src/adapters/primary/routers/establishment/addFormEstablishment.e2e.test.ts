import {
  AdminFormEstablishmentUserRight,
  type EstablishmentRoutes,
  FormEstablishmentDtoBuilder,
  InclusionConnectedUserBuilder,
  createInclusionConnectJwtPayload,
  defaultValidFormEstablishment,
  displayRouteName,
  establishmentRoutes,
  expectHttpResponseToEqual,
  expectToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import { v4 as uuid } from "uuid";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  outdatedApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import type { BasicEventCrawler } from "../../../../domains/core/events/adapters/EventCrawlerImplementations";
import { GenerateInclusionConnectJwt } from "../../../../domains/core/jwt";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import type { EstablishmentLead } from "../../../../domains/establishment/entities/EstablishmentLeadEntity";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";
import { processEventsForEmailToBeSent } from "../../../../utils/processEventsForEmailToBeSent";

describe("Add form establishment", () => {
  let request: SuperTest<Test>;
  let httpClient: HttpClient<EstablishmentRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;

  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;

  const user = new InclusionConnectedUserBuilder().withId(uuid()).buildUser();

  beforeEach(async () => {
    ({
      request,
      inMemoryUow,
      gateways,
      eventCrawler,
      generateInclusionConnectJwt,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorizedApiConsumer,
      outdatedApiConsumer,
    ];
    inMemoryUow.userRepository.users = [user];
  });

  describe(`${displayRouteName(
    establishmentRoutes.addFormEstablishment,
  )} Route to post form establishments from front (hence, without API key)`, () => {
    beforeEach(() => {
      gateways.addressApi.setNextLookupStreetAndAddresses([
        [
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
        ],
      ]);

      inMemoryUow.romeRepository.appellations =
        defaultValidFormEstablishment.appellations;
    });

    it(`${displayRouteName(
      establishmentRoutes.addFormEstablishment,
    )} 200 Check if email notification has been sent and published after FormEstablishment added`, async () => {
      const adminFormRight: AdminFormEstablishmentUserRight = {
        role: "establishment-admin",
        email: "mail@mail.com",
        job: "osef",
        phone: "+33600000000",
      };

      const response = await httpClient.addFormEstablishment({
        body: FormEstablishmentDtoBuilder.valid()
          .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
          .withFormUserRights([adminFormRight])
          .build(),
        headers: {
          authorization: generateInclusionConnectJwt(
            createInclusionConnectJwtPayload({
              userId: user.id,
              durationDays: 1,
              now: new Date(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });

      await processEventsForEmailToBeSent(eventCrawler);

      expectToEqual(
        gateways.notification.getSentEmails().map((e) => e.recipients),
        [[adminFormRight.email]],
      );
    });

    it(`${displayRouteName(
      establishmentRoutes.addFormEstablishment,
    )} 200 update EstablishmentLead kind`, async () => {
      const formEstablishment = FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
        .build();
      const establishmentLead: EstablishmentLead = {
        lastEventKind: "to-be-reminded",
        siret: formEstablishment.siret,
        events: [
          {
            kind: "to-be-reminded",
            occurredAt: gateways.timeGateway.now(),
            conventionId: "11111111-1111-4111-1111-111111111111",
          },
        ],
      };

      inMemoryUow.establishmentLeadRepository.establishmentLeads = [
        establishmentLead,
      ];
      expect(
        (
          await inMemoryUow.establishmentLeadRepository.getBySiret(
            formEstablishment.siret,
          )
        )?.lastEventKind,
      ).toBe("to-be-reminded");

      const response = await httpClient.addFormEstablishment({
        body: formEstablishment,
        headers: {
          authorization: generateInclusionConnectJwt(
            createInclusionConnectJwtPayload({
              userId: user.id,
              durationDays: 1,
              now: new Date(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });

      await processEventsForEmailToBeSent(eventCrawler);

      expectToEqual(
        await inMemoryUow.establishmentLeadRepository.getBySiret(
          formEstablishment.siret,
        ),
        {
          lastEventKind: "registration-accepted",
          siret: formEstablishment.siret,
          events: [
            {
              kind: "to-be-reminded",
              occurredAt: gateways.timeGateway.now(),
              conventionId: "11111111-1111-4111-1111-111111111111",
            },
            {
              kind: "registration-accepted",
              occurredAt: gateways.timeGateway.now(),
            },
          ],
        },
      );
    });
  });
});
