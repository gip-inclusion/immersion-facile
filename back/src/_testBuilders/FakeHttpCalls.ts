import {
  HttpCallsToLaBonneBoite,
  EstablishmentFromLaBonneBoite,
  LaBonneBoiteGateway,
} from "../adapters/secondary/immersionOffer/LaBonneBoiteGateway";
import { Position } from "../domain/immersionOffer/entities/EstablishmentEntity";

import { SearchParams } from "../domain/immersionOffer/ports/ImmersionOfferRepository";
import { fakeEstablishmentsLaBonneBoite } from "../adapters/secondary/immersionOffer/fakeEstablishmentsLaBonneBoite";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../domain/core/ports/AccessTokenGateway";
import {
  HttpCallsToLaPlateFormeDeLInclusion,
  EstablishmentFromLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../adapters/secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../adapters/secondary/immersionOffer/fakeEstablishmentsLaPlateFormeDeLInclusion";
import {
  GetPosition,
  GetExtraEstablishmentInfos,
  ExtraEstablishmentInfos,
} from "../domain/immersionOffer/entities/UncompleteEstablishmentEntity";

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
