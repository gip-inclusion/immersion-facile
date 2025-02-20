import { addDays, millisecondsToSeconds, subYears } from "date-fns";
import {
  EstablishmentRoutes,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  InclusionConnectJwtPayload,
  InclusionConnectedUserBuilder,
  createEstablishmentJwtPayload,
  currentJwtVersions,
  errors,
  establishmentRoutes,
  expectArraysToMatch,
  expectHttpResponseToEqual,
  expectToEqual,
  expiredMagicLinkErrorMessage,
  updatedAddress1,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import supertest from "supertest";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import {
  GenerateEditFormEstablishmentJwt,
  GenerateInclusionConnectJwt,
  makeGenerateJwtES256,
} from "../../../../domains/core/jwt";
import {
  TEST_OPEN_ESTABLISHMENT_1,
  TEST_OPEN_ESTABLISHMENT_2,
} from "../../../../domains/core/sirene/adapters/InMemorySiretGateway";
import { TimeGateway } from "../../../../domains/core/time-gateway/ports/TimeGateway";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../../../../domains/establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { InMemoryGateways, buildTestApp } from "../../../../utils/buildTestApp";

describe("Edit form establishments", () => {
  let httpClient: HttpClient<EstablishmentRoutes>;
  let appConfig: AppConfig;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  let generateInclusionConnectJwt: GenerateInclusionConnectJwt;

  const formEstablishment = FormEstablishmentDtoBuilder.valid()
    .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
    .build();

  const existingEstablishment = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret(formEstablishment.siret)
    .withUserRights([
      {
        role: "establishment-admin",
        job: "",
        phone: "",
        userId: "",
      },
    ])
    .build();

  beforeEach(async () => {
    let request: supertest.SuperTest<supertest.Test>;
    ({
      request,
      appConfig,
      gateways,
      inMemoryUow,
      generateEditEstablishmentJwt,
      generateInclusionConnectJwt,
    } = await buildTestApp(new AppConfigBuilder().build()));
    httpClient = createSupertestSharedClient(establishmentRoutes, request);

    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      existingEstablishment,
    ];

    gateways.addressApi.setNextLookupStreetAndAddresses([
      [updatedAddress1.addressAndPosition],
    ]);
  });

  it("200 - Supports posting already existing form establisment when authenticated with establishment JWT", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_1.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: "",
      status: 200,
    });

    expectEstablishmentInRepoUpdated(
      inMemoryUow,
      gateways.timeGateway,
      existingEstablishment,
      formEstablishment,
    );
  });

  it("200 - Updates establishment with new data", async () => {
    const updatedFormEstablishment: FormEstablishmentDto = {
      ...formEstablishment,
      maxContactsPerMonth: 20,
      searchableBy: {
        jobSeekers: false,
        students: true,
      },
      appellations: [
        {
          romeCode: "D1103",
          appellationCode: "33333",
          romeLabel: "Boucherie",
          appellationLabel: "Boucher / Bouchère",
        },
      ],
    };

    expectHttpResponseToEqual(
      await httpClient.updateFormEstablishment({
        body: updatedFormEstablishment,
        headers: {
          authorization: generateEditEstablishmentJwt(
            createEstablishmentJwtPayload({
              siret: TEST_OPEN_ESTABLISHMENT_1.siret,
              durationDays: 1,
              now: new Date(),
            }),
          ),
        },
      }),
      {
        body: "",
        status: 200,
      },
    );
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);

    expectEstablishmentInRepoUpdated(
      inMemoryUow,
      gateways.timeGateway,
      existingEstablishment,
      updatedFormEstablishment,
    );
  });

  it("200 - Supports posting already existing form establisment when authenticated with backoffice JWT", async () => {
    const backofficeAdminUser = new InclusionConnectedUserBuilder()
      .withId("backoffice-admin-user")
      .withIsAdmin(true)
      .buildUser();

    const backofficeAdminICJwtPayload: InclusionConnectJwtPayload = {
      version: currentJwtVersions.inclusion,
      iat: millisecondsToSeconds(new Date().getTime()),
      exp: millisecondsToSeconds(addDays(new Date(), 30).getTime()),
      userId: backofficeAdminUser.id,
    };

    const adminUser = new InclusionConnectedUserBuilder()
      .withId("admin")
      .withEmail(formEstablishment.businessContact.email)
      .buildUser();

    const contactUsers = formEstablishment.businessContact.copyEmails.map(
      (email, index) =>
        new InclusionConnectedUserBuilder()
          .withId(`contact-${index}`)
          .withEmail(email)
          .buildUser(),
    );

    inMemoryUow.userRepository.users = [
      adminUser,
      ...contactUsers,
      backofficeAdminUser,
    ];

    expectHttpResponseToEqual(
      await httpClient.updateFormEstablishment({
        body: formEstablishment,
        headers: {
          authorization: generateInclusionConnectJwt(
            backofficeAdminICJwtPayload,
          ),
        },
      }),
      {
        body: "",
        status: 200,
      },
    );
    expect(inMemoryUow.outboxRepository.events).toHaveLength(1);
    expectEstablishmentInRepoUpdated(
      inMemoryUow,
      gateways.timeGateway,
      existingEstablishment,
      formEstablishment,
    );
  });

  it("400 - not authenticated", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {} as any,
    });

    expectHttpResponseToEqual(response, {
      body: {
        issues: ["authorization : Required"],
        message:
          "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: PUT /form-establishments",
        status: 400,
      },
      status: 400,
    });
  });

  it("401 - Jwt is generated from wrong private key", async () => {
    const generateJwtWithWrongKey = makeGenerateJwtES256<"establishment">(
      appConfig.apiJwtPrivateKey, // Private Key is the wrong one !
      undefined,
    );

    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateJwtWithWrongKey(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      status: 401,
      body: { status: 401, message: "Provided token is invalid" },
    });
  });

  it("401 - Jwt is malformed", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: "bad-jwt",
      },
    });

    expectHttpResponseToEqual(response, {
      body: { status: 401, message: "Provided token is invalid" },
      status: 401,
    });
  });

  it("403 - Jwt is expired", async () => {
    const response = await httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: "12345678901234",
            durationDays: 1,
            now: subYears(gateways.timeGateway.now(), 1),
          }),
        ),
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

  it("404 - Missing establishment aggregate", async () => {
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [];

    const establishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_OPEN_ESTABLISHMENT_2.siret)
      .build();
    const response = await httpClient.updateFormEstablishment({
      body: establishment,
      headers: {
        authorization: generateEditEstablishmentJwt(
          createEstablishmentJwtPayload({
            siret: TEST_OPEN_ESTABLISHMENT_2.siret,
            durationDays: 1,
            now: new Date(),
          }),
        ),
      },
    });

    expectHttpResponseToEqual(response, {
      body: {
        status: 404,
        message: errors.establishment.notFound({
          siret: establishment.siret,
        }).message,
      },
      status: 404,
    });
  });
});

