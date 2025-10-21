import Bottleneck from "bottleneck";
import type { Point } from "geojson";
import {
  type AddressDtoWithCountryCode,
  type AddressWithCountryCodeAndPosition,
  type City,
  type DepartmentName,
  defaultCountryCode,
  errors,
  filterNotFalsy,
  type GeoPositionDto,
  getDepartmentCodeFromDepartmentName,
  isSupportedCountryCode,
  type LookupSearchResult,
  lookupSearchResultsSchema,
  lookupStreetAddressQueryMinLength,
  lookupStreetAddressSpecialCharsRegex,
  type OpenCageGeoSearchKey,
  type Postcode,
  type StreetNumberAndAddress,
  type SupportedCountryCode,
} from "shared";
import type { HttpClient } from "shared-routes";

import type { WithCache } from "../../caching-gateway/port/WithCache";
import type { AddressGateway } from "../ports/AddressGateway";
import type {
  OpenCageDataAddressComponents,
  OpenCageDataProperties,
  OpenCageDataSearchResultCollection,
} from "./HttpAddressGateway.dto";
import {
  type AddressesRoutes,
  addressesExternalRoutes,
} from "./HttpAddressGateway.routes";

const openCageDateMaxRequestsPerSeconds = 15;

export class HttpAddressGateway implements AddressGateway {
  #limiter = new Bottleneck({
    reservoir: openCageDateMaxRequestsPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: openCageDateMaxRequestsPerSeconds,
  });

  #withCache: WithCache;

  constructor(
    private readonly httpClient: HttpClient<AddressesRoutes>,
    private geocodingApiKey: string,
    private geosearchApiKey: OpenCageGeoSearchKey,
    withCache: WithCache,
  ) {
    this.#withCache = withCache;
  }

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDtoWithCountryCode | undefined> {
    const { status, body } = await this.#limiter.schedule(() =>
      this.httpClient.geocoding({
        queryParams: {
          countrycode: franceAndAttachedTerritoryCountryCodes,
          key: this.geocodingApiKey,
          language,
          limit: "5",
          q: `${position.lat}+${position.lon}`,
        },
      }),
    );

    if (status !== 200) return;

    const addresses: AddressDtoWithCountryCode[] = body.features
      .map(this.#featureToAddress)
      .filter(filterNotFalsy);

    return addresses.at(0);
  }

  public async lookupLocationName(
    query: string,
  ): Promise<LookupSearchResult[]> {
    const sanitizedQuery = query.trim().toLowerCase();
    const queryMinLength = 3;

    if (sanitizedQuery.length < queryMinLength)
      throw errors.address.queryToShort({
        minLength: queryMinLength,
      });

    return this.#withCache({
      overrideCacheDurationInHours: 24,
      getCacheKey: (query) => `geosearch_${query}`,
      logParams: {
        partner: "openCageData",
        route: addressesExternalRoutes.geosearch,
      },
      cb: (cachedQuery: string) =>
        this.#limiter
          .schedule(() => {
            return this.httpClient.geosearch({
              headers: {
                "OpenCage-Geosearch-Key": this.geosearchApiKey,
                Origin: "https://immersion-facile.beta.gouv.fr", // OC Geosearch needs an Origin that fits to API key domain (with https://)
              },
              mode: "cors",
              queryParams: {
                countrycode:
                  this.#toOpenCageCountryCodeParam(defaultCountryCode),
                language,
                limit: "10",
                q: cachedQuery,
              },
            });
          })
          .then((response) => {
            if (response.status !== 200) return [];
            return lookupSearchResultsSchema.parse(
              toLookupSearchResults(response.body),
            );
          })
          .catch(() => {
            // just like for !200 codes: do nothing. We don't need noisy errors.
            // Errors are logged in data dog anyway. We can configure alert there.
            return [];
          }),
    })(sanitizedQuery);
  }

  public async lookupStreetAddress(
    query: string,
    countryCode?: SupportedCountryCode,
  ): Promise<AddressWithCountryCodeAndPosition[]> {
    return this.#limiter
      .schedule(() => {
        if (
          query.replace(lookupStreetAddressSpecialCharsRegex, "").length <
          lookupStreetAddressQueryMinLength
        )
          throw errors.address.queryToShort({
            minLength: lookupStreetAddressQueryMinLength,
          });

        return this.httpClient.geocoding({
          queryParams: {
            ...(countryCode && {
              countrycode: this.#toOpenCageCountryCodeParam(countryCode),
            }),
            key: this.geocodingApiKey,
            language,
            q: query,
          },
        });
      })
      .then((response) => {
        if (response.status !== 200) return [];
        return response.body.features
          .map((feature) => this.#toAddressAndPosition(feature))
          .filter(filterNotFalsy);
      })
      .catch(() => {
        // just like for !200 codes: do nothing. We don't need noisy errors.
        // Errors are logged in data dog anyway. We can configure alert there.
        return [];
      });
  }

  #toOpenCageCountryCodeParam(
    countryCode: SupportedCountryCode | undefined,
  ): string | undefined {
    if (!countryCode) return undefined;

    return countryCode.toLowerCase();
  }

  #toAddressAndPosition(
    feature: GeoJSON.Feature<Point, OpenCageDataProperties>,
  ): AddressWithCountryCodeAndPosition | undefined {
    const address = this.#featureToAddress(feature);
    return (
      address && {
        position: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
        address,
      }
    );
  }

  #featureToAddress(
    feature: GeoJSON.Feature<Point, OpenCageDataProperties>,
  ): AddressDtoWithCountryCode | undefined {
    const components = feature.properties.components;
    const city = getCityFromAliases(components);
    const postcode = getPostcodeFromAliases(components);
    const departmentName = getDepartmentNameFromAliases(components);
    // OpenCageData gives the department name but not the code.
    const departmentCode =
      departmentName && getDepartmentCodeFromDepartmentName(departmentName);
    const streetNumberAndAddress = makeStreetNumberAndAddress(
      getStreetNumberFromAliases(components),
      getStreetNameFromAliases(components),
    );
    return (
      city &&
      departmentCode &&
      postcode && {
        streetNumberAndAddress:
          streetNumberAndAddress === city ? "" : streetNumberAndAddress,
        postcode,
        departmentCode,
        city,
        countryCode: this.#toSupportedCountryCode(components.country_code),
      }
    );
  }

  #toSupportedCountryCode(
    countryCode: string | undefined,
  ): SupportedCountryCode {
    const capitalizedCountryCode = (countryCode ?? "").toUpperCase();
    if (isSupportedCountryCode(capitalizedCountryCode)) {
      return capitalizedCountryCode;
    }
    return "FR";
  }
}

