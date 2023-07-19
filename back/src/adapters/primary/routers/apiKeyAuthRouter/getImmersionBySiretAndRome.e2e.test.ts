import { SuperTest, Test } from "supertest";
import {
  addressDtoToString,
  AppellationAndRomeDto,
  expectToEqual,
} from "shared";
import { rueSaintHonoreDto } from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { OfferEntityBuilder } from "../../../../_testBuilders/OfferEntityBuilder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../secondary/InMemoryApiConsumerRepository";
import {
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV1 } from "../DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

const styliste: AppellationAndRomeDto = {
  romeCode: "B1805",
  romeLabel: "Stylisme",
  appellationCode: "19540",
  appellationLabel: "Styliste",
};
const immersionOfferSiret = "78000403200019";
const establishmentAggregate = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret(immersionOfferSiret)
      .withPosition(TEST_POSITION)
      .withNumberOfEmployeeRange("10-19")
      .withAddress(rueSaintHonoreDto)
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
  .withOffers([
    new OfferEntityBuilder()
      .withRomeCode(styliste.romeCode)
      .withAppellationCode(styliste.appellationCode)
      .withAppellationLabel(styliste.appellationLabel)
      .build(),
  ])
  .build();

describe(`Route to get ImmersionSearchResultDto by siret and rome - /v1/immersion-offers/:siret/:rome`, () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateApiConsumerJwt } = await buildTestApp(
      new AppConfigBuilder()
        .withRepositories("IN_MEMORY")
        .withAuthorizedApiKeyIds([authorizedUnJeuneUneSolutionApiConsumer.id])
        .build(),
    ));

    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedUnJeuneUneSolutionApiConsumer,
    ];
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAggregate],
    );
  });

  it("rejects unauthenticated requests", async () => {
    await request
      .get(`/v1/immersion-offers/${immersionOfferSiret}/${styliste.romeCode}`)
      .expect(401);
  });

  it("accepts valid authenticated requests", async () => {
    const response = await request
      .get(`/v1/immersion-offers/${immersionOfferSiret}/${styliste.romeCode}`)
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      );

    expectToEqual(response.body, {
      rome: styliste.romeCode,
      siret: establishmentAggregate.establishment.siret,
      name: establishmentAggregate.establishment.name,
      voluntaryToImmersion: true,
      position: establishmentAggregate.establishment.position,
      numberOfEmployeeRange: "10-19",
      address: addressDtoToString(establishmentAggregate.establishment.address),
      contactMode: "EMAIL",
      romeLabel: TEST_ROME_LABEL,
      appellationLabels: [styliste.appellationLabel],
      naf: establishmentAggregate.establishment.nafDto.code,
      nafLabel: establishmentAggregate.establishment.nafDto.nomenclature,
      city: establishmentAggregate.establishment.address.city,
      website: establishmentAggregate.establishment.website,
      additionalInformation: "",
    } satisfies SearchImmersionResultPublicV1);
    expect(response.status).toBe(200);
  });

  it("returns 404 if no offer can be found with such siret & rome", async () => {
    const siretNotInDB = "11000403200019";
    const response = await request
      .get(`/v1/immersion-offers/${siretNotInDB}/${styliste.romeCode}`)
      .set(
        "Authorization",
        generateApiConsumerJwt({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      );
    expect(response.body).toEqual({
      status: 404,
      message: `No offer found for siret ${siretNotInDB} and rome ${styliste.romeCode}`,
    });
    expect(response.status).toBe(404);
  });
});
