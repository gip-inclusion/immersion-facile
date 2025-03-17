import { addDays } from "date-fns";
import {
  type EstablishmentRoutes,
  type InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  UserBuilder,
  addressDtoToString,
  createInclusionConnectJwtPayload,
  currentJwtVersions,
  displayRouteName,
  errors,
  establishmentRoutes,
  expectHttpResponseToEqual,
  inclusionConnectTokenExpiredMessage,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type supertest from "supertest";
import { invalidTokenMessage } from "../../../../config/bootstrap/inclusionConnectAuthMiddleware";
import { rueSaintHonoreDto } from "../../../../domains/core/address/adapters/InMemoryAddressGateway";
import type { GenerateInclusionConnectJwt } from "../../../../domains/core/jwt";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import type { EstablishmentAdminRight } from "../../../../domains/establishment/entities/EstablishmentAggregate";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import {
  type InMemoryGateways,
  buildTestApp,
} from "../../../../utils/buildTestApp";

describe("Route to retrieve form establishment given an establishment JWT", () => {
  const backofficeAdminUser = new InclusionConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true)
    .buildUser();

  const backofficeAdminJwtPayload: InclusionConnectJwtPayload = {
    version: currentJwtVersions.inclusion,
    iat: new Date().getTime(),
    exp: addDays(new Date(), 30).getTime(),
    userId: backofficeAdminUser.id,
  };
  const establishmentAdmin = new UserBuilder()
    .withEmail("boss@mail.com")
    .withId("estab.admin")
    .build();
  const establishmentContact = new UserBuilder()
    .withEmail("contact@mail.com")
    .withId("estab.contact")
    .build();
  const establishmentAdminRight: EstablishmentAdminRight = {
    role: "establishment-admin",
    userId: establishmentAdmin.id,
    job: "job",
    phone: "+3366887744",
  };
  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
        .withSearchableBy({
          jobSeekers: true,
          students: false,
        })
        .withLocations([
          {
            address: rueSaintHonoreDto,
            position: {
              lat: 48.867,
              lon: 2.333,
            },
            id: "123",
          },
        ])
        .build(),
    )
    .withUserRights([
      establishmentAdminRight,
      {
        role: "establishment-contact",
        userId: establishmentContact.id,
      },
    ])
    .build();

  let httpClient: HttpClient<EstablishmentRoutes>;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    let request: supertest.SuperTest<supertest.Test>;
    ({ request, inMemoryUow, gateways, generateInclusionConnectJwt } =
      await buildTestApp());
    inMemoryUow.userRepository.users = [
      backofficeAdminUser,
      establishmentAdmin,
      establishmentContact,
    ];
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 200 Retrieves form establishment from aggregates when exists and authenticated with inclusion connect jwt`, async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );

    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateInclusionConnectJwt(
          createInclusionConnectJwtPayload({
            userId: establishmentAdmin.id,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
      urlParams: {
        siret: TEST_OPEN_ESTABLISHMENT_1.siret,
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        siret: establishmentAggregate.establishment.siret,
        source: "immersion-facile",
        website: establishmentAggregate.establishment.website,
        additionalInformation:
          establishmentAggregate.establishment.additionalInformation,
        businessName: establishmentAggregate.establishment.name,
        businessAddresses: establishmentAggregate.establishment.locations.map(
          (location) => ({
            rawAddress: addressDtoToString(location.address),
            id: location.id,
          }),
        ),
        naf: establishmentAggregate.establishment?.nafDto,
        fitForDisabledWorkers:
          establishmentAggregate.establishment.fitForDisabledWorkers,
        appellations: [
          {
            appellationCode: establishmentAggregate.offers[0].appellationCode,
            appellationLabel: establishmentAggregate.offers[0].appellationLabel,
            romeCode: establishmentAggregate.offers[0].romeCode,
            romeLabel: establishmentAggregate.offers[0].romeLabel,
          },
        ],
        maxContactsPerMonth:
          establishmentAggregate.establishment.maxContactsPerMonth,
        userRights: [
          {
            role: "establishment-admin",
            email: establishmentAdmin.email,
            job: establishmentAdminRight.job,
            phone: establishmentAdminRight.phone,
          },
          {
            role: "establishment-contact",
            email: establishmentContact.email,
          },
        ],
        contactMethod: establishmentAggregate.establishment.contactMethod,
        searchableBy: {
          jobSeekers: true,
          students: false,
        },
      },
      status: 200,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 200 Retrieves form establishment from aggregates when exists and authenticated with backoffice jwt`, async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregate(
      establishmentAggregate,
    );

    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
      },
      urlParams: { siret: TEST_OPEN_ESTABLISHMENT_1.siret },
    });

    expectHttpResponseToEqual(response, {
      body: {
        siret: establishmentAggregate.establishment.siret,
        source: "immersion-facile",
        website: establishmentAggregate.establishment.website,
        additionalInformation:
          establishmentAggregate.establishment.additionalInformation,
        businessName: establishmentAggregate.establishment.name,
        businessAddresses: [
          {
            id: establishmentAggregate.establishment.locations[0].id,
            rawAddress: addressDtoToString(
              establishmentAggregate.establishment.locations[0].address,
            ),
          },
        ],
        naf: establishmentAggregate.establishment?.nafDto,
        appellations: [
          {
            appellationCode: establishmentAggregate.offers[0].appellationCode,
            appellationLabel: establishmentAggregate.offers[0].appellationLabel,
            romeCode: establishmentAggregate.offers[0].romeCode,
            romeLabel: establishmentAggregate.offers[0].romeLabel,
          },
        ],
        fitForDisabledWorkers:
          establishmentAggregate.establishment.fitForDisabledWorkers,
        maxContactsPerMonth:
          establishmentAggregate.establishment.maxContactsPerMonth,
        userRights: [
          {
            role: "establishment-admin",
            email: establishmentAdmin.email,
            job: establishmentAdminRight.job,
            phone: establishmentAdminRight.phone,
          },
          {
            role: "establishment-contact",
            email: establishmentContact.email,
          },
        ],
        contactMethod: establishmentAggregate.establishment.contactMethod,
        searchableBy: establishmentAggregate.establishment.searchableBy,
      },
      status: 200,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 400 if missing establishment`, async () => {
    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
      },
      urlParams: {
        siret: TEST_OPEN_ESTABLISHMENT_1.siret,
      },
    });

    expectHttpResponseToEqual(response, {
      status: 404,
      body: {
        status: 404,
        message: errors.establishment.notFound({
          siret: TEST_OPEN_ESTABLISHMENT_1.siret,
        }).message,
      },
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 401 if not authenticated`, async () => {
    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: {} as any,
      },
      urlParams: {
        siret: "no-siret",
      },
    });

    expectHttpResponseToEqual(response, {
      status: 401,
      body: {
        status: 401,
        message: invalidTokenMessage,
      },
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 403 if token expired`, async () => {
    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateInclusionConnectJwt(
          createInclusionConnectJwtPayload({
            userId: establishmentAdmin.id,
            now: gateways.timeGateway.now(),
            durationDays: 1,
            exp:
              Math.round(gateways.timeGateway.now().getTime() / 1000) -
              2 * 24 * 3600,
          }),
        ),
      },
      urlParams: {
        siret: establishmentAggregate.establishment.siret,
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        message: inclusionConnectTokenExpiredMessage,
        status: 401,
      },
      status: 401,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 404 if missing establishment`, async () => {
    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateInclusionConnectJwt(backofficeAdminJwtPayload),
      },
      urlParams: {
        siret: TEST_OPEN_ESTABLISHMENT_1.siret,
      },
    });

    expectHttpResponseToEqual(response, {
      status: 404,
      body: {
        status: 404,
        message: errors.establishment.notFound({
          siret: TEST_OPEN_ESTABLISHMENT_1.siret,
        }).message,
      },
    });
  });
});
