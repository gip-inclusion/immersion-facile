import {
  type AdminRoutes,
  adminRoutes,
  type BanEstablishmentPayload,
  ConnectedUserBuilder,
  type ConnectedUserJwt,
  currentJwtVersions,
  expectHttpResponseToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("banEstablishment", () => {
  let adminToken: ConnectedUserJwt;
  let nonAdminToken: ConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<AdminRoutes>;

  const bannedEstablishment: BanEstablishmentPayload = {
    siret: "12345678912345",
    establishmentBannishmentJustification: "Le cidre n'est pas breton",
  };

  beforeEach(async () => {
    const testApp = await buildTestApp();
    ({ inMemoryUow } = testApp);
    httpClient = createSupertestSharedClient(adminRoutes, testApp.request);

    const connectedNonAdminUser = new ConnectedUserBuilder()
      .withId("non-admin-user")
      .build();
    const connectedAdminUser = new ConnectedUserBuilder()
      .withId("admin-user")
      .withIsAdmin(true)
      .build();

    inMemoryUow.userRepository.users = [
      connectedAdminUser,
      connectedNonAdminUser,
    ];

    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [];

    nonAdminToken = testApp.generateConnectedUserJwt({
      version: currentJwtVersions.connectedUser,
      userId: "non-admin-user",
    });

    adminToken = testApp.generateConnectedUserJwt({
      userId: connectedAdminUser.id,
      version: currentJwtVersions.connectedUser,
    });
  });

  describe(`${adminRoutes.banEstablishment.method} ${adminRoutes.banEstablishment.url} route`, () => {
    describe("Wrong paths", () => {
      it("401 - returns 401 when missing token", async () => {
        const response = await httpClient.banEstablishment({
          headers: { authorization: "" },
          body: {
            siret: bannedEstablishment.siret,
            establishmentBannishmentJustification:
              bannedEstablishment.establishmentBannishmentJustification,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 401,
          body: {
            message: "Veuillez vous authentifier",
            status: 401,
          },
        });
      });
      it("403 - returns 403 when user is not admin", async () => {
        const response = await httpClient.banEstablishment({
          headers: { authorization: nonAdminToken },
          body: {
            siret: bannedEstablishment.siret,
            establishmentBannishmentJustification:
              bannedEstablishment.establishmentBannishmentJustification,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 403,
          body: {
            message:
              "L'utilisateur qui a l'identifiant \"non-admin-user\" n'a pas le droit d'accéder à cette ressource.",
            status: 403,
          },
        });
      });
    });

    describe("Right paths", () => {
      it("201 - returns 201 when establishment is successfully banned", async () => {
        const response = await httpClient.banEstablishment({
          headers: { authorization: adminToken },
          body: {
            siret: bannedEstablishment.siret,
            establishmentBannishmentJustification:
              bannedEstablishment.establishmentBannishmentJustification,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 201,
          body: "",
        });
      });
    });
  });
});
