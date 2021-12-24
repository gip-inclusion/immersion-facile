import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { Builder } from "./Builder";
import { ContactEntityV2Builder } from "./ContactEntityV2Builder";
import { EstablishmentEntityV2Builder } from "./EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "./ImmersionOfferEntityV2Builder";

const validEstablishmentAggregate: EstablishmentAggregate = {
  establishment: new EstablishmentEntityV2Builder().build(),
  immersionOffers: [new ImmersionOfferEntityV2Builder().build()],
  contacts: [new ContactEntityV2Builder().build()],
};

export class EstablishmentAggregateBuilder
  implements Builder<EstablishmentAggregate>
{
  constructor(
    private readonly entity: EstablishmentAggregate = validEstablishmentAggregate,
  ) {}

  public withEstablishment(establishment: EstablishmentEntityV2) {
    return new EstablishmentAggregateBuilder({
      ...this.entity,
      establishment,
    });
  }

  public withImmersionOffers(immersionOffers: ImmersionOfferEntityV2[]) {
    return new EstablishmentAggregateBuilder({
      ...this.entity,
      immersionOffers,
    });
  }

  public withContacts(contacts: ContactEntityV2[]) {
    return new EstablishmentAggregateBuilder({
      ...this.entity,
      contacts,
    });
  }

  build() {
    return this.entity;
  }
}
