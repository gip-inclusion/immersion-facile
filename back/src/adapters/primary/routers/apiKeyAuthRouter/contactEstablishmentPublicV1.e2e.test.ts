import { SuperTest, Test } from "supertest";
import { AppellationAndRomeDto } from "shared";
import { rueSaintHonoreDto } from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import { TEST_POSITION } from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { ContactEstablishmentPublicV1Dto } from "../DtoAndSchemas/v1/input/ContactEstablishmentPublicV1.dto";

const designer: AppellationAndRomeDto = {
  romeCode: "E1205",
  romeLabel: "Desgin",
  appellationCode: "13999",
  appellationLabel: "Designer / Designeuse graphique",
};

const contactEstablishment: ContactEstablishmentPublicV1Dto = {
  contactMode: "EMAIL",
  message: "Salut !",
  siret: "11112222333344",
  offer: { romeCode: designer.romeCode, romeLabel: designer.romeLabel },
  potentialBeneficiaryEmail: "john.doe@mail.com",
  potentialBeneficiaryFirstName: "John",
  potentialBeneficiaryLastName: "Doe",
};

describe("POST contact-establishment public V1 route", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp(
      new AppConfigBuilder()
        .withRepositories("IN_MEMORY")
        .withAuthorizedApiKeyIds([authorizedUnJeuneUneSolutionApiConsumer.id])
        .build(),
    ));
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
    ];
  });

  it("refuses to contact if no api key is provided", async () => {
    const response = await request.post(`/v1/contact-establishment`).send({});
    expect(response.status).toBe(401);
  });

  it("returns 404 if siret not found", async () => {
    const response = await request
      .post(`/v1/contact-establishment`)
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      )
      .send(contactEstablishment);

    expect(response.status).toBe(404);
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
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withRomeCode(designer.romeCode)
              .withAppellationCode(designer.appellationCode)
              .withAppellationLabel(designer.appellationLabel)
              .build(),
          ])
          .build(),
      ],
    );

    const response = await request
      .post(`/v1/contact-establishment`)
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      )
      .send(contactEstablishment);

    expect(response.body).toBe("");
    expect(response.status).toBe(200);
  });
});