const getPostcodeFromAliases = (
  components: OpenCageDataAddressComponents,
): Postcode | undefined => components.postcode;

const getStreetNumberFromAliases = (
  components: OpenCageDataAddressComponents,
): string | undefined =>
  components.house_number ?? components.housenumber ?? components.street_number;

const getStreetNameFromAliases = (
  components: OpenCageDataAddressComponents,
): string | undefined =>
  components.road ??
  components.footway ??
  components.street ??
  components.street_name ??
  components.residential ??
  components.path ??
  components.pedestrian ??
  components.road_reference ??
  components.road_reference_intl ??
  components.square ??
  components.place;

const getCityFromAliases = (
  components: OpenCageDataAddressComponents,
): City | undefined =>
  components.city ??
  components.town ??
  components.township ??
  components.village ??
  components.place;

// We have the best results for department when merging 'county' and 'state' related keys
const getDepartmentNameFromAliases = (
  components: OpenCageDataAddressComponents,
): DepartmentName | undefined =>
  components.county ??
  components.county_code ??
  components.department ??
  components.state_district ??
  components.state;

const toLookupSearchResults = (
  input: OpenCageDataSearchResultCollection,
): LookupSearchResult[] =>
  input.results.map((result) => ({
    label: result.formatted,
    position: {
      lat: Number.parseFloat(result.geometry.lat),
      lon: Number.parseFloat(result.geometry.lng),
    },
  }));

const makeStreetNumberAndAddress = (
  streetNumber: string | undefined,
  streetName: string | undefined,
): StreetNumberAndAddress => `${streetNumber ?? ""} ${streetName ?? ""}`.trim();

// https://github.com/OpenCageData/opencagedata-misc-docs/blob/master/countrycode.md
// On prend la france et tous ses territoires dépendants.
const franceAndAttachedTerritoryCountryCodes =
  "fr,bl,gf,gp,mf,mq,nc,pf,pm,re,tf,wf,yt";
const language = "fr";
