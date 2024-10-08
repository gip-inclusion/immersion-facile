import {
  Builder,
  ContactMethod,
  Email,
  EstablishmentSearchableBy,
  FormEstablishmentSource,
  Location,
  NafDto,
  NumberEmployeesRange,
  RomeCode,
  WithAcquisition,
  defaultMaxContactsPerMonth,
} from "shared";
import { avenueChampsElyseesDto } from "../../core/address/adapters/InMemoryAddressGateway";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { ContactEntity } from "../entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
import { OfferEntity } from "../entities/OfferEntity";

export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_APPELLATION_CODE = "12345";
export const TEST_LOCATION: Location = {
  id: "11111111-1111-4444-1111-111111111111",
  address: avenueChampsElyseesDto,
  position: { lat: 43.8666, lon: 8.3333 },
};

export const validContactEntityV2: ContactEntity = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  lastName: "Prost",
  firstName: "Alain",
  email: "alain.prost@email.fr",
  job: "le big boss",
  phone: "+33612345678",
  contactMethod: "EMAIL",
  copyEmails: [],
};

export class ContactEntityBuilder implements Builder<ContactEntity> {
  constructor(private readonly entity: ContactEntity = validContactEntityV2) {}

  public build() {
    return this.entity;
  }

  public withContactMethod(contactMethod: ContactMethod) {
    return new ContactEntityBuilder({ ...this.entity, contactMethod });
  }

  public withCopyEmails(copyEmails: string[]) {
    return new ContactEntityBuilder({ ...this.entity, copyEmails });
  }

  public withEmail(email: string) {
    return new ContactEntityBuilder({ ...this.entity, email });
  }

  public withGeneratedContactId() {
    return this.withId(new UuidV4Generator().new());
  }

  public withId(id: string) {
    return new ContactEntityBuilder({ ...this.entity, id });
  }

  public withLastName(lastName: string) {
    return new ContactEntityBuilder({ ...this.entity, lastName });
  }

  public withPhone(phone: string) {
    return new ContactEntityBuilder({ ...this.entity, phone });
  }
}

export const defaultNafCode = "7820Z";
export const defaultLocation: Location = {
  id: "aaaaaaaa-aaaa-4444-aaaa-aaaaaaaaaaaa",
  address: avenueChampsElyseesDto,
  position: {
    lat: 48.866667, // Paris lat/lon
    lon: 2.333333,
  },
};

const validEstablishmentEntityV2: EstablishmentEntity = {
  siret: "78000403200019",
  name: "Company inside repository",
  locations: [defaultLocation],
  customizedName: undefined,
  isCommited: undefined,
  createdAt: new Date("2024-08-08"),
  sourceProvider: "immersion-facile",
  voluntaryToImmersion: true,
  nafDto: { code: defaultNafCode, nomenclature: "NAFRev2" },
  numberEmployeesRange: "10-19",
  updatedAt: new Date("2024-08-10"),
  isOpen: true,
  isSearchable: true,
  maxContactsPerMonth: defaultMaxContactsPerMonth,
  searchableBy: {
    jobSeekers: true,
    students: true,
  },
  additionalInformation: "",
  website: "",
  fitForDisabledWorkers: false,
  score: 10,
};

export class EstablishmentEntityBuilder
  implements Builder<EstablishmentEntity>
{
  constructor(
    private readonly entity: EstablishmentEntity = validEstablishmentEntityV2,
  ) {}

  public build() {
    return this.entity;
  }

  public withAdditionalInformation(additionalInformation: string) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      additionalInformation,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new EstablishmentEntityBuilder({ ...this.entity, createdAt });
  }

  public withCustomizedName(customizedName?: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, customizedName });
  }

  public withFitForDisabledWorkers(fitForDisabledWorkers?: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      fitForDisabledWorkers,
    });
  }

  public withIsCommited(isCommited?: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isCommited,
    });
  }

  public withIsOpen(isOpen: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isOpen,
    });
  }

  public withIsSearchable(isSearchable: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isSearchable,
    });
  }

  public withLastInseeCheck(lastInseeCheck: Date | undefined) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      lastInseeCheckDate: lastInseeCheck,
    });
  }

  public withLocationId(locationId: string) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      locations: [{ ...defaultLocation, id: locationId }],
    });
  }

  public withLocations(locations: Location[]) {
    return new EstablishmentEntityBuilder({ ...this.entity, locations });
  }

  public withMaxContactsPerMonth(maxContactsPerMonth: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      maxContactsPerMonth,
    });
  }

  public withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, nafDto });
  }

  public withName(name: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, name });
  }

  public withNextAvailabilityDate(nextAvailabilityDate: Date | undefined) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      nextAvailabilityDate: nextAvailabilityDate?.toISOString(),
    });
  }

  public withNumberOfEmployeeRange(numberEmployeesRange: NumberEmployeesRange) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      numberEmployeesRange,
    });
  }

  public withSearchableBy(searchableBy: EstablishmentSearchableBy) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      searchableBy,
    });
  }

  public withSiret(siret: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, siret });
  }

  public withSourceProvider(sourceProvider: FormEstablishmentSource) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      sourceProvider,
    });
  }

  public withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityBuilder({ ...this.entity, updatedAt });
  }

  public withWebsite(website?: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, website });
  }

  withAcquisition(withAcquisition: WithAcquisition) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      ...withAcquisition,
    });
  }

  public withScore(score: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      score,
    });
  }
}

