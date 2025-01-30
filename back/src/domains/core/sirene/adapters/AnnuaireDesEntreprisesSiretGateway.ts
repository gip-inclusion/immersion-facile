import Bottleneck from "bottleneck";
import { SiretDto, SiretEstablishmentDto } from "shared";
import { HttpClient } from "shared-routes";
import { SiretGateway } from "../ports/SiretGateway";
import {
  AnnuaireDesEntreprisesSiretEstablishment,
  type AnnuaireDesEntreprisesSiretRoutes,
} from "./AnnuaireDesEntreprisesSiretGateway.routes";
import { getNumberEmployeesRangeByTefenCode } from "./SiretGateway.common";

const adeMaxQueryPerSeconds = 7;
export const nonDiffusibleEstablishmentName = "NON-DIFFUSIBLE";
export class AnnuaireDesEntreprisesSiretGateway implements SiretGateway {
  #limiter = new Bottleneck({
    reservoir: adeMaxQueryPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: adeMaxQueryPerSeconds,
    minTime: adeMaxQueryPerSeconds,
  });

  #httpClient: HttpClient<AnnuaireDesEntreprisesSiretRoutes>;

  #fallbackGateway: SiretGateway;

  constructor(
    httpClient: HttpClient<AnnuaireDesEntreprisesSiretRoutes>,
    fallbackGateway: SiretGateway,
  ) {
    this.#httpClient = httpClient;
    this.#fallbackGateway = fallbackGateway;
  }

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SiretEstablishmentDto | undefined> {
    // https://api.gouv.fr/les-api/api-recherche-entreprises
    return this.#limiter
      .schedule(async () =>
        this.#httpClient.search({
          queryParams: {
            q: siret,
            mtm_campaign: "immersion-facilitee",
          },
        }),
      )
      .then((response) => {
        if (response.status !== 200)
          return this.#fallbackGateway.getEstablishmentBySiret(siret);

        const result = response.body.results.at(0);
        if (!result) return;

        const formattedResult =
          convertAdeEstablishmentToSirenEstablishmentDto(result);

        if (
          formattedResult.businessName
            .trim()
            .toUpperCase()
            .includes(nonDiffusibleEstablishmentName)
        ) {
          return this.#fallbackGateway.getEstablishmentBySiret(siret);
        }
        if (includeClosedEstablishments) return formattedResult;
        if (formattedResult.isOpen) return formattedResult;
      })
      .catch((_) => this.#fallbackGateway.getEstablishmentBySiret(siret));
  }

  public getEstablishmentUpdatedBetween(): Promise<
    Record<SiretDto, SiretEstablishmentDto>
  > {
    throw new Error("Method not implemented. Use insee version please.");
  }
}

export const convertAdeEstablishmentToSirenEstablishmentDto = (
  adeEstablishment: AnnuaireDesEntreprisesSiretEstablishment,
): SiretEstablishmentDto => ({
  siret: adeEstablishment.matching_etablissements[0].siret,
  businessName:
    adeEstablishment.matching_etablissements[0].nom_commercial &&
    adeEstablishment.matching_etablissements[0].nom_commercial?.trim().length >
      0
      ? adeEstablishment.matching_etablissements[0].nom_commercial
      : adeEstablishment.nom_complet,
  businessAddress: adeEstablishment.matching_etablissements[0].adresse,
  nafDto: {
    code: (
      adeEstablishment.activite_principale ??
      adeEstablishment.siege.activite_principale
    ).replace(".", ""),
    nomenclature: "NAFRev2",
  },
  numberEmployeesRange: getNumberEmployeesRangeByTefenCode(
    adeEstablishment.tranche_effectif_salarie ?? undefined,
  ),
  isOpen:
    adeEstablishment.matching_etablissements[0].etat_administratif === "A",
});
