import {
  EstablishmentRoutes,
  UserBuilder,
  displayRouteName,
  establishmentRoutes,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("Route to generate an establishment edition link", () => {
  let httpClient: HttpClient<EstablishmentRoutes>;
  const user = new UserBuilder().build();
  const establishment = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        userId: user.id,
        job: "",
        phone: "",
      },
    ])
    .build();

  beforeEach(async () => {
    const { request, inMemoryUow } = await buildTestApp();

    httpClient = createSupertestSharedClient(establishmentRoutes, request);

    inMemoryUow.userRepository.users = [user];
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
  });

  it(`${displayRouteName(
    establishmentRoutes.requestEmailToUpdateFormRoute,
  )} 201 - confirm edit link was sent`, async () => {
    const response = await httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret: establishment.establishment.siret },
    });

    expectHttpResponseToEqual(response, { body: "", status: 201 });
  });
});
