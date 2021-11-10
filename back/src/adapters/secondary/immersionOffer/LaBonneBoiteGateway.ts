import axios from "axios";
import { v4 as uuidV4 } from "uuid";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { EstablishmentsGateway } from "../../../domain/immersionOffer/ports/EstablishmentsGateway";
import type { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";
import { UncompleteEstablishmentEntity } from "../../../domain/immersionOffer/entities/UncompleteEstablishmentEntity";

const logger = createLogger(__filename);

export type EstablishmentFromLaBonneBoite = {
  address: string;
  city: string;
  lat: number;
  lon: number;
  matched_rome_code: string;
  naf: string;
  name: string;
  siret: string;
  stars: number;
};

export type HttpCallsToLaBonneBoite = {
  getEstablishments: (
    searchParams: SearchParams,
    accessToken: string,
  ) => Promise<EstablishmentFromLaBonneBoite[]>;
};

export const httpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getEstablishments: (searchParams: SearchParams, accessToken: string) => {
    const headers = {
      Authorization: "Bearer " + accessToken,
    };

    return axios
      .get(
        "https://api.emploi-store.fr/partenaire/labonneboite/v1/establishment/",

        {
          headers: headers,
          params: {
            distance: searchParams.distance,
            longitude: searchParams.lon,
            latitude: searchParams.lat,
            rome_codes: searchParams.rome,
          },
        },
      )
      .then((response: any) => {
        const establishments: EstablishmentFromLaBonneBoite[] =
          response.data.establishments;
        return establishments;
      });
  },
};

export class LaBonneBoiteGateway implements EstablishmentsGateway {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly httpCallToLaBonneBoite: HttpCallsToLaBonneBoite,
  ) {}

  async getEstablishments(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    const response = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_labonneboitev1`,
    );

    return this.httpCallToLaBonneBoite
      .getEstablishments(searchParams, response.access_token)
      .then((response: any) => {
        const establishments: EstablishmentFromLaBonneBoite[] = response;
        return establishments
          .filter((establishment) =>
            this.keepRelevantEstablishments(searchParams.rome, establishment),
          )
          .map(
            (establishment) =>
              new UncompleteEstablishmentEntity({
                id: uuidV4(),
                address: establishment.address,
                position: { lat: establishment.lat, lon: establishment.lon },
                naf: establishment.naf,
                name: establishment.name,
                siret: establishment.siret,
                score: establishment.stars,
                voluntary_to_immersion: false,
                romes: [establishment.matched_rome_code],
                dataSource: "api_labonneboite",
              }),
          );
      })
      .catch(function (error: any) {
        // handle error
        logger.error(error, "Could not fetch La Bonne Boite API results");
        return [];
      });
  }

  keepRelevantEstablishments(
    romeSearched: string,
    establishment: EstablishmentFromLaBonneBoite,
  ): boolean {
    if (
      (establishment.naf.startsWith("9609") && romeSearched == "A1408") ||
      (establishment.naf == "XXXXX" && romeSearched == "A1503") ||
      (establishment.naf == "5610C" && romeSearched == "D1102") ||
      (establishment.naf.startsWith("8411") && romeSearched == "D1202") ||
      (establishment.naf.startsWith("8411") &&
        [
          "D1202",
          "G1404",
          "G1501",
          "G1502",
          "G1503",
          "G1601",
          "G1602",
          "G1603",
          "G1605",
          "G1802",
          "G1803",
        ].indexOf(romeSearched) > -1)
    ) {
      return false;
    } else {
      return true;
    }
  }
}
