import { subDays } from "date-fns";
import { SuperTest, Test } from "supertest";
import {
  ConventionDtoBuilder,
  ConventionJwt,
  createConventionMagicLinkPayload,
  displayRouteName,
  EstablishmentRoutes,
  establishmentRoutes,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { GenerateConventionJwt } from "../../../../domain/auth/jwt";
import { EstablishmentLead } from "../../../../domain/offer/entities/EstablishmentLeadEntity";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  outdatedApiConsumer,
  unauthorizedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const convention = new ConventionDtoBuilder().build();
const alreadySavedLead: EstablishmentLead = {
  siret: convention.siret,
  lastEventKind: "reminder-sent",
  events: [
    {
      conventionId: convention.id,
      kind: "to-be-reminded",
      occurredAt: subDays(new Date(), 2),
    },
    {
      kind: "reminder-sent",
      occurredAt: new Date(),
      notification: { id: "my-fake-notification-id", kind: "email" },
    },
  ],
};

describe("Unregister establishment lead", () => {
  let request: SuperTest<Test>;
  let httpClient: HttpClient<EstablishmentRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateConventionJwt: GenerateConventionJwt;
  let conventionJwt: ConventionJwt;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateConventionJwt } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorizedApiConsumer,
      outdatedApiConsumer,
    ];
    inMemoryUow.conventionRepository.setConventions([convention]);
    inMemoryUow.establishmentLeadRepository.establishmentLeads = [
      alreadySavedLead,
    ];

    conventionJwt = generateConventionJwt(
      createConventionMagicLinkPayload({
        id: convention.id,
        role: "establishment-representative",
        email: convention.signatories.establishmentRepresentative.email,
        now: new Date(),
      }),
    );
  });

  describe(`${displayRouteName(
    establishmentRoutes.unregisterEstablishmentLead,
  )}`, () => {
    it("200 - Success", async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: { authorization: conventionJwt },
        body: {},
      });

      expectHttpResponseToEqual(response, {
        body: "",
        status: 200,
      });
    });
  });
});
