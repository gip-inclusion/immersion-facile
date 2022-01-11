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
  name: string;
  siret: string;
  stars: number;
};

// Careful, value objects should be immutable
export class LaBonneBoiteCompanyVO {
  constructor(private readonly props: LaBonneBoiteCompanyProps) {}

  public get siret() {
    return this.props.siret;
  }

  public toEstablishmentAggregate(
    uuidGenerator: UuidGenerator,
    extraData?: { naf?: string; numberEmployeesRange?: TefenCode },
  ): EstablishmentAggregate {
    const establishment: EstablishmentEntityV2 = {
      address: this.props.address,
      position: {
        lat: this.props.lat,
        lon: this.props.lon,
      },
      naf: this.props.naf ?? extraData?.naf,
      dataSource: "api_labonneboite",
      name: this.props.name,
      siret: this.props.siret,
      voluntaryToImmersion: false,
      numberEmployeesRange: extraData?.numberEmployeesRange ?? -1,
    };

    return {
      establishment,
      immersionOffers: [
        {
          id: uuidGenerator.new(),
          rome: this.props.matched_rome_code,
          score: this.props.stars,
        },
      ],
      contacts: [],
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
