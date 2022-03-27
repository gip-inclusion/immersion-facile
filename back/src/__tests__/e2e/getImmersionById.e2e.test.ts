import { SuperTest, Test } from "supertest";
import {
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryRepositories,
} from "../../_testBuilders/buildTestApp";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { GenerateApiConsumerJtw } from "../../domain/auth/jwt";
import { getImmersionOfferByIdRoute } from "../../shared/routes";
import { SearchImmersionResultPublicV0 } from "../../adapters/primary/routers/DtoAndSchemas/v0/output/SearchImmersionResultPublicV0.dto";

const authorizedApiKeyId = "e82e79da-5ee0-4ef5-82ab-1f527ef10a59";
const immersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03512d";
const immersionOfferRome = "B1805";

describe("Route to get immersion offer by id", () => {
  let request: SuperTest<Test>;
  let reposAndGateways: InMemoryRepositories;
  let generateApiJwt: GenerateApiConsumerJtw;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([authorizedApiKeyId])
      .build();
    ({ request, reposAndGateways } = await buildTestApp(config));
    generateApiJwt = makeGenerateJwt(config.apiJwtPrivateKey);

    await reposAndGateways.immersionOffer.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withAddress("55 rue de Faubourg Sante Honoré 75008 Paris")
            .build(),
        )
        .withContact(
          new ContactEntityV2Builder().withContactMethod("EMAIL").build(),
        )
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder()
            .withId(immersionOfferId)
            .withRomeCode(immersionOfferRome)
            .build(),
        ])
        .build(),
    ]);
  });

  it("accepts valid unauthenticated requests", async () => {
    const expectedResult: SearchImmersionResultPublicV0 = {
      // /!\ Those fields come from Builder (should probably not.)
      id: "",
      rome: immersionOfferRome,
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: "55 rue de Faubourg Sante Honoré 75008 Paris",
      romeLabel: TEST_ROME_LABEL,
      nafLabel: TEST_NAF_LABEL,
      city: "Paris",
      contactMode: "EMAIL",
    };

    await request
      .get(`/get-immersion-by-id/${immersionOfferId}`)
      .expect(200, expectedResult);
  });

  it("accepts valid authenticated requests", async () => {
    // /!\ Those fields come from Builder (should probably not.)
    const expectedResult: SearchImmersionResultPublicV0 = {
      id: "",
      rome: immersionOfferRome,
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      location: TEST_POSITION,
      address: "55 rue de Faubourg Sante Honoré 75008 Paris",
      contactMode: "EMAIL",
      contactDetails: {
        id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
        lastName: "Prost",
        firstName: "Alain",
        email: "alain.prost@email.fr",
        phone: "0612345678",
        role: "le big boss",
      },
      romeLabel: TEST_ROME_LABEL,
      nafLabel: TEST_NAF_LABEL,
      city: "Paris",
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
      .get(`/${getImmersionOfferByIdRoute}/sfdfdsdf`)
      .set("Authorization", authToken)
      .expect(404);
  });
});
