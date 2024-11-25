import { Location, SearchResultDto } from "shared";
import { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import { OfferEntity } from "../entities/OfferEntity";

export const makeExpectedSearchResult = ({
  establishment: establishmentAggregate,
  withOffers,
  withLocationAndDistance,
}: {
  establishment: EstablishmentAggregate;
  withOffers: OfferEntity[];
  withLocationAndDistance: Location & { distance?: number };
}): SearchResultDto => {
  const firstOffer = withOffers.at(0);
  if (!firstOffer)
    throw new Error(
      "At least one offer is required to make an expected SearchResult",
    );
  return {
    additionalInformation:
      establishmentAggregate.establishment.additionalInformation,
    address: withLocationAndDistance.address,
    appellations: withOffers.map(({ appellationCode, appellationLabel }) => ({
      appellationCode,
      appellationLabel,
    })),
    establishmentScore: establishmentAggregate.establishment.score,
    contactMode: establishmentAggregate.establishment.contactMethod,
    customizedName: establishmentAggregate.establishment.customizedName,
    distance_m: withLocationAndDistance.distance,
    fitForDisabledWorkers:
      establishmentAggregate.establishment.fitForDisabledWorkers,
    locationId: withLocationAndDistance.id,
    naf: establishmentAggregate.establishment.nafDto.code,
    nafLabel: "Activités des agences de travail temporaire",
    name: establishmentAggregate.establishment.name,
    numberOfEmployeeRange:
      establishmentAggregate.establishment.numberEmployeesRange,
    position: withLocationAndDistance.position,
    rome: firstOffer.romeCode,
    romeLabel: firstOffer.romeLabel,
    siret: establishmentAggregate.establishment.siret,
    voluntaryToImmersion:
      establishmentAggregate.establishment.voluntaryToImmersion,
    website: establishmentAggregate.establishment.website,
    isSearchable:
      !establishmentAggregate.establishment.isMonthlyDiscussionLimitReached, // <<<<< Donnée renvoyée actuellement alors que pas spécifié dans le DTO?!
    updatedAt: establishmentAggregate.establishment.updatedAt?.toISOString(),
    createdAt: establishmentAggregate.establishment.createdAt.toISOString(),
  } as SearchResultDto; // d'où le as
};

export const sortSearchResultsByDistanceAndRomeAndSiretOnRandomResults = (
  a: SearchResultDto,
  b: SearchResultDto,
): number => {
  if (a.distance_m && b.distance_m) {
    if (a.distance_m > b.distance_m) return 1;
    if (a.distance_m < b.distance_m) return -1;
  }
  if (a.rome > b.rome) return 1;
  if (a.rome < b.rome) return -1;

  if (a.siret > b.siret) return 1;
  if (a.siret < b.siret) return -1;
  return 0;
};
