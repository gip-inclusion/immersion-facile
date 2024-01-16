import { uniqBy } from "ramda";
import {
  AddressDto,
  AppellationAndRomeDto,
  AppellationCode,
  Builder,
  conflictErrorSiret,
  ContactMethod,
  defaultMaxContactsPerWeek,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
  path,
  pathEq,
  replaceArrayElement,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";
import { ContactEntity } from "../../../domain/offer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/offer/entities/EstablishmentEntity";
import { OfferEntity } from "../../../domain/offer/entities/OfferEntity";
import {
  EstablishmentAggregateRepository,
  establishmentNotFoundErrorMessage,
  SearchImmersionParams,
  SearchImmersionResult,
  UpdateEstablishmentsWithInseeDataParams,
} from "../../../domain/offer/ports/EstablishmentAggregateRepository";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { ConflictError, NotFoundError } from "../../primary/helpers/httpErrors";
import { avenueChampsElyseesDto } from "../addressGateway/InMemoryAddressGateway";
import { UuidV4Generator } from "../core/UuidGeneratorImplementations";

export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_APPELLATION_CODE = "12345";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  #establishmentAggregates: EstablishmentAggregate[] = [];

  public async delete(siret: SiretDto): Promise<void> {
    const formEstablishmentIndex = this.#establishmentAggregates.findIndex(
      (formEstablishment) => formEstablishment.establishment.siret === siret,
    );
    if (formEstablishmentIndex === -1)
      throw new NotFoundError(establishmentNotFoundErrorMessage(siret));
    this.#establishmentAggregates.splice(formEstablishmentIndex, 1);
  }

  // for test purposes only :
  public get establishmentAggregates() {
    return this.#establishmentAggregates;
  }

  public set establishmentAggregates(
    establishmentAggregates: EstablishmentAggregate[],
  ) {
    this.#establishmentAggregates = establishmentAggregates;
  }

  public async getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined> {
    return this.#establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    );
  }

  public async getOffersAsAppellationDtoEstablishment(
    siret: string,
  ): Promise<AppellationAndRomeDto[]> {
    return (
      this.establishmentAggregates
        .find(pathEq("establishment.siret", siret))
        ?.offers.map((offer) => ({
          romeCode: offer.romeCode,
          appellationCode: offer.appellationCode?.toString() ?? "", // Should not be undefined though
          romeLabel: offer.romeLabel,
          appellationLabel: offer.appellationLabel,
        })) ?? []
    );
  }

  public async getSearchImmersionResultDtoBySiretAndAppellationCode(
    siret: SiretDto,
    appellationCode: AppellationCode,
  ): Promise<SearchResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return;
    const offer = aggregate.offers.find(
      (offer) => offer.appellationCode === appellationCode,
    );
    if (!offer) return;
    const { isSearchable, ...rest } =
      buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
        establishmentAgg: aggregate,
        searchedAppellationCode: offer.appellationCode,
      });
    return rest;
  }

  public getSiretOfEstablishmentsToSuggestUpdate(): Promise<SiretDto[]> {
    throw new Error(
      "Method not implemented : getSiretOfEstablishmentsToSuggestUpdate, you can use PG implementation instead",
    );
  }

  public async getSiretsOfEstablishmentsNotCheckedAtInseeSince(
    checkDate: Date,
    maxResults: number,
  ): Promise<SiretDto[]> {
    return this.#establishmentAggregates
      .filter(
        (establishmentAggregate) =>
          !establishmentAggregate.establishment.lastInseeCheckDate ||
          establishmentAggregate.establishment.lastInseeCheckDate < checkDate,
      )
      .map(({ establishment }) => establishment.siret)
      .slice(0, maxResults);
  }

  public async getSiretsOfEstablishmentsWithRomeCode(
    rome: string,
  ): Promise<SiretDto[]> {
    return this.#establishmentAggregates
      .filter(
        (aggregate) =>
          !!aggregate.offers.find((offer) => offer.romeCode === rome),
      )
      .map(path("establishment.siret"));
  }

  public async hasEstablishmentWithSiret(siret: string): Promise<boolean> {
    if (siret === conflictErrorSiret)
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    return !!this.#establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
  }

  public async insertEstablishmentAggregates(
    aggregates: EstablishmentAggregate[],
  ) {
    this.#establishmentAggregates = [
      ...this.#establishmentAggregates,
      ...aggregates,
    ];
  }

  public async markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(): Promise<number> {
    // not implemented because this method is used only in a script,
    // and the use case consists only in a PG query
    throw new Error("NOT implemented");
  }

  public async searchImmersionResults({
    searchMade: { lat, lon, appellationCodes },
    maxResults,
  }: SearchImmersionParams): Promise<SearchImmersionResult[]> {
    return this.#establishmentAggregates
      .filter((aggregate) => aggregate.establishment.isOpen)
      .flatMap((aggregate) =>
        uniqBy((offer) => offer.romeCode, aggregate.offers)
          .filter(
            (offer) =>
              !appellationCodes ||
              appellationCodes.includes(offer.appellationCode),
          )
          .map((offer) =>
            buildSearchImmersionResultDtoForOneEstablishmentAndOneRome({
              establishmentAgg: aggregate,
              searchedAppellationCode: offer.appellationCode,
              position: {
                lat,
                lon,
              },
            }),
          ),
      )
      .slice(0, maxResults);
  }

  public async updateEstablishmentAggregate(aggregate: EstablishmentAggregate) {
    const aggregateIndex = this.#establishmentAggregates.findIndex(
      pathEq("establishment.siret", aggregate.establishment.siret),
    );
    if (aggregateIndex === -1)
      throw new NotFoundError(
        `We do not have an establishment with siret ${aggregate.establishment.siret} to update`,
      );
    this.#establishmentAggregates = replaceArrayElement(
      this.#establishmentAggregates,
      aggregateIndex,
      aggregate,
    );
  }

  public async updateEstablishmentsWithInseeData(
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ): Promise<void> {
    this.#establishmentAggregates = this.#establishmentAggregates.map(
      (aggregate) => {
        const newValues = params[aggregate.establishment.siret];
        return newValues
          ? {
              ...aggregate,
              establishment: {
                ...aggregate.establishment,
                ...newValues,
                lastInseeCheckDate: inseeCheckDate,
              },
            }
          : aggregate;
      },
    );
  }
}

