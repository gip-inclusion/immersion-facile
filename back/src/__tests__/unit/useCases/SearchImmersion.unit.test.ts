import {
  InMemoryImmersionOfferRepository,
  TEST_CITY,
  TEST_NAF_LABEL,
  TEST_POSITION,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemorySearchesMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";
import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

describe("SearchImmersion", () => {
  test("Search immersion, give contact details only if authenticated", async () => {
    const immersionOfferRepository = new InMemoryImmersionOfferRepository();
    const searchesMadeRepository = new InMemorySearchesMadeRepository();
    const searchImmersion = new SearchImmersion(
      searchesMadeRepository,
      immersionOfferRepository,
    );
    const siret = "78000403200019";
    const immersionOfferId = "13df03a5-a2a5-430a-b558-ed3e2f03536d";
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withContactMode("EMAIL")
      .withAddress("55 Rue du Faubourg Saint-Honoré")
      .withNaf("8539A")
      .build();
    const immersionOffer = new ImmersionOfferEntityV2Builder()
      .withId(immersionOfferId)
      .withRome("M1607")
      .build();
    const contact = new ContactEntityV2Builder().build();

    await immersionOfferRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContacts([contact])
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);
    const unauthenticatedResponse = await searchImmersion.execute({
      rome: "M1607",
      nafDivision: "85",
      distance_km: 30,
      location: {
        lat: 49.119146,
        lon: 6.17602,
      },
    });

    const expectedResponse: SearchImmersionResultDto[] = [
      {
        id: immersionOfferId,
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company inside repository",
        voluntaryToImmersion: false,
        location: TEST_POSITION,
        address: "55 Rue du Faubourg Saint-Honoré",
        contactMode: "EMAIL",
        distance_m: 606885,
        city: TEST_CITY,
        nafLabel: TEST_NAF_LABEL,
        romeLabel: TEST_ROME_LABEL,
        contactDetails: undefined,
      },
    ];
    expect(unauthenticatedResponse).toEqual(expectedResponse);

    expect(searchesMadeRepository.searchesMade).toEqual([
      {
        rome: "M1607",
        nafDivision: "85",
        lat: 49.119146,
        lon: 6.17602,
        distance_km: 30,
      },
    ]);

    const authenticatedResponse = await searchImmersion.execute(
      {
        rome: "M1607",
        nafDivision: "85",
        distance_km: 30,
        location: {
          lat: 49.119146,
          lon: 6.17602,
        },
      },
      {
        consumer: "passeEmploi",
        id: "my-valid-apikey-id",
        exp: new Date("2022-01-01").getTime(),
        iat: new Date("2021-12-20").getTime(),
      },
    );
    const expectedAuthResponse: SearchImmersionResultDto = {
      ...expectedResponse[0],
      contactDetails: {
        id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
        firstName: "Alain",
        lastName: "Prost",
        email: "alain.prost@email.fr",
        role: "le big boss",
        phone: "0612345678",
      },
    };
    expect(authenticatedResponse).toEqual([expectedAuthResponse]);
  });
});
