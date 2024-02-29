import {
  EstablishmentRoutes,
  displayRouteName,
  establishmentRoutes,
  expectHttpResponseToEqual,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
} from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { buildTestApp } from "../../../../utils/buildTestApp";

describe("Route to generate an establishment edition link", () => {
  const siret = "11111111111111";
  let httpClient: HttpClient<EstablishmentRoutes>;

  beforeEach(async () => {
    const { request, inMemoryUow } = await buildTestApp();

    httpClient = createSupertestSharedClient(establishmentRoutes, request);
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContact(
          new ContactEntityBuilder().withEmail("erik@gmail.com").build(),
        )
        .build(),
    ];
  });

  it(`${displayRouteName(
    establishmentRoutes.requestEmailToUpdateFormRoute,
  )} 201 - confirm edit link was sent`, async () => {
    const response = await httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret },
    });

    expectHttpResponseToEqual(response, { body: "", status: 201 });
  });

  it(`${displayRouteName(
    establishmentRoutes.requestEmailToUpdateFormRoute,
  )} 400 with an error message if previous edit link for this siret has not yet expired`, async () => {
    // Prepare
    // first query of modification link
    await httpClient.requestEmailToUpdateFormRoute({ urlParams: { siret } });

    // second query soon after which should fail
    const response = await httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret },
    });

    expectHttpResponseToEqual(response, {
      body: {
        errors:
          "Un email a déjà été envoyé au contact référent de l'établissement le 01/09/2021",
      },
      status: 400,
    });
  });
});
