import { Builder } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { ContactEntity } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { ContactEntityBuilder } from "./ContactEntityBuilder";
import { EstablishmentEntityBuilder } from "./EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "./ImmersionOfferEntityV2Builder";

const validEstablishmentAggregate: EstablishmentAggregate = {
  establishment: new EstablishmentEntityBuilder().build(),
  immersionOffers: [new ImmersionOfferEntityV2Builder().build()],
  contact: new ContactEntityBuilder().build(),
};

export class EstablishmentAggregateBuilder
  implements Builder<EstablishmentAggregate>
{
  constructor(
    private readonly aggregate: EstablishmentAggregate = validEstablishmentAggregate,
  ) {}

  public withEstablishment(establishment: EstablishmentEntity) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment,
    });
  }

  public withEstablishmentUpdatedAt(updatedAt: Date) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withUpdatedAt(updatedAt)
        .build(),
    });
  }

  public withImmersionOffers(immersionOffers: ImmersionOfferEntityV2[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      immersionOffers,
    });
  }

  public withContact(contact: ContactEntity) {
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
      establishment: new EstablishmentEntityBuilder().withSiret(siret).build(),
    });
  }
  public withContactId(id: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact: new ContactEntityBuilder().withId(id).build(),
    });
  }
  public withGeneratedContactId() {
    return this.withContactId(new UuidV4Generator().new());
  }

  public withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withMaxContactsPerWeek(maxContactsPerWeek)
        .build(),
    });
  }

  public withIsSearchable(isSearchable: boolean) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withIsSearchable(isSearchable)
        .build(),
    });
  }

  build() {
    return this.aggregate;
  }
}
