import { ContactEntityV2 } from "../../../domain/immersionOffer/entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../../../domain/immersionOffer/ports/EstablishmentAggregateRepository";
import { path, pathEq, pathNotEq } from "shared/src/ramdaExtensions/path";
import { propEq } from "shared/src/ramdaExtensions/propEq";
import { createLogger } from "../../../utils/logger";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { conflictErrorSiret, SiretDto } from "shared/src/siret";
import { ConflictError } from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export const TEST_NAF_LABEL = "test_naf_label";
export const TEST_ROME_LABEL = "test_rome_label";
export const TEST_APPELLATION_LABEL = "test_appellation_label";
export const TEST_CITY = "test_city";
export const TEST_POSITION = { lat: 43.8666, lon: 8.3333 };

export class InMemoryEstablishmentAggregateRepository
  implements EstablishmentAggregateRepository
{
  public constructor(
    private _establishmentAggregates: EstablishmentAggregate[] = [],
  ) {}

  async insertEstablishmentAggregates(aggregates: EstablishmentAggregate[]) {
    logger.info({ aggregates }, "insertEstablishmentAggregates");
    this._establishmentAggregates = [
      ...this._establishmentAggregates,
      ...aggregates,
    ];
  }

  public async getSearchImmersionResultDtoFromSearchMade({
    searchMade,
    withContactDetails = false,
    maxResults,
  }: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }): Promise<SearchImmersionResultDto[]> {
    logger.info({ searchMade, withContactDetails }, "getFromSearch");
    return this._establishmentAggregates
      .filter((aggregate) =>
        searchMade.voluntary_to_immersion === undefined
          ? true
          : aggregate.establishment.voluntaryToImmersion ==
            searchMade.voluntary_to_immersion,
      )
      .flatMap((aggregate) =>
        aggregate.immersionOffers
          .filter(
            (immersionOffer) =>
              !searchMade.rome || immersionOffer.romeCode === searchMade.rome,
          )
          .map((immersionOffer) =>
            buildSearchImmersionResultDto(
              immersionOffer,
              aggregate.establishment,
              aggregate.contact,
              searchMade,
              withContactDetails,
            ),
          ),
      )

      .slice(0, maxResults);
  }

  public async getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
    since: Date,
  ): Promise<string[]> {
    return this._establishmentAggregates
      .filter(
        (aggregate) =>
          aggregate.establishment.isActive &&
          (aggregate.establishment.updatedAt
            ? aggregate.establishment.updatedAt <= since
            : true),
      )
      .map((aggregate) => aggregate.establishment.siret);
  }

  public async getSiretOfEstablishmentsFromFormSource(): Promise<string[]> {
    return this._establishmentAggregates
      .filter(pathEq("establishment.dataSource", "form"))
      .map(path("establishment.siret"));
  }

  public async updateEstablishment(
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "nafDto" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ): Promise<void> {
    this._establishmentAggregates = this._establishmentAggregates.map(
      (aggregate) =>
        aggregate.establishment.siret === siret
          ? {
              ...aggregate,
              establishment: {
                ...aggregate.establishment,
                address:
                  propertiesToUpdate.address || aggregate.establishment.address,
                position:
                  propertiesToUpdate.position ||
                  aggregate.establishment.position,
                nafDto:
                  propertiesToUpdate.nafDto || aggregate.establishment.nafDto,
                numberEmployeesRange:
                  propertiesToUpdate.numberEmployeesRange ||
                  aggregate.establishment.numberEmployeesRange,
                isActive:
                  propertiesToUpdate.isActive !== undefined
                    ? propertiesToUpdate.isActive
                    : aggregate.establishment.isActive,
                updatedAt: propertiesToUpdate.updatedAt,
              },
            }
          : aggregate,
    );
  }

  public async hasEstablishmentFromFormWithSiret(
    siret: string,
  ): Promise<boolean> {
    if (siret === conflictErrorSiret)
      throw new ConflictError(
        `Establishment with siret ${siret} already in db`,
      );
    return !!this._establishmentAggregates.find(
      (aggregate) =>
        aggregate.establishment.siret === siret &&
        aggregate.establishment.dataSource === "form",
    );
  }

  public async removeEstablishmentAndOffersAndContactWithSiret(
    siret: string,
  ): Promise<void> {
    this.establishmentAggregates = this._establishmentAggregates.filter(
      pathNotEq("establishment.siret", siret),
    );
  }

  public async getEstablishmentForSiret(
    siret: string,
  ): Promise<AnnotatedEstablishmentEntityV2 | undefined> {
    return this.establishmentAggregates
      .map((aggegate) => ({
        ...aggegate.establishment,
        nafLabel: "",
      }))
      .find(propEq("siret", siret));
  }

  public async getContactForEstablishmentSiret(
    siret: string,
  ): Promise<ContactEntityV2 | undefined> {
    return this.establishmentAggregates.find(
      pathEq("establishment.siret", siret),
    )?.contact;
  }

  public async getOffersAsAppelationDtoForFormEstablishment(
    siret: string,
  ): Promise<AppellationDto[]> {
    return (
      this.establishmentAggregates
        .find(pathEq("establishment.siret", siret))
        ?.immersionOffers.map((offer) => ({
          romeCode: offer.romeCode,
          appellationCode: offer.appellationCode?.toString() ?? "", // Should not be undefined though
          romeLabel: TEST_ROME_LABEL,
          appellationLabel: TEST_APPELLATION_LABEL,
        })) ?? []
    );
  }
  public async getSearchImmersionResultDtoBySiretAndRome(
    siret: SiretDto,
    rome: string,
  ): Promise<SearchImmersionResultDto | undefined> {
    const aggregate = this.establishmentAggregates.find(
      (aggregate) => aggregate.establishment.siret === siret,
    );
    if (!aggregate) return;
    return {
      rome,
      romeLabel: TEST_ROME_LABEL,
      appellationLabels: aggregate.immersionOffers
        .filter(propEq("romeCode", rome))
        .map(() => TEST_APPELLATION_LABEL),
      naf: aggregate.establishment.nafDto.code,
      nafLabel: TEST_NAF_LABEL,
      siret,
      name: aggregate?.establishment.name,
      customizedName: aggregate?.establishment.customizedName,
      voluntaryToImmersion: aggregate?.establishment.voluntaryToImmersion,
      numberOfEmployeeRange: aggregate.establishment.numberEmployeesRange,
      location: aggregate?.establishment.position,
      address: aggregate.establishment.address,
      city: TEST_CITY,
      contactMode: aggregate.contact?.contactMethod,
      contactDetails: aggregate.contact && {
        id: aggregate.contact.id,
        lastName: aggregate.contact.lastName,
        firstName: aggregate.contact.firstName,
        email: aggregate.contact.email,
        phone: aggregate.contact.phone,
        role: aggregate.contact.job,
      },
    };
  }
  // for test purposes only :
  get establishmentAggregates() {
    return this._establishmentAggregates;
  }
  set establishmentAggregates(
    establishmentAggregates: EstablishmentAggregate[],
  ) {
    this._establishmentAggregates = establishmentAggregates;
  }
}

const buildSearchImmersionResultDto = (
  immersionOffer: ImmersionOfferEntityV2,
  establishment: EstablishmentEntityV2,
  contact: ContactEntityV2 | undefined,
  searchMade: SearchMade,
  withContactDetails: boolean,
): SearchImmersionResultDto => ({
  address: establishment.address,
  naf: establishment.nafDto.code,
  nafLabel: TEST_NAF_LABEL,
  name: establishment.name,
  customizedName: establishment.customizedName,
  rome: immersionOffer.romeCode,
  romeLabel: TEST_ROME_LABEL,
  appellationLabels: [TEST_APPELLATION_LABEL],
  siret: establishment.siret,
  voluntaryToImmersion: establishment.voluntaryToImmersion,
  contactMode: contact?.contactMethod,
  numberOfEmployeeRange: establishment.numberEmployeesRange,
  distance_m: distanceBetweenCoordinatesInMeters(
    TEST_POSITION.lat,
    TEST_POSITION.lon,
    searchMade.lat,
    searchMade.lon,
  ),
  location: TEST_POSITION,
  city: TEST_CITY,
  ...(withContactDetails &&
    contact && {
      contactDetails: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        role: contact.job,
      },
    }),
});
