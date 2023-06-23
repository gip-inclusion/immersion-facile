import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { zString, zStringCanBeEmpty } from "../zodUtils";
import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  LookupSearchResult,
  WithLookupAddressQueryParams,
  WithLookupLocationInputQueryParams,
} from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: zStringCanBeEmpty,
  postcode: zString,
  departmentCode: zString,
  city: zString,
});

export const lookupSearchResultSchema: z.Schema<LookupSearchResult> = z.object({
  label: z.string(),
  position: geoPositionSchema,
});

export const addressAndPositionSchema: z.Schema<AddressAndPosition> = z.object({
  address: addressSchema,
  position: geoPositionSchema,
});

export const addressAndPositionListSchema: z.ZodSchema<AddressAndPosition[]> =
  z.array(addressAndPositionSchema);

export const lookupSearchResultsSchema: z.ZodSchema<LookupSearchResult[]> =
  z.array(lookupSearchResultSchema);

export const lookupStreetAddressQueryMinLength = 2;
export const lookupStreetAddressQueryMaxWordLength = 18;

export const lookupStreetAddressSpecialCharsRegex =
  /[&/\\#,+()&$~%€.":`*?<>{}]/g;
export const withLookupStreetAddressQueryParamsSchema: z.Schema<WithLookupAddressQueryParams> =
  z.object({
    lookup: z
      .string()
      .min(lookupStreetAddressQueryMinLength)
      .trim()
      .refine(
        (arg) =>
          arg.replace(lookupStreetAddressSpecialCharsRegex, "").length >=
          lookupStreetAddressQueryMinLength,
        "String must contain at least 2 character(s), excluding special chars",
      )
      .refine(
        (arg) => arg.split(" ").length <= lookupStreetAddressQueryMaxWordLength,
        "String must contain a maximum of 18 words",
      ),
  });

export const withLookupLocationInputQueryParamsSchema: z.Schema<WithLookupLocationInputQueryParams> =
  z.object({
    query: z.string(),
  });
