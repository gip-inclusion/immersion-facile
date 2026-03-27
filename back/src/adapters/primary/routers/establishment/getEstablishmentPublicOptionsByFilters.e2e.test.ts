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
import type { EstablishmentUserRight } from "../../../../domains/establishment/entities/EstablishmentAggregate";
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
    const connectedUserRight: EstablishmentUserRight = {
      userId: connectedUser.id,
      role: "establishment-admin",
      status: "ACCEPTED",
      shouldReceiveDiscussionNotifications: true,
      job: "osef",
      phone: "osef",
      isMainContactByPhone: false,
    };
    const establishmentAggregateToKeepOnSiret =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000000")
        .withUserRights([connectedUserRight])
        .build();
    const establishmentAggregateToKeepOnName1 =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000001")
        .withEstablishmentName("La kig ha farz de la mère kergadec")
        .withUserRights([connectedUserRight])
        .build();
    const establishmentAggregateToKeepOnName2 =
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("10000000000002")
        .withEstablishmentName("La kig ha farz de la mère Plougelac'h")
        .withUserRights([connectedUserRight])
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

    it("200 - returns empty array when filters do not match any results", async () => {
      const result = await sharedRequest.getEstablishmentPublicOptionsByFilters(
        {
          queryParams: {
            nameIncludes: "not existing name",
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
        body: [],
      });
    });

    it("200 - returns the establishment public options with one filter by name", async () => {
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

    it("200 - returns the establishment public options with one filter by siret", async () => {
      const result = await sharedRequest.getEstablishmentPublicOptionsByFilters(
        {
          queryParams: {
            siret: establishmentAggregateToKeepOnName1.establishment.siret,
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

    it("200 - returns the establishment public options with name includes and siret filters", async () => {
      const result = await sharedRequest.getEstablishmentPublicOptionsByFilters(
        {
          queryParams: {
            nameIncludes: "La kig ha farz de la mère kergadec",
            siret: establishmentAggregateToKeepOnName1.establishment.siret,
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
