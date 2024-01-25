import supertest from "supertest";
import {
  addressDtoToString,
  createBackOfficeJwtPayload,
  createEstablishmentJwtPayload,
  displayRouteName,
  EstablishmentRoutes,
  establishmentRoutes,
  expectHttpResponseToEqual,
  expiredMagicLinkErrorMessage,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import {
  GenerateBackOfficeJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../../../domain/auth/jwt";
import { buildTestApp, InMemoryGateways } from "../../../../utils/buildTestApp";
import { rueSaintHonoreDto } from "../../../secondary/addressGateway/InMemoryAddressGateway";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { TEST_OPEN_ESTABLISHMENT_1 } from "../../../secondary/siret/InMemorySiretGateway";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

describe("Route to retrieve form establishment given an establishment JWT", () => {
  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
        .withAddress(rueSaintHonoreDto)
        .build(),
    )
    .build();

  let httpClient: HttpClient<EstablishmentRoutes>;
  let generateBackOfficeJwt: GenerateBackOfficeJwt;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    let request: supertest.SuperTest<supertest.Test>;
    ({
      request,
      inMemoryUow,
      gateways,
      generateBackOfficeJwt,
      generateEditEstablishmentJwt,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(establishmentRoutes, request);
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 200 Retrieves form establishment from aggregates when exists and authenticated with establishment jwt`, async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAggregate],
    );

    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_1.siret,
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
        businessAddress: addressDtoToString(
          establishmentAggregate.establishment.address,
        ),
        naf: establishmentAggregate.establishment?.nafDto,
        appellations: [
          {
            appellationCode: establishmentAggregate.offers[0].appellationCode,
            appellationLabel: establishmentAggregate.offers[0].appellationLabel,
            romeCode: establishmentAggregate.offers[0].romeCode,
            romeLabel: establishmentAggregate.offers[0].romeLabel,
          },
        ],
        maxContactsPerWeek:
          establishmentAggregate.establishment.maxContactsPerWeek,
        businessContact: establishmentAggregate.contact!,
        searchableBy: {
          jobSeekers: true,
          students: true,
        },
      },
      status: 200,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 200 Retrieves form establishment from aggregates when exists and authenticated with backoffice jwt`, async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAggregate],
    );

    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateBackOfficeJwt(
          createBackOfficeJwtPayload({
            durationDays: 1,
            now: new Date(),
          }),
        ),
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
        businessAddress: addressDtoToString(
          establishmentAggregate.establishment.address,
        ),
        naf: establishmentAggregate.establishment?.nafDto,
        appellations: [
          {
            appellationCode: establishmentAggregate.offers[0].appellationCode,
            appellationLabel: establishmentAggregate.offers[0].appellationLabel,
            romeCode: establishmentAggregate.offers[0].romeCode,
            romeLabel: establishmentAggregate.offers[0].romeLabel,
          },
        ],
        maxContactsPerWeek:
          establishmentAggregate.establishment.maxContactsPerWeek,
        businessContact: establishmentAggregate.contact!,
        searchableBy: {
          jobSeekers: true,
          students: true,
        },
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
        authorization: generateBackOfficeJwt(
          createBackOfficeJwtPayload({
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
        errors: "No establishment found with siret 12345678901234.",
      },
      status: 400,
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
      body: {
        error: "Provided token is invalid",
      },
      status: 401,
    });
  });

  it(`${displayRouteName(
    establishmentRoutes.getFormEstablishment,
  )} 403 if token expired`, async () => {
    const response = await httpClient.getFormEstablishment({
      body: {},
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: establishmentAggregate.establishment.siret,
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
        message: expiredMagicLinkErrorMessage,
        needsNewMagicLink: true,
      },
      status: 403,
    });
  });
});
