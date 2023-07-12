import { SuperTest, Test } from "supertest";
import {
  expectToEqual,
  getImmersionOfferByIdRoute__v0,
  RomeCode,
  SiretDto,
} from "shared";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { validApiConsumerJwtPayload } from "../../../../_testBuilders/jwtTestHelper";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import {
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { validAuthorizedApiKeyId } from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import {
  LegacyImmersionOfferId,
  SearchImmersionResultPublicV0,
} from "../DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const immersionOfferRome: RomeCode = "B1805";
const siret: SiretDto = "78000403200019";
const immersionOfferId: LegacyImmersionOfferId = `${siret}-${immersionOfferRome}`;

const establishmentAgg = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
      .withSiret(siret)
      .withPosition(TEST_POSITION)
      .withAddress(rueSaintHonoreDto)
      .withNumberOfEmployeeRange("10-19")
      .build(),
  )
  .withContact(new ContactEntityBuilder().withContactMethod("EMAIL").build())
  .withImmersionOffers([
    new ImmersionOfferEntityV2Builder()
      .withRomeCode(immersionOfferRome)
      .build(),
  ])
  .build();

describe("Route to get immersion offer by id", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    ({ request, inMemoryUow, generateApiConsumerJwt } = await buildTestApp(
      new AppConfigBuilder()
        .withRepositories("IN_MEMORY")
        .withAuthorizedApiKeyIds([validAuthorizedApiKeyId])
        .build(),
    ));
  });

  it("accepts valid unauthenticated requests", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAgg],
    );

    const response = await request.get(
      `/${getImmersionOfferByIdRoute__v0}/${immersionOfferId}`,
    );

    expectToEqual(response.body, {
      id: immersionOfferId,
      rome: immersionOfferRome,
      siret,
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: rueSaintHonore,
      romeLabel: TEST_ROME_LABEL,
      naf: establishmentAgg.establishment.nafDto.code,
      nafLabel: establishmentAgg.establishment.nafDto.nomenclature,
      city: rueSaintHonoreDto.city,
      contactMode: "EMAIL",
      numberOfEmployeeRange: "10-19",
    } satisfies SearchImmersionResultPublicV0);
    expectToEqual(response.statusCode, 200);
  });

  it("accepts valid authenticated requests", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAgg],
    );

    const response = await request
      .get(`/${getImmersionOfferByIdRoute__v0}/${immersionOfferId}`)
      .set("Authorization", generateApiConsumerJwt(validApiConsumerJwtPayload));

    expectToEqual(response.body, {
      id: immersionOfferId,
      rome: immersionOfferRome,
      siret,
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: rueSaintHonore,
      contactMode: "EMAIL",
      numberOfEmployeeRange: "10-19",
      romeLabel: TEST_ROME_LABEL,
      naf: establishmentAgg.establishment.nafDto.code,
      nafLabel: establishmentAgg.establishment.nafDto.nomenclature,
      city: rueSaintHonoreDto.city,
    } satisfies SearchImmersionResultPublicV0);
    expectToEqual(response.statusCode, 200);
  });

  it("rejects requests with wrong format id", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAgg],
    );

    const response = await request
      .get(`/${getImmersionOfferByIdRoute__v0}/sfdfdsdf`)
      .set("Authorization", generateApiConsumerJwt(validApiConsumerJwtPayload));

    expectToEqual(response.statusCode, 400);
  });

  it("rejects requests with missing immersion offer", async () => {
    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [],
    );

    const response = await request
      .get(`/${getImmersionOfferByIdRoute__v0}/${immersionOfferId}`)
      .set("Authorization", generateApiConsumerJwt(validApiConsumerJwtPayload));

    expectToEqual(response.statusCode, 404);
  });
});
