import { FormEstablishmentDto } from "../shared/FormEstablishmentDto";
import { Builder } from "./Builder";

const validFormEstablishment: FormEstablishmentDto = {
  id: "test_demande_immersion_id",
  businessAddress: "Quelque part",
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
  preferredContactMethods: ["EMAIL"],
  siret: "01234567890123",
  professions: [
    {
      romeCodeMetier: "A1111",
      description: "Boulangerie",
    },
    {
      romeCodeAppellation: "22222",
      description: "Boucher / Bouchère",
    },
  ],
};

const emptyFormEstablishment: FormEstablishmentDto = {
  id: "",
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

  public withId(id: string) {
    return new FormEstablishmentDtoBuilder({ ...this.dto, id });
  }

  public build() {
    return this.dto;
  }
}
