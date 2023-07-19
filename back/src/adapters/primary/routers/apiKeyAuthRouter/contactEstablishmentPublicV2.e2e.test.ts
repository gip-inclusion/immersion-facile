import { SuperTest, Test } from "supertest";
import { expectToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { rueSaintHonoreDto } from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { validApiConsumerJwtPayload } from "../../../../_testBuilders/jwtTestHelper";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_POSITION,
} from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { validAuthorizedApiKeyId } from "../../../secondary/InMemoryApiConsumerRepository";
import { ContactEstablishmentPublicV2Dto } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import { PublicApiV2Routes, publicApiV2Routes } from "./publicApiV2.routes";

const contactEstablishment: ContactEstablishmentPublicV2Dto = {
  contactMode: "EMAIL",
  message: "Salut !",
  siret: "11112222333344",
  appellationCode: "11111",
  potentialBeneficiaryEmail: "john.doe@mail.com",
  potentialBeneficiaryFirstName: "John",
  potentialBeneficiaryLastName: "Doe",
  immersionObjective: "Confirmer un projet professionnel",
  potentialBeneficiaryPhone: "0654334567",
};

describe("POST contact-establishment public V2 route", () => {
  let request: SuperTest<Test>;
  let generateApiJwt: GenerateApiConsumerJwt;
  let sharedRequest: HttpClient<PublicApiV2Routes>;
  let authToken: string;
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([validAuthorizedApiKeyId])
      .build();

    const {
      request: testAppRequest,
      generateApiConsumerJwt: testAppGenerateApiJwt,
      inMemoryUow,
    } = await buildTestApp(config);

    request = testAppRequest;
    generateApiJwt = testAppGenerateApiJwt;

    authToken = generateApiJwt({
      id: validAuthorizedApiKeyId,
    });
    establishmentAggregateRepository =
      inMemoryUow.establishmentAggregateRepository;

    sharedRequest = createSupertestSharedClient(publicApiV2Routes, request);
  });

  it("refuses to contact if no api key is provided", async () => {
    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: "",
      },
      body: {} as any,
    });
    expectToEqual(response, {
      status: 401,
      body: { status: 401, message: "unauthenticated" },
    });
  });

  it("returns 404 if siret not found", async () => {
    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: generateApiJwt(validApiConsumerJwtPayload),
      },
      body: contactEstablishment,
    });

    expectToEqual(response, {
      status: 404,
      body: {
        status: 404,
        message: `No establishment found with siret: ${contactEstablishment.siret}`,
      },
    });
  });

  it("rejects unauthorized consumer", async () => {
    const authToken = generateApiJwt({
      id: "my-unauthorized-id",
    });

    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: {} as any,
    });

    expectToEqual(response, {
      status: 403,
      body: {
        status: 403,
        message: "unauthorised consumer Id",
      },
    });
  });

  it("rejects invalid requests with error code 400", async () => {
    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: { ...contactEstablishment, siret: "wrong" },
    });

    expectToEqual(response, {
      status: 400,
      body: {
        status: 400,
        message:
          "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /v2/contact-establishment",
        issues: ["siret : SIRET doit être composé de 14 chiffres"],
      },
    });
  });

  it("rejects invalid requests with mismatching contact Mode with error code 400", async () => {
    const testEstablishmentContactMethod = "PHONE";
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withPosition(TEST_POSITION)
            .withNumberOfEmployeeRange("10-19")
            .withAddress(rueSaintHonoreDto)
            .build(),
        )
        .withContact(
          new ContactEntityBuilder()
            .withContactMethod(testEstablishmentContactMethod)
            .build(),
        )
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder()
            .withAppellationCode(contactEstablishment.appellationCode)
            .build(),
        ])
        .build(),
    ]);

    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: contactEstablishment,
    });

    expectToEqual(response, {
      status: 400,
      body: {
        status: 400,
        message: `Contact mode mismatch: ${contactEstablishment.contactMode} in params. In contact (fetched with siret) : ${testEstablishmentContactMethod}`,
      },
    });
  });

  it("rejects invalid requests with mismatching appellation Code with error code 400", async () => {
    const testEstablishmentAppellationCode = "11704";
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withPosition(TEST_POSITION)
            .withNumberOfEmployeeRange("10-19")
            .withAddress(rueSaintHonoreDto)
            .build(),
        )
        .withContact(
          new ContactEntityBuilder().withContactMethod("EMAIL").build(),
        )
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder()
            .withAppellationCode(testEstablishmentAppellationCode)
            .build(),
        ])
        .build(),
    ]);

    const response = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: contactEstablishment,
    });

    expectToEqual(response, {
      status: 400,
      body: {
        status: 400,
        message: `Establishment with siret '${contactEstablishment.siret}' doesn't have an immersion offer with appellation code '${contactEstablishment.appellationCode}'.`,
      },
    });
  });

  it("contacts the establishment when everything goes right", async () => {
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withPosition(TEST_POSITION)
            .withNumberOfEmployeeRange("10-19")
            .withAddress(rueSaintHonoreDto)
            .build(),
        )
        .withContact(
          new ContactEntityBuilder().withContactMethod("EMAIL").build(),
        )
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder()
            .withAppellationCode(contactEstablishment.appellationCode)
            .build(),
        ])
        .build(),
    ]);

    const response = await request
      .post(`/v2/contact-establishment`)
      .set("Authorization", generateApiJwt(validApiConsumerJwtPayload))
      .send(contactEstablishment);

    expect(response.status).toBe(201);
    expect(response.body).toBe("");
  });
});
