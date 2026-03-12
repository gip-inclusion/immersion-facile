import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import {
  zStringCanBeEmpty,
  zStringMinLength1Max1024,
} from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
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

//TODO : pourquoi il est différent du schema de departmentCode qu'on a dans addressSchema ?
export const departmentCodeSchema: ZodSchemaWithInputMatchingOutput<DepartmentCode> =
  z.string();

export const addressDepartmentCodeSchema: ZodSchemaWithInputMatchingOutput<DepartmentCode> =
  zStringMinLength1Max1024;

export const addressSchema: ZodSchemaWithInputMatchingOutput<AddressDto> =
  z.object(
    {
      streetNumberAndAddress: zStringCanBeEmpty,
      postcode: zStringMinLength1Max1024,
      departmentCode: addressDepartmentCodeSchema,
      city: zStringMinLength1Max1024,
    },
    {
      message: localization.invalidAddress,
    },
  );

export const addressWithCountryCodeSchema: ZodSchemaWithInputMatchingOutput<AddressDtoWithCountryCode> =
  addressSchema.and(
    z.object({
      countryCode: z.enum(supportedCountryCodes, {
        error: localization.invalidEnum,
      }),
    }),
  );

export const lookupSearchResultSchema: ZodSchemaWithInputMatchingOutput<LookupSearchResult> =
  z.object({
    label: z.string(),
    position: geoPositionSchema,
  });

export const addressAndPositionSchema: ZodSchemaWithInputMatchingOutput<AddressAndPosition> =
  z.object(
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

export const addressWithCountryCodeAndPositionListSchema: ZodSchemaWithInputMatchingOutput<
  AddressWithCountryCodeAndPosition[]
> = z.array(addressWithCountryCodeAndPositionSchema);

export const lookupSearchResultsSchema: ZodSchemaWithInputMatchingOutput<
  LookupSearchResult[]
> = z.array(lookupSearchResultSchema);

export const lookupStreetAddressQueryMinLength = 2;
export const lookupStreetAddressQueryMaxWordLength = 18;

export const lookupStreetAddressSpecialCharsRegex =
  /[&/\\#,+()&$~%€.":`*?<>{}⠀]|[{d}\s,]/g;
export const withLookupStreetAddressQueryParamsSchema: ZodSchemaWithInputMatchingOutput<WithLookupAddressQueryParams> =
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
      }, "Too small: expected string to have >=2 characters, excluding special chars")
      .refine(
        (arg) => arg.split(" ").length <= lookupStreetAddressQueryMaxWordLength,
        "String must contain a maximum of 18 words",
      ),
    countryCode: z.enum(supportedCountryCodes, {
      error: localization.invalidEnum,
    }),
  });

export const withLookupLocationInputQueryParamsSchema: ZodSchemaWithInputMatchingOutput<WithLookupLocationInputQueryParams> =
  z.object({
    query: z.string(),
  });
z.object({
  query: z.string(),
});
