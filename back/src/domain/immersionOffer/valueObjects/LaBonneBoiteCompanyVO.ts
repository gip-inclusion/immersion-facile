import { NafDto } from "../../../shared/naf";
import { createLogger } from "../../../utils/logger";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../entities/EstablishmentEntity";

const logger = createLogger(__filename);

export type LaBonneBoiteCompanyProps = {
  address: string;
  city: string;
  lat: number;
  lon: number;
  matched_rome_code: string;
  naf: string;
  naf_text: string;
  name: string;
  siret: string;
  stars: number;
  raison_sociale: string;
  url: string; // URL to the company reference page on LaBonneBoite
  headcount_text: string; // Libelle of nb of employees
  distance: number; // Distance to searched geographical position
  alternance: boolean; // Whether or not the company accepts alternance contracts
  contact_mode: string; // | "Envoyez votre candidature par mail" | "Se présenter spontanément" | "Postulez via le site internet de l'entreprise" |  "Envoyer un CV et une lettre de motivation"
};

// Careful, value objects should be immutable
export class LaBonneBoiteCompanyVO {
  constructor(public readonly props: LaBonneBoiteCompanyProps) {}

  public get siret() {
    return this.props.siret;
  }

  public toEstablishmentAggregate(
    uuidGenerator: UuidGenerator,
    updatedAt?: Date,
    extraData?: {
      nafDto?: NafDto;
      numberEmployeesRange?: TefenCode;
    },
  ): EstablishmentAggregate {
    const establishment: EstablishmentEntityV2 = {
      address: this.props.address,
      position: {
        lat: this.props.lat,
        lon: this.props.lon,
      },
      nafDto: extraData?.nafDto ?? { code: this.props.naf, nomenclature: "" }, // Unknown nomenclature (would required to call sirene API)
      dataSource: "api_labonneboite",
      name: this.props.name,
      siret: this.props.siret,
      voluntaryToImmersion: false,
      numberEmployeesRange: extraData?.numberEmployeesRange ?? -1,
      isActive: true,
      updatedAt,
    };

    return {
      establishment,
      immersionOffers: [
        {
          id: uuidGenerator.new(),
          romeCode: this.props.matched_rome_code,
          score: this.props.stars,
        },
      ],
    };
  }

  public isCompanyRelevant(): boolean {
    const companyNaf = this.props.naf;
    const rome = this.props.matched_rome_code;
    // those conditions are business specific, see with Nathalie for any questions
    const isNafInterim = companyNaf === "7820Z";

    const isNafAutreServiceWithRomeElevageOrToilettage =
      companyNaf.startsWith("9609") && ["A1503", "A1408"].includes(rome);

    const isNafRestaurationRapideWithRomeBoulangerie =
      companyNaf == "5610C" && rome == "D1102";

    const isRomeIgnoredForPublicAdministration =
      companyNaf.startsWith("8411") &&
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
      ].includes(rome);

    const establishmentShouldBeIgnored =
      isNafInterim ||
      isNafAutreServiceWithRomeElevageOrToilettage ||
      isNafRestaurationRapideWithRomeBoulangerie ||
      isRomeIgnoredForPublicAdministration;

    if (establishmentShouldBeIgnored) {
      logger.info({ company: companyNaf }, "Not relevant, discarding.");
      return false;
    } else {
      logger.debug({ company: companyNaf }, "Relevant.");
      return true;
    }
  }
}
