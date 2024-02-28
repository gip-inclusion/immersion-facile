import {
  EstablishmentRoutes,
  FormEstablishmentDtoBuilder,
  currentJwtVersions,
  displayRouteName,
  establishmentRoutes,
  expectHttpResponseToEqual,
  expectToEqual,
  expiredMagicLinkErrorMessage,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import {
  GenerateBackOfficeJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../../../domains/core/jwt";
import { establishmentNotFoundErrorMessage } from "../../../../domains/offer/ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../../../../domains/offer/ports/FormEstablishmentRepository";
import { buildTestApp } from "../../../../utils/buildTestApp";
import { EstablishmentAggregateBuilder } from "../../../secondary/offer/EstablishmentBuilders";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("Delete form establishment", () => {
  const establishmentAggregate = new EstablishmentAggregateBuilder().build();
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(establishmentAggregate.establishment.siret)
    .build();

  let httpClient: HttpClient<EstablishmentRoutes>;
  let uow: InMemoryUnitOfWork;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      inMemoryUow: uow,
      generateBackOfficeJwt,
      generateEditEstablishmentJwt,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
  });

  it(`${displayRouteName(
    establishmentRoutes.deleteEstablishment,
  )} 204 - Establishment Aggregate & Form deleted with back office JWT`, async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];
    uow.formEstablishmentRepository.setFormEstablishments([formEstablishment]);

    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {
        authorization: generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {},
      status: 204,
    });
    expectToEqual(
      uow.establishmentAggregateRepository.establishmentAggregates,
      [],
    );
    expectToEqual(await uow.formEstablishmentRepository.getAll(), []);
  });

  it(`${displayRouteName(
    establishmentRoutes.deleteEstablishment,
  )} 400 - Unauthenticated`, async () => {
    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {} as any,
    });

    expectHttpResponseToEqual(response, {
      body: {
        issues: ["authorization : Required"],
        message:
          "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: DELETE /form-establishments/:siret",
        status: 400,
      },
      status: 400,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.deleteEstablishment,
  )} 403 - Jwt expired`, async () => {
    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {
        authorization: generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
          exp: Math.round((new Date().getTime() - 48 * 3600 * 1000) / 1000),
        }),
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
    establishmentRoutes.deleteEstablishment,
  )} 403 - Access refused with edit establishment JWT`, async () => {
    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {
        authorization: generateEditEstablishmentJwt({
          siret: establishmentAggregate.establishment.siret,
          version: currentJwtVersions.establishment,
        }),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        errors: "Accès refusé",
      },
      status: 403,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.deleteEstablishment,
  )} 404 - Establishment Aggregate not found`, async () => {
    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {
        authorization: generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        errors: establishmentNotFoundErrorMessage(
          establishmentAggregate.establishment.siret,
        ),
      },
      status: 404,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.deleteEstablishment,
  )} 404 - Establishment Form not found`, async () => {
    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];

    const response = await httpClient.deleteEstablishment({
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
      headers: {
        authorization: generateBackOfficeJwt({
          role: "backOffice",
          sub: "",
          version: currentJwtVersions.backOffice,
        }),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        errors: formEstablishmentNotFoundErrorMessage(
          establishmentAggregate.establishment.siret,
        ),
      },
      status: 404,
    });
  });
});
