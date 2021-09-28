import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersionByCandidate } from "../../domain/searchImmersion/useCases/SearchImmersionByCandidate";
import { LaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { FakeLaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/FakeLaBonneBoiteGateway";
import { LaPlateFormeDeLInclusionGateway } from "../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { CompanyEntity } from "../../domain/searchImmersion/entities/CompanyEntity";

describe("Postgres implementation of immersion proposal repository", () => {
  test("Search immersion works", async () => {
    const laBonneBoiteGateway = new FakeLaBonneBoiteGateway();

    const searchImmersion = new SearchImmersionByCandidate(laBonneBoiteGateway);
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    expect(immersions[0]).toBeInstanceOf(ImmersionOfferEntity);
  });

  test.skip("Search La Plateforme de l'inclusion works", async () => {
    jest.setTimeout(30000);
    const laPlateFormeDeLInclusionGateway =
      new LaPlateFormeDeLInclusionGateway();
    const companies = await laPlateFormeDeLInclusionGateway.getCompanies({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    console.log(companies.length);
    const cleanedCompanies =
      await laPlateFormeDeLInclusionGateway.cleanCompanyData(companies);
    expect(cleanedCompanies[0]).toBeInstanceOf(CompanyEntity);
  }, 30000);

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

    const searchImmersion = new SearchImmersionByCandidate(laBonneBoiteGateway);
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    pgImmersionOfferRepository.connect();

    var result = await pgImmersionOfferRepository.insertImmersions(immersions);
    console.log(result);
    //We inserted all the immersions
    expect(result.command).toEqual("INSERT");
  });
});