function expectEstablishmentInRepoUpdated(
  inMemoryUow: InMemoryUnitOfWork,
  timeGateway: TimeGateway,
  existingEstablishment: EstablishmentAggregate,
  formEstablishment: FormEstablishmentDto,
) {
  expect(inMemoryUow.outboxRepository.events).toHaveLength(1);

  expect(
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates,
  ).toHaveLength(1);
  const updatedAggregateInRepo =
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates[0];
  const { locations, ...restOfEstablishmentInRepo } =
    updatedAggregateInRepo.establishment;

  expectArraysToMatch(locations, [updatedAddress1.addressAndPosition]);
  const { locations: _, ...restOfExistingEstablishment } =
    existingEstablishment.establishment;
  expectToEqual(restOfEstablishmentInRepo, {
    ...restOfExistingEstablishment,
    updatedAt: timeGateway.now(),
    website: formEstablishment.website,
    name: formEstablishment.businessName,
    isCommited: formEstablishment.isEngagedEnterprise,
    customizedName: formEstablishment.businessNameCustomized,
    maxContactsPerMonth: formEstablishment.maxContactsPerMonth,
    searchableBy: formEstablishment.searchableBy,
  });
  expectToEqual(
    updatedAggregateInRepo.offers,
    formEstablishment.appellations.map((appellation) => ({
      ...appellation,
      createdAt: timeGateway.now(),
    })),
  );
  expectArraysToMatch(updatedAggregateInRepo.userRights, [
    {
      role: "establishment-admin",
      job: formEstablishment.businessContact.job,
      phone: formEstablishment.businessContact.phone,
    },
    ...formEstablishment.businessContact.copyEmails.map(
      (_) =>
        ({
          role: "establishment-contact",
        }) satisfies Partial<EstablishmentUserRight>,
    ),
  ]);
}
