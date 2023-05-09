import {
  Builder,
  NafDto,
  NumberEmployeesRange,
  SiretEstablishmentDto,
} from "shared";

const validSirenEstablishmentDto: SiretEstablishmentDto = {
  siret: "20006765000016",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  businessName: "MA P'TITE BOITE 2",
  nafDto: {
    code: "8559A",
    nomenclature: "Ref2",
  },
  isOpen: true,
  numberEmployeesRange: "3-5",
};

export class SirenEstablishmentDtoBuilder
  implements Builder<SiretEstablishmentDto>
{
  public constructor(
    private dto: SiretEstablishmentDto = validSirenEstablishmentDto,
  ) {}

  public withSiret(siret: string): SirenEstablishmentDtoBuilder {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      siret,
    });
  }

  public withBusinessName(businessName: string): SirenEstablishmentDtoBuilder {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      businessName,
    });
  }

  public withIsActive(isActive: boolean): SirenEstablishmentDtoBuilder {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      isOpen: isActive,
    });
  }

  public withNafDto(nafDto: NafDto) {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      nafDto,
    });
  }

  public withNumberEmployeesRange(numberEmployeesRange: NumberEmployeesRange) {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      numberEmployeesRange,
    });
  }

  public withBusinessAddress(
    businessAddress: string,
  ): SirenEstablishmentDtoBuilder {
    return new SirenEstablishmentDtoBuilder({
      ...this.dto,
      businessAddress,
    });
  }
  build(): SiretEstablishmentDto {
    return this.dto;
  }
}
