import Bottleneck from "bottleneck";
import { Point } from "geojson";
import {
  AddressAndPosition,
  AddressDto,
  City,
  DepartmentName,
  GeoPositionDto,
  LookupSearchResult,
  OpenCageGeoSearchKey,
  Postcode,
  StreetNumberAndAddress,
  errors,
  filterNotFalsy,
  getDepartmentCodeFromDepartmentNameOrCity,
  lookupSearchResultsSchema,
  lookupStreetAddressQueryMinLength,
  lookupStreetAddressSpecialCharsRegex,
} from "shared";
import { HttpClient } from "shared-routes";
import { WithCache } from "../../caching-gateway/port/WithCache";
import { AddressGateway } from "../ports/AddressGateway";
import {
  OpenCageDataAddressComponents,
  OpenCageDataProperties,
  OpenCageDataSearchResultCollection,
} from "./HttpAddressGateway.dto";
import { AddressesRoutes } from "./HttpAddressGateway.routes";

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
  ): Promise<AddressDto | undefined> {
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

    const addresses: AddressDto[] = body.features
      .map(this.#featureToAddress)
      .filter(filterNotFalsy);

    return addresses.at(0);
  }

  public async lookupLocationName(
    query: string,
  ): Promise<LookupSearchResult[]> {
    const queryMinLength = 3;

    if (query.length < queryMinLength)
      throw errors.address.queryToShort({
        minLength: queryMinLength,
      });

    return this.#withCache({
      overrideCacheDurationInHours: 24,
      getCacheKey: (query) => `geosearch_${query}`,
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
                countrycode: "fr",
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
          }),
    })(query);
  }

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
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
            countrycode: franceAndAttachedTerritoryCountryCodes,
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
      });
  }

  #toAddressAndPosition(
    feature: GeoJSON.Feature<Point, OpenCageDataProperties>,
  ): AddressAndPosition | undefined {
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
  ): AddressDto | undefined {
    const components = feature.properties.components;
    const city = getCityFromAliases(components);
    const postcode = getPostcodeFromAliases(components);
    const departmentName = getDepartmentNameFromAliases(components);
    // OpenCageData gives the department name but not the code.
    const departmentCode =
      departmentName &&
      getDepartmentCodeFromDepartmentNameOrCity[departmentName];
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
      }
    );
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
      lat: parseFloat(result.geometry.lat),
      lon: parseFloat(result.geometry.lng),
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

// https://api.opencagedata.com/geocode/v1/json?q=47.99603%2C-4.10248&key=a80af7a94fb34eb3ab0262483b63ff79
