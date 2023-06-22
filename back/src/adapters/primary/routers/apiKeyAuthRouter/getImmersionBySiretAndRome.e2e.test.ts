import { SuperTest, Test } from "supertest";
import { AppellationAndRomeDto } from "shared";
import {
  rueSaintHonore,
  rueSaintHonoreDto,
} from "../../../../_testBuilders/addressDtos";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { ContactEntityBuilder } from "../../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import {
  defaultNafCode,
  EstablishmentEntityBuilder,
} from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { GenerateApiConsumerJwt } from "../../../../domain/auth/jwt";
import {
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { validAuthorizedApiKeyId } from "../../../secondary/InMemoryApiConsumerRepository";
import { InMemoryUnitOfWork } from "../../config/uowConfig";
import { SearchImmersionResultPublicV1 } from "../DtoAndSchemas/v1/output/SearchImmersionResultPublicV1.dto";

const styliste: AppellationAndRomeDto = {
  romeCode: "B1805",
  romeLabel: "Stylisme",
  appellationCode: "19540",
  appellationLabel: "Styliste",
};
const immersionOfferSiret = "78000403200019";

describe(`Route to get ImmersionSearchResultDto by siret and rome - /v1/immersion-offers/:siret/:rome`, () => {
  let request: SuperTest<Test>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiJwt: GenerateApiConsumerJwt;
  let authToken: string;

  beforeEach(async () => {
    const config = new AppConfigBuilder()
      .withRepositories("IN_MEMORY")
      .withAuthorizedApiKeyIds([validAuthorizedApiKeyId])
      .build();
    ({ request, inMemoryUow, generateApiJwt } = await buildTestApp(config));
    authToken = generateApiJwt({
      id: validAuthorizedApiKeyId,
    });

    await inMemoryUow.establishmentAggregateRepository.insertEstablishmentAggregates(
      [
        new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(immersionOfferSiret)
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
              .withRomeCode(styliste.romeCode)
              .withAppellationCode(styliste.appellationCode)
              .withAppellationLabel(styliste.appellationLabel)
              .build(),
          ])
          .build(),
      ],
    );
  });

  it("rejects unauthenticated requests", async () => {
    await request
      .get(`/v1/immersion-offers/${immersionOfferSiret}/${styliste.romeCode}`)
      .expect(401);
  });

  it("accepts valid authenticated requests", async () => {
    // /!\ Those fields come from Builder (should probably not.)
    const expectedResult: SearchImmersionResultPublicV1 = {
      rome: styliste.romeCode,
      naf: defaultNafCode,
      siret: "78000403200019",
      name: "Company inside repository",
      voluntaryToImmersion: true,
      position: TEST_POSITION,
      numberOfEmployeeRange: "10-19",
      address: rueSaintHonore,
      contactMode: "EMAIL",
      romeLabel: TEST_ROME_LABEL,
      appellationLabels: [styliste.appellationLabel],
      nafLabel: TEST_NAF_LABEL,
      city: rueSaintHonoreDto.city,
    };

    const response = await request
      .get(`/v1/immersion-offers/${immersionOfferSiret}/${styliste.romeCode}`)
      .set("Authorization", authToken);

    expect(response.body).toEqual(expectedResult);
    expect(response.status).toBe(200);
  });
  it("returns 404 if no offer can be found with such siret & rome", async () => {
    const siretNotInDB = "11000403200019";
    await request
      .get(`/v1/immersion-offers/${siretNotInDB}/${styliste.romeCode}`)
      .set("Authorization", authToken)
      .expect(
        404,
        `{"errors":"No offer found for siret ${siretNotInDB} and rome ${styliste.romeCode}"}`,
      );
  });
});
