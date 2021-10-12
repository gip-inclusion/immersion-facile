import {
  HttpCallsToLaBonneBoite,
  EstablishmentFromLaBonneBoite,
  LaBonneBoiteGateway,
} from "../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { Position } from "../domain/searchImmersion/entities/EstablishmentEntity";

import { SearchParams } from "../domain/searchImmersion/ports/ImmersionOfferRepository";
import { fakeEstablishmentsLaBonneBoite } from "../adapters/secondary/searchImmersion/fakeEstablishmentsLaBonneBoite";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../domain/core/ports/AccessTokenGateway";
import {
  HttpCallsToLaPlateFormeDeLInclusion,
  EstablishmentFromLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../adapters/secondary/searchImmersion/fakeEstablishmentsLaPlateFormeDeLInclusion";
import {
  GetPosition,
  GetExtraEstablishmentInfos,
  ExtraEstablishmentInfos,
} from "../domain/searchImmersion/entities/UncompleteEstablishmentEntity";

export const fakeHttpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getEstablishments: async (
    searchParams: SearchParams,
    accessToken: string,
  ) => {
    const returnedEstablishments: EstablishmentFromLaBonneBoite[] =
      fakeEstablishmentsLaBonneBoite;
    return returnedEstablishments;
  },
};

export const fakeAccessTokenGateway: AccessTokenGateway = {
  getAccessToken: async (scope: string) => {
    const response: GetAccessTokenResponse = {
      access_token: "",
      expires_in: -1,
    };
    return response;
  },
};

export const fakeLaBonneBoiteGateway = new LaBonneBoiteGateway(
  fakeAccessTokenGateway,
  "poleEmploiClientId",
  fakeHttpCallToLaBonneBoite,
);

export const fakeHttpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getEstablishments: async (searchParams: SearchParams) => {
      const returnedEstablishments: [
        EstablishmentFromLaPlateFormeDeLInclusion[],
        string,
      ] = [fakeEstablishmentsLaPlateFormeDeLInclusion, ""];
      return returnedEstablishments;
    },
    getNextEstablishments: async (url: string) => [],
  };

export const fakeLaPlateFormeDeLInclusionGateway =
  new LaPlateFormeDeLInclusionGateway(fakeHttpCallToLaPlateFormeDeLInclusion);

export const fakeGetPosition: GetPosition = async (address: string) => {
  const returnedPosition: Position = { lat: 49.119146, lon: 6.17602 };
  return returnedPosition;
};

export const fakeGetExtraEstablishmentInfos: GetExtraEstablishmentInfos =
  async (siret: string) => {
    const returnedExtraEstablishmentInfos: ExtraEstablishmentInfos = {
      naf: "8559A",
      numberEmployeesRange: 1,
    };
    return returnedExtraEstablishmentInfos;
  };
