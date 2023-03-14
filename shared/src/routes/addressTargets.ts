import { createTargets, CreateTargets, Target } from "http-client";

const lookupLocationUrl = "/address/lookup-location/";
const lookupStreetAddressUrl = "/address/lookupStreetAddress";

export type AddressTargets = CreateTargets<{
  lookupLocation: Target<
    void,
    LookupLocationInputQueryParams,
    void,
    typeof lookupLocationUrl
  >;
  lookupStreetAddress: Target<
    void,
    LookupStreetAddressQueryParams,
    void,
    typeof lookupStreetAddressUrl
  >;
}>;

export type LookupLocationInputQueryParams = {
  query: string;
};

export type LookupStreetAddressQueryParams = {
  lookup: string;
};

export type DepartmentCodeFromPostcodeQueryParams = {
  postcode: string;
};

export const addressTargets = createTargets<AddressTargets>({
  lookupLocation: { method: "GET", url: lookupLocationUrl },
  lookupStreetAddress: { method: "GET", url: lookupStreetAddressUrl },
});
