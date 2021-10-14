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
import {
  Position,
  EstablishmentEntity,
} from "../../domain/searchImmersion/entities/EstablishmentEntity";
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

describe("Postgres implementation of immersion offer repository", () => {
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  test.skip("Insert search works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    expect(
      (
        await pgImmersionOfferRepository.getSearchInDatabase({
          ROME: "M1607",
          distance: 30,
          lat: 49.119146,
          lon: 6.17602,
        })
      )[0].rome,
    ).toBe("M1607");
  });

  test.skip("Insert establishments and retreives them back", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_laplateformedelinclusion",
        numberEmployeesRange: 1,
        position: { lat: 10, lon: 10 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from form",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "form",
        numberEmployeesRange: 1,
        position: { lat: 10, lon: 10 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la bonne boite",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10, lon: 10 },
        naf: "8539A",
      }),
    ]);

    expect(
      (
        await pgImmersionOfferRepository.getEstablishmentFromSiret(
          "78000403200019",
        )
      )[0].name,
    ).toBe("Fake Establishment from form");

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from form",
        voluntary_to_immersion: false,
        data_source: "form",
        contact_in_establishment: undefined,
        score: 4.5,
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from plateforme de l'inclusion",
        voluntary_to_immersion: false,
        data_source: "api_laplateformedelinclusion",
        contact_in_establishment: undefined,
        score: 4.5,
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntary_to_immersion: false,
        data_source: "api_labonneboite",
        contact_in_establishment: undefined,
        score: 4.5,
      }),
    ]);

    expect(
      (
        await pgImmersionOfferRepository.getImmersionsFromSiret(
          "78000403200019",
        )
      )[0].name,
    ).toBe("Company from form");
  });
});
