import { z } from "zod";
import {
  departmentCodeFromPostcodeRoute,
  lookupStreetAddressRoute,
} from "../routes";
import { Flavor } from "../typeFlavors";
import { LookupAddress, Postcode } from "./address.dto";

export const lookupAddressQueryParam = "lookup";
export const postCodeQueryParam = "postcode";
export const lookupStreetAddressUrl = (lookup: LookupAddress): string =>
  `${lookupStreetAddressRoute}?${lookupAddressQueryParam}=${lookup}`;
export const departmentCodeFromPostcodeUrl = (postcode: Postcode): string =>
  `${departmentCodeFromPostcodeRoute}?${postCodeQueryParam}=${postcode}`;

export type DepartmentCodeFromPostcodeQuery = Flavor<
  string,
  "FindDepartmentCodeFromPostcodeQuery"
>;
export const departmentCodeFromPostcodeQuerySchema: z.Schema<DepartmentCodeFromPostcodeQuery> =
  z.string();
