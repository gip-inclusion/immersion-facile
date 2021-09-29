import { ImmersionOfferDto } from "../shared/ImmersionOfferDto";
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
      professions: [{ romeCodeMetier: "C3333", label: "Menuisier" }],
      job: "a job",
    },
    {
      email: "sarah@mail.com",
      firstName: "Sarah",
      lastName: "Connor",
      phone: "+3301",
      professions: [{ romeCodeMetier: "D4444", label: "Vendeur" }],
      job: "XYZ - Terminator's terminator",
    },
  ],
  businessName: "Ma super entreprise",
  businessSectorCode: "A",
  preferredContactMethods: ["IN_PERSON", "EMAIL"],
  siret: "01234567890123",
  professions: [
    { romeCodeMetier: "A1111", label: "Boulanger" },
    { romeCodeMetier: "B2222", label: "Boucher" },
  ],
};

const emptyImmersionOffer: ImmersionOfferDto = {
  id: "",
  businessAddress: "",
  preferredContactMethods: [],
  businessContacts: [],
  businessSectorCode: "0",
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
