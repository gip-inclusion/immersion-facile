import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersion } from "../../domain/searchImmersion/useCases/SearchImmersion";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../domain/core/ports/AccessTokenGateway";
import {
  LaBonneBoiteGateway,
  CompanyFromLaBonneBoite,
  HttpCallsToLaBonneBoite,
  httpCallToLaBonneBoite,
} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";

import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import {} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import {
  httpCallToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
  CompanyFromLaPlateFormeDeLInclusion,
  HttpCallsToLaPlateFormeDeLInclusion,
} from "../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { CompanyEntity } from "../../domain/searchImmersion/entities/CompanyEntity";
import { UncompleteCompanyEntity } from "../../domain/searchImmersion/entities/UncompleteCompanyEntity";
import { SearchParams } from "../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { fakeCompaniesLaPlateFormeDeLInclusion } from "../../adapters/secondary/searchImmersion/fakeCompaniesLaPlateFormeDeLInclusion";
import { fakeCompaniesLaBonneBoite } from "../../adapters/secondary/searchImmersion/fakeCompaniesLaBonneBoite";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/PoleEmploiAccessTokenGateway";
import { ENV } from "../../adapters/primary/environmentVariables";

const host = ENV.ci ? "postgres" : "localhost";
const testPgUrl = `postgresql://postgres:pg-password@${host}:5432/immersion-db`;

const fakeHttpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getCompanies: async (searchParams: SearchParams, accessToken: String) => {
    var returnedCompanies: CompanyFromLaBonneBoite[] =
      fakeCompaniesLaBonneBoite;
    return returnedCompanies;
  },
};

const fakeAccessTokenGateway: AccessTokenGateway = {
  getAccessToken: async (scope: string) => {
    const response: GetAccessTokenResponse = {
      access_token: "",
      expires_in: -1,
    };
    return response;
  },
};

describe("Postgres implementation of immersion proposal repository", () => {
  test("Search immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(
      testPgUrl,
    );
    const fakeLaBonneBoiteGateway = new LaBonneBoiteGateway(
      fakeAccessTokenGateway,
      "",
      fakeHttpCallToLaBonneBoite,
    );

    const searchImmersion = new SearchImmersion(
      fakeLaBonneBoiteGateway,
      pgImmersionOfferRepository,
    );
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    expect(immersions[0]).toBeInstanceOf(ImmersionOfferEntity);
    await pgImmersionOfferRepository.disconnect();
  });

  test("Search La Plateforme de l'inclusion works", async () => {
    const fakeHttpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
      {
        getCompanies: async (searchParams: SearchParams) => {
          const returnedCompanies: [
            CompanyFromLaPlateFormeDeLInclusion[],
            String,
          ] = [fakeCompaniesLaPlateFormeDeLInclusion, ""];
          return returnedCompanies;
        },
        getNextCompanies: async (url: string) => [],
      };
    const laPlateFormeDeLInclusionGateway = new LaPlateFormeDeLInclusionGateway(
      fakeHttpCallToLaPlateFormeDeLInclusion,
    );
    const uncompleteCompanies =
      await laPlateFormeDeLInclusionGateway.getCompanies({
        ROME: "M1607",
        distance: 30,
        lat: 49.119146,
        lon: 6.17602,
      });
    //console.log(uncompleteCompanies);
    expect(uncompleteCompanies[0]).toBeInstanceOf(UncompleteCompanyEntity);
  });

  //TODO LIMIT 10

  test("GetAll immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(
      testPgUrl,
    );
    pgImmersionOfferRepository.connect();
    const results = await pgImmersionOfferRepository.getAll();
    expect(results).toBeInstanceOf(Array);
    await pgImmersionOfferRepository.disconnect();
  });

  //TODO fake

  test.skip("Insert immersion works", async () => {
    /*const repository = new InMemorySireneRepository();
      const getSiret = new GetSiret({ sireneRepository: repository });
      const featureFlags: FeatureFlags = getFeatureFlags(process.env)
      const repositories = createRepositories(featureFlags);
      const getSiret = new GetSiret({
        sireneRepository: repositories.sirene,
      })*/

    const pgImmersionOfferRepository = new PgImmersionOfferRepository(
      testPgUrl,
    );
    const laBonneBoiteGateway = new LaBonneBoiteGateway(
      fakeAccessTokenGateway,
      "",
      httpCallToLaBonneBoite,
    );

    const searchImmersion = new SearchImmersion(
      laBonneBoiteGateway,
      pgImmersionOfferRepository,
    );
    const immersions = await searchImmersion.execute({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    pgImmersionOfferRepository.connect();

    const result = await pgImmersionOfferRepository.insertImmersions(
      immersions,
    );
    console.log(result);
    //We inserted all the immersions
    expect(result.command).toEqual("INSERT");
    await pgImmersionOfferRepository.disconnect();
  });
});
