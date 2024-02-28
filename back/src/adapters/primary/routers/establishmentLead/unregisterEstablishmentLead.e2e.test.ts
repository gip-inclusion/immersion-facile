import { subDays } from "date-fns";
import {
  ConventionDtoBuilder,
  ConventionJwt,
  EstablishmentLeadRoutes,
  createConventionMagicLinkPayload,
  displayRouteName,
  establishmentLeadRoutes,
  expectHttpResponseToEqual,
  expiredMagicLinkErrorMessage,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  outdatedApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { GenerateConventionJwt } from "../../../../domains/core/jwt";
import { EstablishmentLead } from "../../../../domains/offer/entities/EstablishmentLeadEntity";
import { buildTestApp } from "../../../../utils/buildTestApp";
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
  let httpClient: HttpClient<EstablishmentLeadRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateConventionJwt: GenerateConventionJwt;
  let conventionJwt: ConventionJwt;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateConventionJwt } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentLeadRoutes, request);
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
    establishmentLeadRoutes.unregisterEstablishmentLead,
  )}`, () => {
    it("204 - Success", async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: { authorization: conventionJwt },
        body: {},
      });

      expectHttpResponseToEqual(response, {
        body: {},
        status: 204,
      });
    });

    it(`${displayRouteName(
      establishmentLeadRoutes.unregisterEstablishmentLead,
    )} 400 - Bad Request`, async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: {} as any,
        body: {},
      });

      expectHttpResponseToEqual(response, {
        body: {
          issues: ["authorization : Required"],
          message:
            "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /establishment-lead/unregister",
          status: 400,
        },
        status: 400,
      });
    });

    it("401 - Jwt is malformed", async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: {
          authorization: "bad-jwt",
        },
        body: {},
      });

      expectHttpResponseToEqual(response, {
        body: { error: "Provided token is invalid" },
        status: 401,
      });
    });

    it(`${displayRouteName(
      establishmentLeadRoutes.unregisterEstablishmentLead,
    )} 403 - Jwt expired`, async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "establishment-representative",
              email: convention.signatories.establishmentRepresentative.email,
              now: new Date(),
              exp: Math.round((new Date().getTime() - 48 * 3600 * 1000) / 1000),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        body: {
          message: expiredMagicLinkErrorMessage,
          needsNewMagicLink: true,
        },
        status: 403,
      });
    });

    it(`${displayRouteName(
      establishmentLeadRoutes.unregisterEstablishmentLead,
    )} 404 - Convention not found`, async () => {
      const response = await httpClient.unregisterEstablishmentLead({
        headers: {
          authorization: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: "no-convention",
              role: "establishment-representative",
              email: "",
              now: new Date(),
            }),
          ),
        },
      });

      expectHttpResponseToEqual(response, {
        body: {
          errors: "No convention were found with id no-convention",
        },
        status: 404,
      });
    });
  });
});
