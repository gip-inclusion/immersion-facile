import {
  FormCompletionRoutes,
  expectHttpResponseToEqual,
  formCompletionRoutes,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../../../secondary/offer/EstablishmentBuilders";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("route to check if a form's siret already exists", () => {
  let httpClient: HttpClient<FormCompletionRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  const siret = "11111111111111";

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, inMemoryUow } = await buildTestApp());
    httpClient = createSupertestSharedClient(formCompletionRoutes, request);
  });

  it("Returns false if the siret does not exist", async () => {
    const response = await httpClient.isSiretAlreadySaved({
      urlParams: { siret: "11112222333344" },
    });
    expectHttpResponseToEqual(response, {
      status: 200,
      body: false,
    });
  });

  it("Returns true if the siret exists", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder().withSiret(siret).build(),
        )
        .build(),
    );

    const response = await httpClient.isSiretAlreadySaved({
      urlParams: { siret },
    });

    expectHttpResponseToEqual(response, {
      status: 200,
      body: true,
    });
  });
});
