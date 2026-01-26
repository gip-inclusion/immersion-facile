import type {
  ExternalOfferDto,
  GeoPositionDto,
  RomeDto,
  SiretDto,
} from "shared";
import { distanceBetweenCoordinatesInMeters } from "../../../../utils/distanceBetweenCoordinatesInMeters";

export type LaBonneBoiteApiResultV2Props = {
  rome: string | undefined;
  id: number;
  siret: SiretDto;
  email: string;
  company_name: string;
  headcount_min: number;
  headcount_max: number;
  naf: string;
  naf_label: string;
  location: {
    lat: number;
    lon: number;
  };
  city: string;
  postcode: string;
  department_number: string;
};

// Careful, value objects should be immutable
export class LaBonneBoiteCompanyDto {
  constructor(public readonly props: LaBonneBoiteApiResultV2Props) {}

  public isCompanyRelevant(): boolean {
    const companyNaf = this.props.naf;
    const rome = this.props.rome;
    // those conditions are business specific, see with Nathalie for any questions
    const isNafInterim = companyNaf === "7820Z";

    const isNafAutreServiceWithRomeElevageOrToilettage =
      rome &&
      companyNaf.startsWith("9609") &&
      ["A1503", "A1408"].includes(rome);

    const isNafRestaurationRapideWithRomeBoulangerie =
      companyNaf === "5610C" && rome === "D1102";

    const isRomeIgnoredForPublicAdministration =
      companyNaf.startsWith("8411") &&
      rome &&
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

    return !establishmentShouldBeIgnored;
  }

  public get siret() {
    return this.props.siret;
  }

  public toSearchResult(
    romeDto: RomeDto,
    searchedCoordinate?: GeoPositionDto,
  ): ExternalOfferDto {
    return {
      address: {
        city: this.props.city,
        postcode: this.props.postcode,
        streetNumberAndAddress: "",
        departmentCode: this.props.department_number,
      },
      appellations: [],
      ...(searchedCoordinate
        ? {
            distance_m: distanceBetweenCoordinatesInMeters(
              searchedCoordinate,
              this.props.location,
            ),
          }
        : {}),
      establishmentScore: 0,
      locationId: null,
      naf: this.props.naf,
      nafLabel: this.props.naf_label,
      name: this.props.company_name,
      numberOfEmployeeRange: `${this.props.headcount_min}-${this.props.headcount_max}`,
      position: { lat: this.props.location.lat, lon: this.props.location.lon },
      rome: romeDto.romeCode,
      romeLabel: romeDto.romeLabel,
      siret: this.props.siret,
      urlOfPartner: `https://labonneboite.francetravail.fr/entreprise/${this.props.siret}`,
      voluntaryToImmersion: false,
      fitForDisabledWorkers: null,
    };
  }
}
