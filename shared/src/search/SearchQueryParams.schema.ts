import { z } from "zod";
import { withAcquisitionSchema } from "../acquisition.dto";
import { romeCodeSchema } from "../rome";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { siretSchema } from "../siret/siret.schema";
import { zToBoolean, zToNumber } from "../zodUtils";
import {
  SearchQueryParamsDto,
  searchSortedByOptions,
} from "./SearchQueryParams.dto";

export const searchQueryParamsSchema: z.Schema<SearchQueryParamsDto> = z
  .object({
    appellationCodes: z.array(appellationCodeSchema).optional(),
    siret: siretSchema.optional(),
    latitude: zToNumber,
    longitude: zToNumber,
    distanceKm: zToNumber.positive("'distance_km' doit être > 0").max(100),
    voluntaryToImmersion: z.undefined().or(zToBoolean.optional()),
    place: z.string().optional(),
    sortedBy: z.enum(searchSortedByOptions).optional(),
    establishmentSearchableBy: z.enum(["students", "jobSeekers"]).optional(),
  })
  .and(withAcquisitionSchema);

export const searchParamsSchema: z.Schema<SearchQueryParamsDto> =
  searchQueryParamsSchema.and(
    z.object({
      rome: romeCodeSchema.optional(),
    }),
  );
