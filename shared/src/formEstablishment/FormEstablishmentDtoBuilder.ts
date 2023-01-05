import { Builder } from "../Builder";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import {
  BusinessContactDto,
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "./FormEstablishment.dto";

const validFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddress: "1 Rue du Moulin, 12345 Quelque Part",
  businessContact: {
    email: "amil@mail.com",
    firstName: "Esteban",
    lastName: "Ocon",
    phone: "+33012345678",
    job: "a job",
    contactMethod: "EMAIL",
    copyEmails: ["copy1@mail.com", "copy2@mail.com"],
  },
  naf: { code: "A", nomenclature: "nomenclature code A" },
  businessName: "Ma super entreprise",
  businessNameCustomized: "Ma belle enseigne du quartier",
  isEngagedEnterprise: false,
  fitForDisabledWorkers: false,
  siret: "01234567890123",
  website: "www@super.com/jobs",
  additionalInformation: "",
  isSearchable: true,
  appellations: [
    {
      romeCode: "A1111",
      appellationCode: "11111",
      romeLabel: "Boulangerie",
      appellationLabel: "Boulanger - Boulangère",
    },
    {
      romeCode: "B9112",
      appellationCode: "22222",
      romeLabel: "Patissier",
      appellationLabel: "Patissier - Patissière",
    },
    {
      romeCode: "D1103",
      appellationCode: "33333",
      romeLabel: "Boucherie",
      appellationLabel: "Boucher / Bouchère",
    },
  ],
};

const emptyFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddress: "",
  naf: { code: "", nomenclature: "" },
  businessContact: {
    contactMethod: "EMAIL",
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
    job: "",
    copyEmails: [],
  },
  businessName: "",
  siret: "",
  appellations: [],
  isSearchable: true,
  website: "",
  additionalInformation: "",
};

export class FormEstablishmentDtoBuilder
  implements Builder<FormEstablishmentDto>
{
  private constructor(private dto: FormEstablishmentDto) {}

  public static valid() {
    return new FormEstablishmentDtoBuilder(validFormEstablishment);
  }

  public static allEmptyFields() {
    return new FormEstablishmentDtoBuilder(emptyFormEstablishment);
  }

  public withBusinessAddress(businessAddress: string) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, businessAddress });
  }

  public withFitForDisabledWorkers(fitForDisabledWorkers: boolean) {
    return new FormEstablishmentDtoBuilder({
      ...this.dto,
      fitForDisabledWorkers,
    });
  }

  public withMail(email: string) {
    return new FormEstablishmentDtoBuilder({
      ...this.dto,
      businessContact: { ...this.dto.businessContact, email },
    });
  }

  public withSource(source: FormEstablishmentSource) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, source });
  }
  public withSiret(siret: SiretDto) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, siret });
  }
  public withBusinessName(businessName: string) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, businessName });
  }
  public withAppellations(appellations: AppellationDto[]) {
    return new FormEstablishmentDtoBuilder({
      ...this.dto,
      appellations,
    });
  }
  public withBusinessContact(businessContact: BusinessContactDto) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, businessContact });
  }
  public build() {
    return this.dto;
  }
}
