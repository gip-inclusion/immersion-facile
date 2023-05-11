import Bottleneck from "bottleneck";
import { SiretDto, SiretEstablishmentDto } from "shared";
import { HttpClient } from "http-client";
import { SiretGateway } from "../../../domain/sirene/ports/SirenGateway";
import {
  AnnuaireDesEntreprisesSiretEstablishment,
  type AnnuaireDesEntreprisesSiretTargets,
} from "./AnnuaireDesEntreprisesSiretGateway.targets";

const adeMaxQueryPerSeconds = 7;
export const nonDiffusibleEstablishmentName = "NON-DIFFUSIBLE";
export class AnnuaireDesEntreprisesSiretGateway implements SiretGateway {
  constructor(
    private httpClient: HttpClient<AnnuaireDesEntreprisesSiretTargets>,
    private fallbackGateway: SiretGateway,
  ) {}

  private limiter = new Bottleneck({
    reservoir: adeMaxQueryPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: adeMaxQueryPerSeconds,
  });

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SiretEstablishmentDto | undefined> {
    // https://api.gouv.fr/les-api/api-recherche-entreprises
    const response = await this.limiter.schedule(async () =>
      this.httpClient.search({
        queryParams: {
          q: siret,
        },
      }),
    );
    const formattedResult = convertAdeEstablishmentToSirenEstablishmentDto(
      response.responseBody.results[0],
    );
    if (
      formattedResult.businessName
        .trim()
        .toUpperCase()
        .includes(nonDiffusibleEstablishmentName)
    ) {
      return this.fallbackGateway.getEstablishmentBySiret(siret);
    }
    if (includeClosedEstablishments) return formattedResult;
    if (formattedResult.isOpen) return formattedResult;
  }
}

export const convertAdeEstablishmentToSirenEstablishmentDto = (
  adeEstablishment: AnnuaireDesEntreprisesSiretEstablishment,
): SiretEstablishmentDto => ({
  siret: adeEstablishment.matching_etablissements[0].siret,
  businessName: adeEstablishment.matching_etablissements[0].nom_commercial,
  businessAddress: adeEstablishment.matching_etablissements[0].adresse,
  nafDto: {
    code: adeEstablishment.activite_principale.replace(".", ""),
    nomenclature: "NAFRev2",
  },
  numberEmployeesRange: getNumberEmployeesRange(
    adeEstablishment.tranche_effectif_salarie
      ? parseInt(adeEstablishment.tranche_effectif_salarie)
      : null,
  ),
  isOpen:
    adeEstablishment.matching_etablissements[0].etat_administratif === "A",
});

export const numberEmployeesRanges = [
  "",
  "0",
  "1-2",
  "3-5",
  "6-9",
  "10-19",
  "20-49",
  "50-99",
  "100-199",
  "200-249",
  "250-499",
  "500-999",
  "1000-1999",
  "2000-4999",
  "5000-9999",
  "+10000",
] as const;
type NumberEmployeesRange = (typeof numberEmployeesRanges)[number];

const getNumberEmployeesRange = (
  numberEmployees: number | null,
): NumberEmployeesRange => {
  if (numberEmployees === null) return "";
  if (numberEmployees === 0) return "0";
  if (numberEmployees === 1 || numberEmployees === 2) return "1-2";
  if (numberEmployees >= 3 && numberEmployees <= 5) return "3-5";
  if (numberEmployees >= 6 && numberEmployees <= 9) return "6-9";
  if (numberEmployees >= 10 && numberEmployees <= 19) return "10-19";
  if (numberEmployees >= 20 && numberEmployees <= 49) return "20-49";
  if (numberEmployees >= 50 && numberEmployees <= 99) return "50-99";
  if (numberEmployees >= 100 && numberEmployees <= 199) return "100-199";
  if (numberEmployees >= 200 && numberEmployees <= 249) return "200-249";
  if (numberEmployees >= 250 && numberEmployees <= 499) return "250-499";
  if (numberEmployees >= 500 && numberEmployees <= 999) return "500-999";
  if (numberEmployees >= 1000 && numberEmployees <= 1999) return "1000-1999";
  if (numberEmployees >= 2000 && numberEmployees <= 4999) return "2000-4999";
  if (numberEmployees >= 5000 && numberEmployees <= 9999) return "5000-9999";
  if (numberEmployees >= 10000) return "+10000";
  return "";
};
