import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import {
  localization,
  zStringCanBeEmpty,
  zStringMinLength1,
} from "../zodUtils";
import {
  type AddressAndPosition,
  type AddressDto,
  type AddressDtoWithCountryCode,
  type AddressWithCountryCodeAndPosition,
  type DepartmentCode,
  type LookupSearchResult,
  supportedCountryCodes,
  type WithLookupAddressQueryParams,
  type WithLookupLocationInputQueryParams,
} from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

export const addressSchema: z.Schema<AddressDto> = z.object(
  {
    streetNumberAndAddress: zStringCanBeEmpty,
    postcode: zStringMinLength1,
    departmentCode: zStringMinLength1,
    city: zStringMinLength1,
  },
  {
    message: localization.invalidAddress,
  },
);

export const addressWithCountryCodeSchema: z.Schema<AddressDtoWithCountryCode> =
  addressSchema.and(
    z.object({
      countryCode: z.enum(supportedCountryCodes, {
        error: localization.invalidEnum,
      }),
    }),
  );

export const lookupSearchResultSchema: z.Schema<LookupSearchResult> = z.object({
  label: z.string(),
  position: geoPositionSchema,
});

export const addressAndPositionSchema: z.Schema<AddressAndPosition> = z.object(
  {
    address: addressSchema,
    position: geoPositionSchema,
  },
  {
    message: localization.invalidAddress,
  },
);

export const addressWithCountryCodeAndPositionSchema = z.object({
  address: addressWithCountryCodeSchema,
  position: geoPositionSchema,
});

export const addressWithCountryCodeAndPositionListSchema: z.Schema<
  AddressWithCountryCodeAndPosition[]
> = z.array(addressWithCountryCodeAndPositionSchema);

export const lookupSearchResultsSchema: z.ZodSchema<LookupSearchResult[]> =
  z.array(lookupSearchResultSchema);

export const lookupStreetAddressQueryMinLength = 2;
export const lookupStreetAddressQueryMaxWordLength = 18;

export const lookupStreetAddressSpecialCharsRegex =
  /[&/\\#,+()&$~%€.":`*?<>{}⠀]|[{d}\s,]/g;
export const withLookupStreetAddressQueryParamsSchema: z.Schema<WithLookupAddressQueryParams> =
  z.object({
    lookup: z
      .string()
      .min(lookupStreetAddressQueryMinLength)
      .trim()
      .refine((arg) => {
        const withoutSpecialChars = arg.replace(
          lookupStreetAddressSpecialCharsRegex,
          "",
        );
        return withoutSpecialChars.length >= lookupStreetAddressQueryMinLength;
      }, "String must contain at least 2 character(s), excluding special chars")
      .refine(
        (arg) => arg.split(" ").length <= lookupStreetAddressQueryMaxWordLength,
        "String must contain a maximum of 18 words",
      ),
    countryCode: z.enum(supportedCountryCodes, {
      error: localization.invalidEnum,
    }),
  });

export const withLookupLocationInputQueryParamsSchema: z.Schema<WithLookupLocationInputQueryParams> =
  z.object({
    query: z.string(),
  });
