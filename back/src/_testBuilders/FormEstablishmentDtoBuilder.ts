import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "../shared/formEstablishment/FormEstablishment.dto";
import { AppellationDto } from "../shared/romeAndAppellationDtos/romeAndAppellation.dto";

import { SiretDto } from "../shared/siret";
import { Builder } from "./Builder";

const validFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddress: "1 Rue du Moulin 12345 Quelque Part",
  businessContact: {
    email: "amil@mail.com",
    firstName: "Esteban",
    lastName: "Ocon",
    phone: "+33012345678",
    job: "a job",
    contactMethod: "EMAIL",
  },

  naf: { code: "A", nomenclature: "nomenclature code A" },
  businessName: "Ma super entreprise",
  businessNameCustomized: "Ma belle enseigne du quartier",
  isEngagedEnterprise: false,
  siret: "01234567890123",
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
  },
  businessName: "",
  siret: "",
  appellations: [],
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
      appellations: appellations,
    });
  }
  public withBusinessContact(businessContact: ContactEntityV2) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, businessContact });
  }
  public build() {
    return this.dto;
  }
}
