import {
  AddressDto,
  Builder,
  GeoPositionDto,
  NafDto,
  OmitFromExistingKeys,
} from "shared";
import {
  LaBonneBoiteApiResultV2Props,
  LaBonneBoiteCompanyDto,
} from "./LaBonneBoiteCompanyDto";

const validEstablishmentFromLaBonneBoite: LaBonneBoiteApiResultV2Props = {
  city: "SEREMANGE-ERZANGE",
  location: {
    lat: 49.3225,
    lon: 6.08067,
  },
  rome: undefined,
  naf: "8810C",
  company_name: "BLANCHISSERIE LA FENSCH",
  siret: "77561959600155",
  hiring_potential: 4.5,
  citycode: "57647",
  is_high_potential: false,
  postcode: "57290",
  department: "Moselle",
  region: "Grand Est",
  department_number: "57",
  headcount_min: 5,
  headcount_max: 10,
  naf_label: "Activités de services administratifs et de soutien",
  office_name: "BLANCHISSERIE LA FENSCH",
  id: 1000,
  email: "contact@blanchissele.fr",
};

export class LaBonneBoiteCompanyDtoBuilder
  implements Builder<LaBonneBoiteCompanyDto>
{
  constructor(
    private props: LaBonneBoiteApiResultV2Props = validEstablishmentFromLaBonneBoite,
  ) {}

  public build() {
    return new LaBonneBoiteCompanyDto(this.props);
  }

  public withAddress(
    address: OmitFromExistingKeys<AddressDto, "streetNumberAndAddress">,
  ) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      city: address.city,
      postcode: address.postcode,
      department: address.departmentCode,
      department_number: address.departmentCode,
    });
  }

  public withEmployeeRange(
    min: number,
    max: number,
  ): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      headcount_min: min,
      headcount_max: max,
    });
  }

  public withNaf(naf: NafDto): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      naf: naf.code,
      naf_label: naf.nomenclature,
    });
  }

  public withName(name: string) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      company_name: name,
    });
  }

  public withPosition(position: GeoPositionDto) {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      location: position,
    });
  }

  public withRome(rome: string): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      rome,
    });
  }

  public withoutRome(): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      rome: undefined,
    });
  }

  public withSiret(siret: string): LaBonneBoiteCompanyDtoBuilder {
    return new LaBonneBoiteCompanyDtoBuilder({
      ...this.props,
      siret,
    });
  }
}