const buildSearchImmersionResultDtoForOneEstablishmentAndOneRome = ({
  establishmentAgg,
  searchedAppellationCode,
  position,
}: {
  establishmentAgg: EstablishmentAggregate;
  searchedAppellationCode: AppellationCode;
  position?: GeoPositionDto;
}): SearchImmersionResult => {
  const romeCode =
    establishmentAgg.offers.find(
      (offer) => offer.appellationCode === searchedAppellationCode,
    )?.romeCode ?? "no-offer-matched";

  return {
    address: establishmentAgg.establishment.address,
    naf: establishmentAgg.establishment.nafDto.code,
    nafLabel: establishmentAgg.establishment.nafDto.nomenclature,
    name: establishmentAgg.establishment.name,
    customizedName: establishmentAgg.establishment.customizedName,
    rome: romeCode,
    romeLabel: TEST_ROME_LABEL,
    appellations: establishmentAgg.offers
      .filter((immersionOffer) => immersionOffer.romeCode === romeCode)
      .map((immersionOffer) => ({
        appellationLabel: immersionOffer.appellationLabel,
        appellationCode: immersionOffer.appellationCode,
      })),
    siret: establishmentAgg.establishment.siret,
    voluntaryToImmersion: establishmentAgg.establishment.voluntaryToImmersion,
    contactMode: establishmentAgg.contact?.contactMethod,
    numberOfEmployeeRange: establishmentAgg.establishment.numberEmployeesRange,
    website: establishmentAgg.establishment?.website,
    additionalInformation:
      establishmentAgg.establishment?.additionalInformation,
    distance_m: position
      ? distanceBetweenCoordinatesInMeters(
          establishmentAgg.establishment.position.lat,
          establishmentAgg.establishment.position.lon,
          position.lat,
          position.lon,
        )
      : undefined,
    position: establishmentAgg.establishment.position,
    isSearchable: establishmentAgg.establishment.isSearchable,
    nextAvailabilityDate: establishmentAgg.establishment.nextAvailabilityDate,
  };
};

const validContactEntityV2: ContactEntity = {
  id: "3ca6e619-d654-4d0d-8fa6-2febefbe953d",
  lastName: "Prost",
  firstName: "Alain",
  email: "alain.prost@email.fr",
  job: "le big boss",
  phone: "0612345678",
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
}

export const defaultNafCode = "7820Z";
const validEstablishmentEntityV2: EstablishmentEntity = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: avenueChampsElyseesDto,
  website: "www.jobs.fr",
  additionalInformation: "",
  customizedName: undefined,
  isCommited: undefined,
  createdAt: new Date(),
  sourceProvider: "immersion-facile",
  voluntaryToImmersion: true,
  position: {
    lat: 48.866667, // Paris lat/lon
    lon: 2.333333,
  },
  nafDto: { code: defaultNafCode, nomenclature: "NAFRev2" },
  numberEmployeesRange: "10-19",
  updatedAt: new Date("2022-01-05T12:00:00.000"),
  isOpen: true,
  isSearchable: true,
  maxContactsPerWeek: defaultMaxContactsPerWeek,
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

  public withAddress(address: AddressDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, address });
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

  public withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      maxContactsPerWeek,
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

  public withPosition(position: GeoPositionDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, position });
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

  public withEstablishmentNextAvailabilityDate(date: Date) {
    return new EstablishmentAggregateBuilder({
      ...this.aggregate,
      establishment: new EstablishmentEntityBuilder(
        this.aggregate.establishment,
      )
        .withNextAvailabilityDate(date)
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

const defaultValidOfferEntity: OfferEntity = {
  romeCode: "B1805",
  appellationLabel: "Styliste",
  appellationCode: "19540",
  romeLabel: "Stylisme",
  score: 4.5,
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

  public withScore(score: number) {
    return new OfferEntityBuilder({
      ...this.entity,
      score,
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
