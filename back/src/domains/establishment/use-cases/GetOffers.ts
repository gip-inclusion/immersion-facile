import { all, isNil, values } from "ramda";
import {
  type DataWithPagination,
  errors,
  getOffersFlatParamsSchema,
  getPaginationParamsForApiConsumer,
  pipeWithValue,
  type SearchResultDto,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  type GeoParams,
  hasSearchGeoParams,
  type SearchMade,
} from "../entities/SearchMadeEntity";

export const makeGetOffers = useCaseBuilder("GetOffers")
  .withInput(getOffersFlatParamsSchema)
  .withOutput<DataWithPagination<SearchResultDto>>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const {
      page,
      perPage,
      appellationCodes,
      fitForDisabledWorkers,
      locationIds,
      nafCodes,
      searchableBy,
      sirets,
      place,
      ...sortAndPositionParams
    } = inputParams;

    const validatedGeoParams = getValidatedGeoParams({
      lat: sortAndPositionParams.latitude,
      lon: sortAndPositionParams.longitude,
      distanceKm: sortAndPositionParams.distanceKm,
    });

    const result = await uow.establishmentAggregateRepository.getOffers({
      pagination: getPaginationParamsForApiConsumer({
        page,
        perPage,
      }),
      filters: {
        appellationCodes,
        fitForDisabledWorkers,
        locationIds,
        nafCodes,
        searchableBy,
        sirets,
        ...validatedGeoParams,
      },
      sort: { by: inputParams.sortBy, direction: inputParams.sortOrder },
    });

    const searchMade: SearchMade = {
      appellationCodes,
      nafCodes,
      establishmentSearchableBy: searchableBy,
      sortedBy: inputParams.sortBy,
      place,
      ...validatedGeoParams,
    };

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: deps.uuidGenerator.new(),
      needsToBeSearched: true, // this is useless (legacy TODO : remove this column)
      numberOfResults: result.pagination.totalRecords,
    });

    return result;
  });

const getValidatedGeoParams = (geoParams: Partial<GeoParams>) => {
  const hasNoGeoParams = pipeWithValue(geoParams, values, all(isNil));

  if (hasNoGeoParams) return {};
  if (hasSearchGeoParams(geoParams)) return { geoParams };

  throw errors.search.invalidGeoParams();
};
