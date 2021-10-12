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
import { Position } from "../../domain/searchImmersion/entities/EstablishmentEntity";
import {
  UncompleteEstablishmentEntity,
  GetPosition,
  GetExtraEstablishmentInfos,
  ExtraEstablishmentInfos,
} from "../../domain/searchImmersion/entities/UncompleteEstablishmentEntity";
import { SearchParams } from "../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaPlateFormeDeLInclusion";
import { fakeEstablishmentsLaBonneBoite } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaBonneBoite";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/PoleEmploiAccessTokenGateway";
import { ENV } from "../../adapters/primary/environmentVariables";
import { Client } from "pg";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../domain/searchImmersion/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import {
  fakeLaBonneBoiteGateway,
  fakeLaPlateFormeDeLInclusionGateway,
  fakeGetPosition,
  fakeGetExtraEstablishmentInfos,
} from "../../_testBuilders/FakeHttpCalls";
const host = ENV.ci ? "postgres" : "localhost";
const testPgUrl = `postgresql://postgres:pg-password@${host}:5432/immersion-db`;
const client = new Client(testPgUrl);

describe("Postgres implementation of immersion proposal repository", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  test("Search immersion works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

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

  test("Insert search works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    //TODO assertion
  });
});
