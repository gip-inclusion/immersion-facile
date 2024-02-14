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
  calculateDurationInSecondsFrom,
  filterNotFalsy,
  getDepartmentCodeFromDepartmentNameOrCity,
  lookupSearchResultsSchema,
  lookupStreetAddressQueryMinLength,
  lookupStreetAddressSpecialCharsRegex,
} from "shared";
import { HttpClient } from "shared-routes";
import { AddressGateway } from "../../../domain/offer/ports/AddressGateway";
import { createLogger } from "../../../utils/logger";
import {
  OpenCageDataAddressComponents,
  OpenCageDataProperties,
  OpenCageDataSearchResultCollection,
} from "./HttpAddressGateway.dto";
import { AddressesRoutes } from "./HttpAddressGateway.routes";

export const errorMessage = {
  minimumCharErrorMessage: (minLength: number) =>
    `Lookup street address require a minimum of ${minLength} char.`,
};

const logger = createLogger(__filename);

const openCageDateMaxRequestsPerSeconds = 15;

export class HttpAddressGateway implements AddressGateway {
  #limiter = new Bottleneck({
    reservoir: openCageDateMaxRequestsPerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: openCageDateMaxRequestsPerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<AddressesRoutes>,
    private geocodingApiKey: string,
    private geosearchApiKey: OpenCageGeoSearchKey,
  ) {}

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    const { body } = await this.#limiter.schedule(() =>
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

    const addresses: AddressDto[] = body.features
      .map(this.#featureToAddress)
      .filter(filterNotFalsy);

    return addresses.at(0);
  }

  public async lookupLocationName(
    query: string,
  ): Promise<LookupSearchResult[]> {
    const startDate = new Date();
    const queryMinLength = 3;
    try {
      if (query.length < queryMinLength)
        throw new Error(errorMessage.minimumCharErrorMessage(queryMinLength));

      const { body } = await this.#limiter.schedule(() =>
        this.httpClient.geosearch({
          headers: {
            "OpenCage-Geosearch-Key": this.geosearchApiKey,
            Origin: "https://immersion-facile.beta.gouv.fr", // OC Geosearch needs an Origin that fits to API key domain (with https://)
          },
          mode: "cors",
          queryParams: {
            countrycode: "fr",
            language,
            limit: "10",
            q: query,
          },
        }),
      );

      return lookupSearchResultsSchema.parse(toLookupSearchResults(body));
    } finally {
      calculateDurationInSecondsFrom(startDate);
      logger.info({
        method: "lookupLocationName",
        query,
        durationInSeconds: calculateDurationInSecondsFrom(startDate),
      });
    }
  }

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    const startDate = new Date();
    try {
      if (
        query.replace(lookupStreetAddressSpecialCharsRegex, "").length <
        lookupStreetAddressQueryMinLength
      )
        throw new Error(
          errorMessage.minimumCharErrorMessage(
            lookupStreetAddressQueryMinLength,
          ),
        );
      const { body } = await this.#limiter.schedule(() =>
        this.httpClient.geocoding({
          queryParams: {
            countrycode: franceAndAttachedTerritoryCountryCodes,
            key: this.geocodingApiKey,
            language,
            q: query,
          },
        }),
      );

      return body.features
        .map((feature) => this.#toAddressAndPosition(feature))
        .filter(filterNotFalsy);
    } finally {
      calculateDurationInSecondsFrom(startDate);
      logger.info({
        method: "lookupStreetAddress",
        query,
        durationInSeconds: calculateDurationInSecondsFrom(startDate),
      });
    }
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
