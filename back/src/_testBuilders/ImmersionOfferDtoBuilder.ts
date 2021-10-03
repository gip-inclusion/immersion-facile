import { ImmersionOfferDto } from "../shared/ImmersionOfferDto";
import { ProfessionDto } from "../shared/rome";
import { Builder } from "./Builder";

const valideImmersionOffer: ImmersionOfferDto = {
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

const emptyImmersionOffer: ImmersionOfferDto = {
  id: "",
  businessAddress: "",
  naf: { code: "", nomenclature: "" },
  preferredContactMethods: [],
  businessContacts: [],
  businessName: "",
  siret: "",
  professions: [],
};

export class ImmersionOfferDtoBuilder implements Builder<ImmersionOfferDto> {
  private constructor(private dto: ImmersionOfferDto) {}

  public static valid() {
    return new ImmersionOfferDtoBuilder(valideImmersionOffer);
  }

  public static allEmptyFields() {
    return new ImmersionOfferDtoBuilder(emptyImmersionOffer);
  }

  public withId(id: string) {
    return new ImmersionOfferDtoBuilder({ ...this.dto, id });
  }

  public build() {
    return this.dto;
  }
}
