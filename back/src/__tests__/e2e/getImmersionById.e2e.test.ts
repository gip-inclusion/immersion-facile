import { getImmersionOfferByIdRoute__v0 } from "shared";
import { SuperTest, Test } from "supertest";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";
import { SearchImmersionResultPublicV0 } from "../../adapters/primary/routers/DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";
import {
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import {
  GenerateApiConsumerJtw,
  makeGenerateJwtES256,
} from "../../domain/auth/jwt";

const authorizedApiKeyId = "my-authorized-id";
const immersionOfferId = "78000403200019-B1805";
const immersionOfferRome = "B1805";

describe("Route to get immersion offer by id", () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiJwt: GenerateApiConsumerJtw;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([authorizedApiKeyId])
      .build();
    ({ request, inMemoryUow } = await buildTestApp(config));
    generateApiJwt = makeGenerateJwtES256(config.apiJwtPrivateKey);

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityV2Builder()
              .withPosition(TEST_POSITION)
              .withAddress(rueSaintHonoreDto)
              .withNumberOfEmployeeRange("10-19")
              .build(),
          )
          .withContact(
            new ContactEntityV2Builder().withContactMethod("EMAIL").build(),
          )
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withRomeCode(immersionOfferRome)
              .build(),
          ])
          .build(),
      ],
    );
  });

  it("accepts valid unauthenticated requests", async () => {
    const expectedResult: SearchImmersionResultPublicV0 = {
      // /!\ Those fields come from Builder (should probably not.)
      id: "78000403200019-" + immersionOfferRome,
      rome: immersionOfferRome,
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: rueSaintHonore,
      romeLabel: TEST_ROME_LABEL,
      nafLabel: TEST_NAF_LABEL,
      city: rueSaintHonoreDto.city,
      contactMode: "EMAIL",
      numberOfEmployeeRange: "10-19",
    };

    await request
      .get(`/get-immersion-by-id/${immersionOfferId}`)
      .expect(200, expectedResult);
  });

  it("accepts valid authenticated requests", async () => {
    // /!\ Those fields come from Builder (should probably not.)
    const expectedResult: SearchImmersionResultPublicV0 = {
      id: "78000403200019-" + immersionOfferRome,
      rome: immersionOfferRome,
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: rueSaintHonore,
      contactMode: "EMAIL",
      contactDetails: {
        id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
        lastName: "Prost",
        firstName: "Alain",
        email: "alain.prost@email.fr",
        phone: "0612345678",
        role: "le big boss",
      },
      numberOfEmployeeRange: "10-19",
      romeLabel: TEST_ROME_LABEL,
      nafLabel: TEST_NAF_LABEL,
      city: rueSaintHonoreDto.city,
    };

    const authToken = generateApiJwt({
      id: authorizedApiKeyId,
    });

    await request
      .get(`/get-immersion-by-id/${immersionOfferId}`)
      .set("Authorization", authToken)
      .expect(200, expectedResult);
  });

  it("rejects requests with wrong format id", async () => {
    const authToken = generateApiJwt({
      id: authorizedApiKeyId,
    });
    await request
      .get(`/${getImmersionOfferByIdRoute__v0}/sfdfdsdf`)
      .set("Authorization", authToken)
      .expect(404);
  });
});
