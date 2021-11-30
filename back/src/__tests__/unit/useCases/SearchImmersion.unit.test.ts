import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { ImmersionOfferEntity } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchImmersion } from "../../../domain/immersionOffer/useCases/SearchImmersion";

describe("SearchImmersion", () => {
  test("Search immersion works", async () => {
    const immersionOfferRepository = new InMemoryImmersionOfferRepository();

    const searchImmersion = new SearchImmersion(immersionOfferRepository);

    await immersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        score: 4.5,
        position: { lat: 43.8666, lon: 8.3333 },
        address: "55 Rue du Faubourg Saint-Honoré",
        contactInEstablishment: {
          id: "37dd0b5e-3270-11ec-8d3d-0242ac130003",
          name: "Dupont",
          firstname: "Pierre",
          email: "test@email.fr",
          role: "Directeur",
          siretEstablishment: "78000403200019",
          phone: "0640295453",
        },
      }),
    ]);

    const response = await searchImmersion.execute({
      rome: "M1607",
      nafDivision: "85",
      distance_km: 30,
      location: {
        lat: 49.119146,
        lon: 6.17602,
      },
    });

    const searches = immersionOfferRepository.getSearches();
    expect(searches).toEqual([
      {
        rome: "M1607",
        nafDivision: "85",
        lat: 49.119146,
        lon: 6.17602,
        distance_km: 30,
      },
    ]);

    expect(response).toEqual([
      {
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntary_to_immersion: false,
        location: { lat: 43.8666, lon: 8.3333 },
        address: "55 Rue du Faubourg Saint-Honoré",
        contact: {
          id: "37dd0b5e-3270-11ec-8d3d-0242ac130003",
          last_name: "Dupont",
          first_name: "Pierre",
          email: "test@email.fr",
          role: "Directeur",
          phone: "0640295453",
        },
        distance_m: 606885.31,
      },
    ]);
  });
});
