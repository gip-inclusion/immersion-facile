import {
  ConnectedUserBuilder,
  type EstablishmentRoutes,
  establishmentRoutes,
  expectHttpResponseToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { toEstablishmentPublicOption } from "../../../../domains/establishment/use-cases/GetEstablishmentPublicOptionsByFilters";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { createConnectedUserJwtPayload } from "../../../../utils/jwt";

describe("Get establishment public options by filters e2e", () => {
  describe(`${establishmentRoutes.getEstablishmentPublicOptionsByFilters.method} ${establishmentRoutes.getEstablishmentPublicOptionsByFilters.url} route`, () => {
    let inMemoryUow: InMemoryUnitOfWork;
    let sharedRequest: HttpClient<EstablishmentRoutes>;
    let generateConnectedUserJwt: GenerateConnectedUserJwt;

    const connectedUser = new ConnectedUserBuilder().build();
    const establishmentAggregateToKeepOnSiret =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000000")
        .withUserRights([
          {
            userId: connectedUser.id,
            role: "establishment-admin",
            status: "ACCEPTED",
            shouldReceiveDiscussionNotifications: true,
            job: "osef",
            phone: "osef",
            isMainContactByPhone: false,
          },
        ])
        .build();
    const establishmentAggregateToKeepOnName1 =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000001")
        .withEstablishmentName("La kig ha farz de la mère kergadec")
        .withUserRights([
          {
            userId: connectedUser.id,
            role: "establishment-admin",
            status: "ACCEPTED",
            shouldReceiveDiscussionNotifications: true,
            job: "osef",
            phone: "osef",
            isMainContactByPhone: false,
          },
        ])
        .build();
    const establishmentAggregateToKeepOnName2 =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000002")
        .withEstablishmentName("La kig ha farz de la mère Plougelac'h")
        .withUserRights([
          {
            userId: connectedUser.id,
            role: "establishment-admin",
            status: "ACCEPTED",
            shouldReceiveDiscussionNotifications: true,
            job: "osef",
            phone: "osef",
            isMainContactByPhone: false,
          },
        ])
        .build();

    beforeEach(async () => {
      const testAppAndDeps = await buildTestApp();
      ({ inMemoryUow, generateConnectedUserJwt } = testAppAndDeps);
      sharedRequest = createSupertestSharedClient(
        establishmentRoutes,
        testAppAndDeps.request,
      );
      inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregateToKeepOnSiret,
        establishmentAggregateToKeepOnName1,
        establishmentAggregateToKeepOnName2,
      ];
      inMemoryUow.userRepository.users = [connectedUser];
    });

    it("200 - returns the establishment public options by filters", async () => {
      const result = await sharedRequest.getEstablishmentPublicOptionsByFilters(
        {
          queryParams: {
            nameIncludes: "La kig ha farz de la mère kergadec",
          },
          headers: {
            authorization: generateConnectedUserJwt(
              createConnectedUserJwtPayload({
                userId: connectedUser.id,
                durationHours: 1,
                now: new Date(),
              }),
            ),
          },
        },
      );

      expectHttpResponseToEqual(result, {
        status: 200,
        body: [
          toEstablishmentPublicOption(establishmentAggregateToKeepOnName1),
        ],
      });
    });

    it("401 - returns 401 if user is not connected", async () => {
      const result = await sharedRequest.getEstablishmentPublicOptionsByFilters(
        {
          queryParams: {
            nameIncludes: "La kig ha farz de la mère kergadec",
          },
          headers: {
            authorization: "wrong-token",
          },
        },
      );
      expectHttpResponseToEqual(result, {
        body: { message: invalidTokenMessage, status: 401 },
        status: 401,
      });
    });
  });
});
