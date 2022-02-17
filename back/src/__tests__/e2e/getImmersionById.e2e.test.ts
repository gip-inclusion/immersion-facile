import { getUnixTime } from "date-fns";
import { SuperTest, Test } from "supertest";
import {
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import { SearchImmersionResultDto } from "../../shared/SearchImmersionDto";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import {
  buildTestApp,
  InMemoryRepositories,
} from "../../_testBuilders/buildTestApp";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { GenerateApiConsumerJtw } from "../../domain/auth/jwt";

const authorizedApiKeyId = "e82e79da-5ee0-4ef5-82ab-1f527ef10a59";
const immersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03512d";

describe("/get-immersion-by-id route", () => {
  const clock = new RealClock();

  let request: SuperTest<Test>;
  let reposAndGateways: InMemoryRepositories;
  let generateJwt: GenerateApiConsumerJtw;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([authorizedApiKeyId])
      .build();
    ({ request, reposAndGateways } = await buildTestApp(config));
    generateJwt = makeGenerateJwt(config);

    await reposAndGateways.immersionOffer.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withContactMode("EMAIL")
            .withAddress("55 rue de Faubourg Sante Honoré 75008 Paris")
            .build(),
        )
        .withContacts([new ContactEntityV2Builder().build()])
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder().withId(immersionOfferId).build(),
        ])
        .build(),
    ]);
  });

  test("accepts valid unauthenticated requests", async () => {
    const expectedResult: SearchImmersionResultDto = {
      id: immersionOfferId,
      rome: "M1907",
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: false,
      location: TEST_POSITION,
      address: "55 rue de Faubourg Sante Honoré 75008 Paris",
      contactMode: "EMAIL",
      romeLabel: TEST_ROME_LABEL,
      nafLabel: TEST_NAF_LABEL,
      city: "Paris",
    };

    await request
      .get("/get-immersion-by-id/13df03a5-a2a5-430a-b558-ed3e2f03512d")
      .expect(200, expectedResult);
  });

  test("accepts valid authenticated requests", async () => {
    const expectedResult: SearchImmersionResultDto = {
      id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
      rome: "M1907",
      naf: "8539A",
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: false,
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

    const authToken = generateJwt({
      id: authorizedApiKeyId,
    });

    await request
      .get("/get-immersion-by-id/13df03a5-a2a5-430a-b558-ed3e2f03512d")
      .set("Authorization", authToken)
      .expect(200, expectedResult);
  });

  test("rejects requests with missing id", async () => {
    await request.get("/get-immersion-by-id/sfdfdsdf").expect(404);
  });

  test("rejects requests with wrong id", async () => {
    await request.get("/get-immersion-by-id/").expect(404);
  });
});
