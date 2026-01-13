import { all, isNil, values } from "ramda";
import {
  type ApiConsumer,
  type DataWithPagination,
  errors,
  type GetOffersPerPageOption,
  getOffersFlatParamsSchema,
  getPaginationParamsForApiConsumer,
  getPaginationParamsForWeb,
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

const defaultPerPage: GetOffersPerPageOption = 12;

export const makeGetOffers = useCaseBuilder("GetOffers")
  .withCurrentUser<ApiConsumer | undefined>()
  .withInput(getOffersFlatParamsSchema)
  .withOutput<DataWithPagination<SearchResultDto>>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser: apiConsumer }) => {
    const {
      page,
      perPage,
      appellationCodes,
      fitForDisabledWorkers,
      locationIds,
      nafCodes,
      remoteWorkModes,
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
      pagination: apiConsumer
        ? getPaginationParamsForApiConsumer({
            page,
            perPage,
          })
        : getPaginationParamsForWeb({
            page,
            perPage: perPage ?? defaultPerPage,
          }),
      filters: {
        appellationCodes,
        fitForDisabledWorkers,
        locationIds,
        nafCodes,
        remoteWorkModes,
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
      ...(validatedGeoParams.geoParams ?? {}),
    };

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: deps.uuidGenerator.new(),
      needsToBeSearched: true, // this is useless (legacy TODO : remove this column)
      numberOfResults: result.pagination.totalRecords,
      apiConsumerName: apiConsumer?.name,
    });

    return result;
  });

const getValidatedGeoParams = (geoParams: Partial<GeoParams>) => {
  const hasNoGeoParams = pipeWithValue(geoParams, values, all(isNil));

  if (hasNoGeoParams) return {};
  if (hasSearchGeoParams(geoParams)) return { geoParams };

  throw errors.search.invalidGeoParams();
};
