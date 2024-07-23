import { errors, expectObjectsToMatch, expectToEqual } from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { SuperTest, Test } from "supertest";
import {
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { GenerateApiConsumerJwt } from "../../../../domains/core/jwt";
import { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
  TEST_LOCATION,
} from "../../../../domains/establishment/helpers/EstablishmentBuilders";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { buildTestApp } from "../../../../utils/buildTestApp";
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
  locationId: TEST_LOCATION.id,
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
      unauthorizedApiConsumer,
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
      body: contactEstablishment,
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
      message: errors.establishment.notFound({
        siret: contactEstablishment.siret,
      }).message,
    });
    expectToEqual(status, 404);
  });

  it("rejects unauthorized consumer", async () => {
    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: generateApiConsumerJwt({
          id: unauthorizedApiConsumer.id,
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
    const establishment = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(contactEstablishment.siret)
          .withLocations([TEST_LOCATION])
          .withNumberOfEmployeeRange("10-19")
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
      .build();
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];

    const { body, status } = await sharedRequest.contactEstablishment({
      headers: {
        authorization: authToken,
      },
      body: contactEstablishment,
    });

    expectToEqual(body, {
      status: 400,
      message: errors.establishment.contactRequestContactModeMismatch({
        contactMethods: {
          inParams: contactEstablishment.contactMode,
          inRepo: establishment.contact.contactMethod,
        },
        siret: contactEstablishment.siret,
      }).message,
    });
    expectToEqual(status, 400);
  });

  it("rejects invalid requests with mismatching appellation Code with error code 400", async () => {
    const testEstablishmentAppellationCode = "11704";
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withLocations([TEST_LOCATION])
            .withNumberOfEmployeeRange("10-19")
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
    ];

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

  it("contacts the establishment when everything goes right, and stores the consumer in acquisition params", async () => {
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withLocations([TEST_LOCATION])
            .withNumberOfEmployeeRange("10-19")
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
    ];

    const { body, status } = await request
      .post("/v2/contact-establishment")
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      )
      .send(contactEstablishment);

    expectToEqual(body, "");
    expectToEqual(status, 201);
    expect(inMemoryUow.discussionRepository.discussions).toHaveLength(1);
    const discussion = inMemoryUow.discussionRepository.discussions[0];
    expectObjectsToMatch(discussion, {
      siret: contactEstablishment.siret,
      acquisitionCampaign: "api-consumer",
      acquisitionKeyword: `${authorizedUnJeuneUneSolutionApiConsumer.id} - ${authorizedUnJeuneUneSolutionApiConsumer.name}`,
    });
  });

  it("contacts the establishment when everything goes right even without location id", async () => {
    inMemoryUow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret(contactEstablishment.siret)
            .withLocations([TEST_LOCATION])
            .withNumberOfEmployeeRange("10-19")
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
    ];

    const { locationId: _, ...contactEstablishmentWithoutLocationId } =
      contactEstablishment;

    const { body, status } = await request
      .post("/v2/contact-establishment")
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      )
      .send(contactEstablishmentWithoutLocationId);

    expectToEqual(body, "");
    expectToEqual(status, 201);
  });
});