export class EstablishmentAggregateBuilder
  implements Builder<EstablishmentAggregate>
{
  constructor(
    private readonly aggregate: EstablishmentAggregate = {
      establishment: new EstablishmentEntityBuilder().build(),
      offers: [new OfferEntityBuilder().build()],
      contact: new ContactEntityBuilder().build(),
    },
  ) {}

  public build() {
    return this.aggregate;
  }

  public withContact(contact: ContactEntity) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      contact,
    });
  }

  public withScore(score: number) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withScore(score)
        .build(),
    });
  }

  public withContactEmail(email: Email) {
    return new EstablishmentAggregateBuilder().withContact({
      ...this.aggregate.contact,
      email,
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

  public withEstablishmentNaf(naf: NafDto) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withNafDto(naf)
        .build(),
    });
  }

  public withEstablishmentNextAvailabilityDate(date?: Date) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withNextAvailabilityDate(date)
        .build(),
    });
  }

  withEstablishmentOpen(isOpen: boolean) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withIsOpen(isOpen)
        .build(),
    });
  }

  public withEstablishmentSiret(siret: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withSiret(siret)
        .build(),
    });
  }

  public withEstablishmentCreatedAt(createdAt: Date) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withCreatedAt(createdAt)
        .build(),
    });
  }

  public withEstablishmentCustomizedName(name: string | undefined) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withCustomizedName(name)
        .build(),
    });
  }

  public withEstablishmentName(name: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withName(name)
        .build(),
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

  public withFitForDisabledWorkers(fitForDisabledWorkers: boolean) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withFitForDisabledWorkers(fitForDisabledWorkers)
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

  public withLocationId(locationId: string) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withLocationId(locationId)
        .build(),
    });
  }

  public withLocations(locations: Location[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withLocations(locations)
        .build(),
    });
  }

  public withMaxContactsPerMonth(maxContactsPerMonth: number) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withMaxContactsPerMonth(maxContactsPerMonth)
        .build(),
    });
  }

  public withOffers(offers: OfferEntity[]) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      offers,
    });
  }

  public withSearchableBy(searchableBy: EstablishmentSearchableBy) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withSearchableBy(searchableBy)
        .build(),
    });
  }

  withAcquisition(withAcquisition: WithAcquisition) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withAcquisition(withAcquisition)
        .build(),
    });
  }
}

const defaultValidOfferEntity: OfferEntity = {
  romeCode: "B1805",
  appellationLabel: "Styliste",
  appellationCode: "19540",
  romeLabel: "Stylisme",
  createdAt: new Date("2022-05-15T12:00:00.000"),
};

export class OfferEntityBuilder implements Builder<OfferEntity> {
  constructor(
    private readonly entity: OfferEntity = {
      ...defaultValidOfferEntity,
    },
  ) {}

  public build() {
    return this.entity;
  }

  public withAppellationCode(appellationCode: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      appellationCode,
    });
  }

  public withAppellationLabel(appellationLabel: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      appellationLabel,
    });
  }

  public withCreatedAt(createdAt: Date) {
    return new OfferEntityBuilder({
      ...this.entity,
      createdAt,
    });
  }

  public withRomeCode(romeCode: RomeCode) {
    return new OfferEntityBuilder({
      ...this.entity,
      romeCode,
    });
  }

  public withRomeLabel(romeLabel: string) {
    return new OfferEntityBuilder({
      ...this.entity,
      romeLabel,
    });
  }
}

export const secretariatOffer = new OfferEntityBuilder()
  .withRomeCode("M1607")
  .withAppellationLabel("Secrétaire")
  .withAppellationCode("19364")
  .withRomeLabel("Secrétariat")
  .build();

export const boulangerOffer = new OfferEntityBuilder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère")
  .withAppellationCode("11573")
  .withRomeLabel("Boulangerie - viennoiserie")
  .build();

export const boulangerAssistantOffer = new OfferEntityBuilder()
  .withRomeCode("D1102")
  .withAppellationLabel("Boulanger / Boulangère assistant de l'enfer!!!")
  .withAppellationCode("00666")
  .withRomeLabel("Boulangerie - viennoiserie")
  .build();
