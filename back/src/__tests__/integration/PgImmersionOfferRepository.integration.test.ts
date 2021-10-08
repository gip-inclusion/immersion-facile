import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersion } from "../../domain/searchImmersion/useCases/SearchImmersion";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../domain/core/ports/AccessTokenGateway";
import {
  LaBonneBoiteGateway,
  EstablishmentFromLaBonneBoite,
  HttpCallsToLaBonneBoite,
  httpCallToLaBonneBoite,
} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";

import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import {} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import {
  httpCallToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
  EstablishmentFromLaPlateFormeDeLInclusion,
  HttpCallsToLaPlateFormeDeLInclusion,
} from "../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { EstablishmentEntity } from "../../domain/searchImmersion/entities/EstablishmentEntity";
import { UncompleteEstablishmentEntity } from "../../domain/searchImmersion/entities/UncompleteEstablishmentEntity";
import { SearchParams } from "../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaPlateFormeDeLInclusion";
import { fakeEstablishmentsLaBonneBoite } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaBonneBoite";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/PoleEmploiAccessTokenGateway";
import { ENV } from "../../adapters/primary/environmentVariables";
import { Client } from "pg";

const host = ENV.ci ? "postgres" : "localhost";
const testPgUrl = `postgresql://postgres:pg-password@${host}:5432/immersion-db`;
const client = new Client(testPgUrl);

const fakeHttpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getEstablishments: async (
    searchParams: SearchParams,
    accessToken: String,
  ) => {
    const returnedEstablishments: EstablishmentFromLaBonneBoite[] =
      fakeEstablishmentsLaBonneBoite;
    return returnedEstablishments;
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
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  test("Search immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
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
  });

  test("Search La Plateforme de l'inclusion works", async () => {
    const fakeHttpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
      {
        getEstablishments: async (searchParams: SearchParams) => {
          const returnedEstablishments: [
            EstablishmentFromLaPlateFormeDeLInclusion[],
            String,
          ] = [fakeEstablishmentsLaPlateFormeDeLInclusion, ""];
          return returnedEstablishments;
        },
        getNextEstablishments: async (url: string) => [],
      };
    const laPlateFormeDeLInclusionGateway = new LaPlateFormeDeLInclusionGateway(
      fakeHttpCallToLaPlateFormeDeLInclusion,
    );
    const uncompleteEstablishments =
      await laPlateFormeDeLInclusionGateway.getEstablishments({
        ROME: "M1607",
        distance: 30,
        lat: 49.119146,
        lon: 6.17602,
      });
    //console.log(uncompleteEstablishments);
    expect(uncompleteEstablishments[0]).toBeInstanceOf(
      UncompleteEstablishmentEntity,
    );
  });

  //TODO LIMIT 10

  test("GetAll immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
    const results = await pgImmersionOfferRepository.getAll();
    expect(results).toBeInstanceOf(Array);
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

    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
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

    await pgImmersionOfferRepository.insertImmersions(immersions);

    const savedImmersionOffers = await client.query(
      `SELECT * FROM immersion_proposals`,
    );
    console.log(savedImmersionOffers);
    expect(savedImmersionOffers).toEqual(immersions);
  });
});
