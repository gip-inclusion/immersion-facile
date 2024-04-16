import { addDays } from "date-fns";
import {
  EstablishmentRoutes,
  FormEstablishmentDtoBuilder,
  InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
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
  GenerateEditFormEstablishmentJwt,
  GenerateInclusionConnectJwt,
} from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { establishmentNotFoundErrorMessage } from "../../../../domains/establishment/ports/EstablishmentAggregateRepository";
import { formEstablishmentNotFoundErrorMessage } from "../../../../domains/establishment/ports/FormEstablishmentRepository";
import { buildTestApp } from "../../../../utils/buildTestApp";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-user")
  .withIsAdmin(true)
  .build();

const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
  version: currentJwtVersions.inclusion,
  iat: new Date().getTime(),
  exp: addDays(new Date(), 30).getTime(),
  userId: backofficeAdminUser.id,
};

describe("Delete form establishment", () => {
  const establishmentAggregate = new EstablishmentAggregateBuilder().build();
  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(establishmentAggregate.establishment.siret)
    .build();

  let httpClient: HttpClient<EstablishmentRoutes>;
  let uow: InMemoryUnitOfWork;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({
      request,
      inMemoryUow: uow,
      generateEditEstablishmentJwt,
      generateInclusionConnectJwt,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
    ]);
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
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
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
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
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
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
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
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
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
