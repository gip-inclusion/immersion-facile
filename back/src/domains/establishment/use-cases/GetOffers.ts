import {
  type DataWithPagination,
  getOffersFlatParamsSchema,
  getPaginationParamsForApiConsumer,
  type SearchResultDto,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { GeoParams, SearchMade } from "../entities/SearchMadeEntity";
import { hasSearchGeoParams } from "./LegacySearchImmersion";

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

    const geoParams: Partial<GeoParams> = {
      lat: sortAndPositionParams.latitude,
      lon: sortAndPositionParams.longitude,
      distanceKm: sortAndPositionParams.distanceKm,
    };

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
        ...(hasSearchGeoParams(geoParams) ? { geoParams } : {}),
      },
      sort: { by: inputParams.sortBy, order: inputParams.sortOrder },
    });

    const searchMade: SearchMade = {
      appellationCodes,
      nafCodes,
      establishmentSearchableBy: searchableBy,
      sortedBy: inputParams.sortBy,
      place,
      ...geoParams,
    };

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: deps.uuidGenerator.new(),
      needsToBeSearched: true, // this is useless (legacy TODO : remove this column)
      numberOfResults: result.pagination.totalRecords,
    });

    return result;
  });
