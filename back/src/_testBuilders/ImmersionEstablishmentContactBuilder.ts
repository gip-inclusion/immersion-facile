import { ImmersionEstablishmentContact } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { Builder } from "./Builder";

const validImmersionEstablishmentContact: ImmersionEstablishmentContact = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  name: "Prost",
  firstname: "Alain",
  email: "alain.prost@email.fr",
  role: "le big boss",
  siretEstablishment: "78000403200029",
  phone: "0612345678",
};

export class ImmersionEstablishmentContactBuilder
  implements Builder<ImmersionEstablishmentContact>
{
  public constructor(
    private immersionEstablishmentContact: ImmersionEstablishmentContact = validImmersionEstablishmentContact,
  ) {}

  public withSiret(siretEstablishment: string) {
    return new ImmersionEstablishmentContactBuilder({
      ...this.immersionEstablishmentContact,
      siretEstablishment,
    });
  }

  public build() {
    return { ...this.immersionEstablishmentContact };
  }
}
