import { Location, SearchResultDto } from "shared";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { OfferEntity } from "../entities/OfferEntity";

export const makeExpectedSearchResult = ({
  establishment,
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
    additionalInformation: establishment.establishment.additionalInformation,
    address: withLocationAndDistance.address,
    appellations: withOffers.map(
      ({ appellationCode, appellationLabel, score }) => ({
        appellationCode,
        appellationLabel,
        score,
      }),
    ),
    contactMode: establishment.contact?.contactMethod,
    customizedName: establishment.establishment.customizedName,
    distance_m: withLocationAndDistance.distance,
    fitForDisabledWorkers: establishment.establishment.fitForDisabledWorkers,
    locationId: withLocationAndDistance.id,
    naf: establishment.establishment.nafDto.code,
    nafLabel: "Activités des agences de travail temporaire",
    name: establishment.establishment.name,
    numberOfEmployeeRange: establishment.establishment.numberEmployeesRange,
    position: withLocationAndDistance.position,
    rome: firstOffer.romeCode,
    romeLabel: firstOffer.romeLabel,
    siret: establishment.establishment.siret,
    voluntaryToImmersion: establishment.establishment.voluntaryToImmersion,
    website: establishment.establishment.website,
    isSearchable: establishment.establishment.isSearchable, // <<<<< Donnée renvoyée actuellement alors que pas spécifié dans le DTO?!
    updatedAt: establishment.establishment.updatedAt?.toISOString(),
    createdAt: establishment.establishment.createdAt.toISOString(),
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
