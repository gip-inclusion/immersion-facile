import { Builder, GeoPositionDto, NafDto } from "shared";
import {
  LaBonneBoiteApiResultProps,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const validEstablishmentFromLaBonneBoite: LaBonneBoiteApiResultProps = {
  address:
    "Service des ressources humaines,  IMPASSE FENDERIE, 57290 SEREMANGE-ERZANGE",
  city: "SEREMANGE-ERZANGE",
  lat: 49.3225,
  lon: 6.08067,
  matched_rome_code: "M1607",
  matched_rome_label: "Some label",
  naf: "8810C",
  name: "BLANCHISSERIE LA FENSCH",
  siret: "77561959600155",
  stars: 4.5,
  url: "",
  headcount_text: "",
  distance: 10,
  alternance: false,
  contact_mode: "phone",
  raison_sociale: "",
  naf_text: "",
  social_network: "",
  boosted: false,
  website: "",
};

export class LaBonneBoiteCompanyDtoBuilder
  implements Builder<LaBonneBoiteCompanyDto>
{
  constructor(
    private props: LaBonneBoiteApiResultProps = validEstablishmentFromLaBonneBoite,
  ) {}

  public build() {
    return new LaBonneBoiteCompanyDto(this.props);
  }

  public withAddress(address: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      address,
    });
  }

  public withDistanceKm(distance: number): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      distance,
    });
  }

  public withEmployeeRange(employeeRange: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      headcount_text: employeeRange,
    });
  }

  public withNaf(naf: NafDto): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      naf: naf.code,
      naf_text: naf.nomenclature,
    });
  }

  public withName(name: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      name,
    });
  }

  public withPosition(position: GeoPositionDto) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      lat: position.lat,
      lon: position.lon,
    });
  }

  public withRome(rome: string): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      matched_rome_code: rome,
    });
  }

  public withRomeLabel(romeLabel: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      matched_rome_label: romeLabel,
    });
  }

  public withSiret(siret: string): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      siret,
    });
  }

  public withUrlOfPartner(urlOfPartner: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      url: urlOfPartner,
    });
  }
}
