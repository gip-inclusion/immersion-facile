import { Builder, RomeCode, SearchImmersionResultDto } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { TEST_ROME_LABEL } from "../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
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

  build() {
    return this.aggregate;
  }

  public withContact(contact: ContactEntity | undefined) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact,
    });
  }

  public withContactId(id: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact: new ContactEntityBuilder().withId(id).build(),
    });
  }

  public withEstablishment(establishment: EstablishmentEntity) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment,
    });
  }

  public withEstablishmentLastInseeCheckDate(
    lastInseeCheckDate: Date | undefined,
  ) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withLastInseeCheck(lastInseeCheckDate)
        .build(),
    });
  }

  public withEstablishmentSiret(siret: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder().withSiret(siret).build(),
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

  public withGeneratedContactId() {
    return this.withContactId(new UuidV4Generator().new());
  }

  public withImmersionOffers(immersionOffers: ImmersionOfferEntityV2[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      immersionOffers,
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

  public withoutContact() {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact: undefined,
    });
  }
}

export const establishmentAggregateToSearchResultByRome = (
  establishmentAggregate: EstablishmentAggregate,
  romeCode: RomeCode,
  distance_m?: number,
): SearchImmersionResultDto => ({
  rome: romeCode,
  naf: establishmentAggregate.establishment.nafDto.code,
  nafLabel: establishmentAggregate.establishment.nafDto.nomenclature,
  siret: establishmentAggregate.establishment.siret,
  name: establishmentAggregate.establishment.name,
  numberOfEmployeeRange:
    establishmentAggregate.establishment.numberEmployeesRange,
  voluntaryToImmersion:
    establishmentAggregate.establishment.voluntaryToImmersion,
  additionalInformation:
    establishmentAggregate.establishment.additionalInformation,
  position: establishmentAggregate.establishment.position,
  address: establishmentAggregate.establishment.address,
  contactMode: establishmentAggregate.contact?.contactMethod,
  distance_m,
  romeLabel: TEST_ROME_LABEL,
  website: establishmentAggregate.establishment.website,
  appellations: establishmentAggregate.immersionOffers
    .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
    .map((immersionOffer) => ({
      appellationCode: immersionOffer.appellationCode,
      appellationLabel: immersionOffer.appellationLabel,
    })),
});
