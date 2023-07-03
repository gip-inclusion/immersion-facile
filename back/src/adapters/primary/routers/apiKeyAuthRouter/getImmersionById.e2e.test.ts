import { SuperTest, Test } from "supertest";
import { getImmersionOfferByIdRoute__v0 } from "shared";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  GenerateApiConsumerJwt,
  makeGenerateJwtES256,
} from "../../../../domain/auth/jwt";
import {
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { validAuthorizedApiKeyId } from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV0 } from "../DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const immersionOfferId = "78000403200019-B1805";
const immersionOfferRome = "B1805";
const establishmentAgg = new EstablishmentAggregateBuilder()
  .withEstablishment(
    new EstablishmentEntityBuilder()
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
  let generateApiJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([validAuthorizedApiKeyId])
      .build();
    ({ request, inMemoryUow } = await buildTestApp(config));
    generateApiJwt = makeGenerateJwtES256<"apiConsumer">(
      config.apiJwtPrivateKey,
      3600,
    );

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [establishmentAgg],
    );
  });

  it("accepts valid unauthenticated requests", async () => {
    const expectedResult: SearchImmersionResultPublicV0 = {
      // /!\ Those fields come from Builder (should probably not.)
      id: "78000403200019-" + immersionOfferRome,
      rome: immersionOfferRome,
      siret: "78000403200019",
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
    };

    await request
      .get(`/${getImmersionOfferByIdRoute__v0}/${immersionOfferId}`)
      .expect(200, expectedResult);
  });

  it("accepts valid authenticated requests", async () => {
    // /!\ Those fields come from Builder (should probably not.)
    const expectedResult: SearchImmersionResultPublicV0 = {
      id: "78000403200019-" + immersionOfferRome,
      rome: immersionOfferRome,
      siret: "78000403200019",
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
    };

    const authToken = generateApiJwt({
      id: validAuthorizedApiKeyId,
    });

    await request
      .get(`/${getImmersionOfferByIdRoute__v0}/${immersionOfferId}`)
      .set("Authorization", authToken)
      .expect(200, expectedResult);
  });

  it("rejects requests with wrong format id", async () => {
    const authToken = generateApiJwt({
      id: validAuthorizedApiKeyId,
    });
    await request
      .get(`/${getImmersionOfferByIdRoute__v0}/sfdfdsdf`)
      .set("Authorization", authToken)
      .expect(404);
  });
});
