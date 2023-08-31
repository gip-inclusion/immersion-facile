import { Builder, RomeCode, SearchResultDto } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { TEST_ROME_LABEL } from "../adapters/secondary/offer/InMemoryEstablishmentAggregateRepository";
import { ContactEntity } from "../domain/offer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../domain/offer/entities/EstablishmentEntity";
import { OfferEntity } from "../domain/offer/entities/OfferEntity";
import { ContactEntityBuilder } from "./ContactEntityBuilder";
import { EstablishmentEntityBuilder } from "./EstablishmentEntityBuilder";
import { OfferEntityBuilder } from "./OfferEntityBuilder";

const validEstablishmentAggregate: EstablishmentAggregate = {
  establishment: new EstablishmentEntityBuilder().build(),
  offers: [new OfferEntityBuilder().build()],
  contact: new ContactEntityBuilder().build(),
};

export class EstablishmentAggregateBuilder
  implements Builder<EstablishmentAggregate>
{
  constructor(
    private readonly aggregate: EstablishmentAggregate = validEstablishmentAggregate,
  ) {}

  public build() {
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

  public withOffers(offers: OfferEntity[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      offers,
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
): SearchResultDto => ({
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
  appellations: establishmentAggregate.offers
    .filter((offer) => offer.romeCode === romeCode)
    .map((offer) => ({
      appellationCode: offer.appellationCode,
      appellationLabel: offer.appellationLabel,
    })),
});
