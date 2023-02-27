import { Builder } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { ContactEntityV2Builder } from "./ContactEntityV2Builder";
import { EstablishmentEntityV2Builder } from "./EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "./ImmersionOfferEntityV2Builder";

const validEstablishmentAggregate: EstablishmentAggregate = {
  establishment: new EstablishmentEntityV2Builder().build(),
  immersionOffers: [new ImmersionOfferEntityV2Builder().build()],
  contact: new ContactEntityV2Builder().build(),
};

export class EstablishmentAggregateBuilder
  implements Builder<EstablishmentAggregate>
{
  constructor(
    private readonly aggregate: EstablishmentAggregate = validEstablishmentAggregate,
  ) {}

  public withEstablishment(establishment: EstablishmentEntityV2) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment,
    });
  }

  public withImmersionOffers(immersionOffers: ImmersionOfferEntityV2[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      immersionOffers,
    });
  }

  public withContact(contact: ContactEntityV2) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact,
    });
  }
  public withoutContact() {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact: undefined,
    });
  }

  public withEstablishmentSiret(siret: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityV2Builder()
        .withSiret(siret)
        .build(),
    });
  }
  public withContactId(id: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact: new ContactEntityV2Builder().withId(id).build(),
    });
  }
  public withGeneratedContactId() {
    return this.withContactId(new UuidV4Generator().new());
  }

  public withMaxContactPerWeek(maxContactPerWeek: number) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityV2Builder(
        this.aggregate.establishment,
      )
        .withMaxContactPerWeek(maxContactPerWeek)
        .build(),
    });
  }
  build() {
    return this.aggregate;
  }
}
