import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersion } from "../../domain/searchImmersion/useCases/SearchImmersion";
import { LaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { FakeLaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/FakeLaBonneBoiteGateway";
import { LaPlateFormeDeLInclusionGateway } from "../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { CompanyEntity } from "../../domain/searchImmersion/entities/CompanyEntity";
import { FakeLaPlateFormeDeLInclusionGateway } from "../../adapters/secondary/searchImmersion/FakeLaPlateFormeDeLInclusionGateway";
import { UncompleteCompanyEntity } from "../../domain/searchImmersion/entities/UncompleteCompanyEntity";

describe("Postgres implementation of immersion proposal repository", () => {
  test("Search immersion works", async () => {
    const laBonneBoiteGateway = new FakeLaBonneBoiteGateway();

    const searchImmersion = new SearchImmersion(laBonneBoiteGateway);
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    expect(immersions[0]).toBeInstanceOf(ImmersionOfferEntity);
  });

  test("Search La Plateforme de l'inclusion works", async () => {
    const fakeLaPlateFormeDeLInclusionGateway =
      new FakeLaPlateFormeDeLInclusionGateway();
    const uncompleteCompanies =
      await fakeLaPlateFormeDeLInclusionGateway.getCompanies({
        ROME: "M1607",
        distance: 30,
        lat: 49.119146,
        long: 6.17602,
      });

    expect(uncompleteCompanies[0]).toBeInstanceOf(UncompleteCompanyEntity);
  });

  test.skip("GetAll immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository();
    pgImmersionOfferRepository.connect();
    const results = await pgImmersionOfferRepository.getAll();
    expect(results).toBeInstanceOf(Array);
  });

  //TODO fake

  test.skip("Insert immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository();
    const laBonneBoiteGateway = new LaBonneBoiteGateway(
      new PoleEmploiAPIGateway(),
    );

    const searchImmersion = new SearchImmersion(laBonneBoiteGateway);
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    pgImmersionOfferRepository.connect();

    const result = await pgImmersionOfferRepository.insertImmersions(
      immersions,
    );
    console.log(result);
    //We inserted all the immersions
    expect(result.command).toEqual("INSERT");
  });
});
