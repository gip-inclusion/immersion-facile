import {
  ConnectedUserBuilder,
  type EstablishmentRoutes,
  errors,
  establishmentRoutes,
  expectHttpResponseToEqual,
  type FormEstablishmentUserRight,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/connectedUserAuthMiddleware";
import type { GenerateConnectedUserJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { createConnectedUserJwtPayload } from "../../../../utils/jwt";

describe("registerUserOnEstablishment", () => {
  describe(`${establishmentRoutes.registerUserOnEstablishment.method} ${establishmentRoutes.registerUserOnEstablishment.url} route`, () => {
    let inMemoryUow: InMemoryUnitOfWork;
    let sharedRequest: HttpClient<EstablishmentRoutes>;
    let generateConnectedUserJwt: GenerateConnectedUserJwt;

    const connectedUserToRegister = new ConnectedUserBuilder().build();
    const connectedAdminUser = new ConnectedUserBuilder()
      .withId("connected-admin-user")
      .build();
    const establishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("10000000000000")
      .withUserRights([
        {
          userId: connectedAdminUser.id,
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
        establishmentAggregate,
      ];
      inMemoryUow.userRepository.users = [
        connectedUserToRegister,
        connectedAdminUser,
      ];
    });

    describe("Wrong paths", () => {
      it("401 - returns 401 when user is not connected", async () => {
        expectHttpResponseToEqual(
          await sharedRequest.registerUserOnEstablishment({
            headers: {
              authorization: "Bearer invalid-token",
            },
            urlParams: { siret: establishmentAggregate.establishment.siret },
            body: {
              email: "ploumanach@breizh.bzh",
              role: "establishment-contact",
              status: "PENDING",
              shouldReceiveDiscussionNotifications: true,
              job: "crêpier",
              phone: "+33600000000",
              isMainContactByPhone: false,
            },
          }),
          { status: 401, body: { status: 401, message: invalidTokenMessage } },
        );
      });

      it("403 - returns 403 when user request registration for a different email", async () => {
        const result = await sharedRequest.registerUserOnEstablishment({
          headers: {
            authorization: generateConnectedUserJwt(
              createConnectedUserJwtPayload({
                userId: connectedUserToRegister.id,
                durationHours: 1,
                now: new Date(),
              }),
            ),
          },
          body: {
            email: "different-email@example.com",
            role: "establishment-contact",
            status: "ACCEPTED",
            shouldReceiveDiscussionNotifications: true,
            job: "crêpier",
            phone: "+33600000000",
            isMainContactByPhone: false,
          },
          urlParams: { siret: establishmentAggregate.establishment.siret },
        });

        expectHttpResponseToEqual(result, {
          status: 403,
          body: {
            status: 403,
            message: errors.user.forbiddenEmailUpdate().message,
          },
        });
      });
      it("404 - returns 404 when requested establishment is not found", async () => {
        const nonExistingSiret = "99999999999999";
        const result = await sharedRequest.registerUserOnEstablishment({
          headers: {
            authorization: generateConnectedUserJwt(
              createConnectedUserJwtPayload({
                userId: connectedUserToRegister.id,
                durationHours: 1,
                now: new Date(),
              }),
            ),
          },
          body: {
            email: connectedUserToRegister.email,
            role: "establishment-contact",
            status: "PENDING",
            shouldReceiveDiscussionNotifications: true,
            job: "crêpier",
            phone: "+33600000000",
            isMainContactByPhone: false,
          },
          urlParams: { siret: nonExistingSiret },
        });

        expectHttpResponseToEqual(result, {
          status: 404,
          body: {
            status: 404,
            message: errors.establishment.notFound({ siret: nonExistingSiret })
              .message,
          },
        });
      });
    });

    describe("Right paths", () => {
      it("201 - returns empty response body", async () => {
        const formEstablishmentUserRight: FormEstablishmentUserRight = {
          email: connectedUserToRegister.email,
          role: "establishment-contact",
          status: "PENDING",
          shouldReceiveDiscussionNotifications: true,
          job: "crêpier",
          phone: "+33600000000",
          isMainContactByPhone: false,
        };

        const result = await sharedRequest.registerUserOnEstablishment({
          headers: {
            authorization: generateConnectedUserJwt(
              createConnectedUserJwtPayload({
                userId: connectedUserToRegister.id,
                durationHours: 1,
                now: new Date(),
              }),
            ),
          },
          body: formEstablishmentUserRight,
          urlParams: { siret: establishmentAggregate.establishment.siret },
        });

        expectHttpResponseToEqual(result, {
          status: 201,
          body: "",
        });
      });
    });
  });
});
