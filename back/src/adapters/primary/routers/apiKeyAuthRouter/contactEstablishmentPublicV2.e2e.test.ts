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
import { OfferEntityBuilder } from "../../../../_testBuilders/OfferEntityBuilder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorisedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { TEST_POSITION } from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { ContactEstablishmentPublicV2Dto } from "../DtoAndSchemas/v2/input/ContactEstablishmentPublicV2.dto";
import {
  PublicApiV2SearchEstablishmentRoutes,
  publicApiV2SearchEstablishmentRoutes,
} from "./publicApiV2.routes";

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
  let generateApiConsumerJwt: GenerateApiConsumerJwt;
  let sharedRequest: HttpClient<PublicApiV2SearchEstablishmentRoutes>;
  let authToken: string;
  let inMemoryUow: InMemoryUnitOfWork;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp(
      new AppConfigBuilder()
        .withRepositories("IN_MEMORY")
        .withAuthorizedApiKeyIds([authorizedUnJeuneUneSolutionApiConsumer.id])
        .build(),
    ));
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
      unauthorisedApiConsumer,
    ];
    authToken = generateApiConsumerJwt({
      id: authorizedUnJeuneUneSolutionApiConsumer.id,
    });
    sharedRequest = createSupertestSharedClient(
      publicApiV2SearchEstablishmentRoutes,
      request,
    );
  });

  it("refuses to contact if no api key is provided", async () => {
    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: "",
      },
      body: {} as any,
    });

    expectToEqual(body, { status: 401, message: "unauthenticated" });
    expectToEqual(status, 401);
  });

  it("returns 404 if siret not found", async () => {
    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      },
      body: contactEstablishment,
    });

    expectToEqual(body, {
      status: 404,
      message: `No establishment found with siret: ${contactEstablishment.siret}`,
    });
    expectToEqual(status, 404);
  });

  it("rejects unauthorized consumer", async () => {
    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: generateApiConsumerJwt({
          id: unauthorisedApiConsumer.id,
        }),
      },
      body: contactEstablishment,
    });

    expectToEqual(body, {
      status: 403,
      message: "Accès refusé",
    });
    expectToEqual(status, 403);
  });

  it("rejects invalid requests with error code 400", async () => {
    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: { ...contactEstablishment, siret: "wrong" },
    });

    expectToEqual(body, {
      status: 400,
      message:
        "Shared-route schema 'requestBodySchema' was not respected in adapter 'express'.\nRoute: POST /v2/contact-establishment",
      issues: ["siret : SIRET doit être composé de 14 chiffres"],
    });
    expectToEqual(status, 400);
  });

  it("rejects invalid requests with mismatching contact Mode with error code 400", async () => {
    const testEstablishmentContactMethod = "PHONE";
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
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
          .withOffers([
            new OfferEntityBuilder()
              .withAppellationCode(contactEstablishment.appellationCode)
              .build(),
          ])
          .build(),
      ],
    );

    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: contactEstablishment,
    });

    expectToEqual(body, {
      status: 400,
      message: `Contact mode mismatch: ${contactEstablishment.contactMode} in params. In contact (fetched with siret) : ${testEstablishmentContactMethod}`,
    });
    expectToEqual(status, 400);
  });

  it("rejects invalid requests with mismatching appellation Code with error code 400", async () => {
    const testEstablishmentAppellationCode = "11704";
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
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
          .withOffers([
            new OfferEntityBuilder()
              .withAppellationCode(testEstablishmentAppellationCode)
              .build(),
          ])
          .build(),
      ],
    );

    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: contactEstablishment,
    });

    expectToEqual(body, {
      status: 400,
      message: `Establishment with siret '${contactEstablishment.siret}' doesn't have an immersion offer with appellation code '${contactEstablishment.appellationCode}'.`,
    });
    expectToEqual(status, 400);
  });

  it("contacts the establishment when everything goes right", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
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
          .withOffers([
            new OfferEntityBuilder()
              .withAppellationCode(contactEstablishment.appellationCode)
              .build(),
          ])
          .build(),
      ],
    );

    const { body, status } = await request
      .post(`/v2/contact-establishment`)
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      )
      .send(contactEstablishment);

    expectToEqual(body, "");
    expectToEqual(status, 201);
  });
});
