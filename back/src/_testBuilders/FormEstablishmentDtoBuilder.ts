import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "../shared/FormEstablishmentDto";
import { ProfessionDto } from "../shared/rome";
import { SiretDto } from "../shared/siret";
import { Builder } from "./Builder";

const validFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddress: "1 Rue du Moulin 12345 Quelque Part",
  businessContacts: [
    {
      email: "amil@mail.com",
      firstName: "Esteban",
      lastName: "Ocon",
      phone: "+33012345678",
      job: "a job",
    },
  ],
  naf: { code: "A", nomenclature: "nomenclature code A" },
  businessName: "Ma super entreprise",
  businessNameCustomized: "Ma belle enseigne du quartier",
  isEngagedEnterprise: false,
  preferredContactMethods: ["EMAIL"],
  siret: "01234567890123",
  professions: [
    {
      romeCodeMetier: "A1111",
      description: "Boulangerie",
    },
    {
      romeCodeMetier: "B9112",
      description: "Patissier",
    },
    {
      romeCodeMetier: "D1103",
      romeCodeAppellation: "22222",
      description: "Boucher / Bouchère",
    },
  ],
};

const emptyFormEstablishment: FormEstablishmentDto = {
  source: "immersion-facile",
  businessAddress: "",
  naf: { code: "", nomenclature: "" },
  preferredContactMethods: [],
  businessContacts: [],
  businessName: "",
  siret: "",
  professions: [],
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
      businessContacts: [{ ...this.dto.businessContacts[0], email }],
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
  public withProfessions(professions: ProfessionDto[]) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, professions });
  }
  public withBusinessContacts(businessContacts: ContactEntityV2[]) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, businessContacts });
  }
  public build() {
    return this.dto;
  }
}
