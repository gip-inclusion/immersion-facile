import { SearchResultDto, SiretDto, addressStringToDto } from "shared";

export type LaBonneBoiteApiResultV2Props = {
  // pas d'adresse ?
  rome: string;
  id: number;
  siret: SiretDto;
  email: string;
  company_name: string;
  office_name: string;
  headcount_min: number;
  headcount_max: number;
  naf: string;
  naf_label: string;
  location: {
    lat: number;
    lon: number;
  };
  city: string;
  citycode: string;
  postcode: string;
  department: string;
  region: string;
  department_number: string;
  hiring_potential: number;
  is_high_potential: boolean;
};

export type LaBonneBoiteApiResultV1Props = {
  address: string;
  city: string;
  lat: number;
  lon: number;
  matched_rome_code: string;
  matched_rome_label: string;
  naf: string;
  naf_text: string;
  name: string;
  siret: SiretDto;
  stars: number;
  raison_sociale: string;
  url: string; // URL to the company reference page on LaBonneBoite
  social_network: string; // Lien vers réseaux sociaux
  website: string; // URL vers la page de l'entreprise
  headcount_text: string; // Libelle of nb of employees
  distance: number; // Distance to searched geographical position
  alternance: boolean; // Whether or not the company accepts alternance contracts
  boosted: boolean;
  contact_mode: string; // | "Envoyez votre candidature par mail" | "Se présenter spontanément" | "Postulez via le site internet de l'entreprise" |  "Envoyer un CV et une lettre de motivation"
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
      companyNaf.startsWith("9609") && ["A1503", "A1408"].includes(rome);

    const isNafRestaurationRapideWithRomeBoulangerie =
      companyNaf === "5610C" && rome === "D1102";

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

    return !establishmentShouldBeIgnored;
  }

  public get siret() {
    return this.props.siret;
  }

  public toSearchResult(): SearchResultDto {
    return {
      siret: this.props.siret,
      establishmentScore: 0,
      name: this.props.company_name,
      address: addressStringToDto(this.props.address), // ????
      additionalInformation: "",
      appellations: [],
      customizedName: "",
      distance_m: this.props.distance * 1000, // ????
      fitForDisabledWorkers: false,
      naf: this.props.naf,
      nafLabel: this.props.naf_label,
      numberOfEmployeeRange: `${this.props.headcount_min}-${this.props.headcount_max}`,
      position: {
        lat: this.props.location.lat,
        lon: this.props.location.lon,
      },
      rome: this.props.rome,
      romeLabel: this.props.matched_rome_label, // ????
      urlOfPartner: this.props.url, // ????
      voluntaryToImmersion: false,
      website: "",
      locationId: null,
    };
  }
}
