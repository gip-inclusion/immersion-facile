import { WithAcquisition } from "../acquisition.dto";
import { EstablishmentSearchableByValue } from "../formEstablishment/FormEstablishment.dto";
import {
  AppellationCode,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const searchSortedByOptions = ["distance", "date", "score"] as const;
export type SearchSortedBy = (typeof searchSortedByOptions)[number];

export type SearchQueryParamsDto = {
  longitude: number;
  latitude: number;
  appellationCodes?: AppellationCode[];
  rome?: RomeCode;
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
  place?: string;
  establishmentSearchableBy?: EstablishmentSearchableByValue;
} & WithAcquisition;
