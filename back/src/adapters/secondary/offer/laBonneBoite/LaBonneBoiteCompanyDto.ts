import { addressStringToDto, SearchResultDto, SiretDto } from "shared";

export type LaBonneBoiteApiResultProps = {
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
  constructor(public readonly props: LaBonneBoiteApiResultProps) {}

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

    return !establishmentShouldBeIgnored;
  }

  public get siret() {
    return this.props.siret;
  }

  public toSearchResult(): SearchResultDto {
    return {
      siret: this.props.siret,
      name: this.props.name,
      address: addressStringToDto(this.props.address),
      additionalInformation: "",
      appellations: [],
      customizedName: "",
      distance_m: this.props.distance * 1000,
      fitForDisabledWorkers: false,
      naf: this.props.naf,
      nafLabel: this.props.naf_text,
      numberOfEmployeeRange: this.props.headcount_text
        .replace("salariés", "")
        .replace("salarié", "")
        .trim(),
      position: {
        lat: this.props.lat,
        lon: this.props.lon,
      },
      rome: this.props.matched_rome_code,
      romeLabel: this.props.matched_rome_label,
      urlOfPartner: this.props.url,
      voluntaryToImmersion: false,
      website: "",
    };
  }
}
