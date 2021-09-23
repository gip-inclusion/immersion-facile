import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersionByCandidate } from "../../domain/searchImmersion/useCases/SearchImmersionByCandidate";
import { LaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import { PoleEmploiAPIGateway } from "../../adapters/secondary/searchImmersion/PoleEmploiAPIGateway";
import { FakeLaBonneBoiteGateway } from "../../adapters/secondary/searchImmersion/FakeLaBonneBoiteGateway";

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

  test.skip("GetAll immersion works", async () => {
    const pgImmersionProposalRepository = new PgImmersionOfferRepository();
    pgImmersionProposalRepository.connect();
    const results = await pgImmersionProposalRepository.getAll();
    expect(results).toBeInstanceOf(Array);
  });
  //TODO fake
  /*
  test("Insert immersion works", async () => {
    const pgImmersionProposalRepository = new pgImmersionProposalRepository();
    const laBonneBoiteGateway = new LaBonneBoiteGateway(new PoleEmploiAPIGateway());

    const searchImmersion = new SearchImmersionByCandidate(laBonneBoiteGateway);
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      long: 6.17602,
    });
    pgImmersionProposalRepository.connect();

    var result = await pgImmersionProposalRepository.insertImmersions(
      immersions
    );

    //We inserted all the immersions
    expect(result.command).toEqual("INSERT");
  });*/
});
