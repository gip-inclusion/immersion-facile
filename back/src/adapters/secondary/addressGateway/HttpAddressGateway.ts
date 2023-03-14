import axios from "axios";
import { Point } from "geojson";
import {
  configureHttpClient,
  createAxiosHandlerCreator,
  createTargets,
  CreateTargets,
  HttpClient,
  Target,
} from "http-client";
import {
  AbsoluteUrl,
  AddressAndPosition,
  AddressDto,
  departmentNameToDepartmentCode,
  GeoPositionDto,
  LookupSearchResult,
  lookupSearchResultsSchema,
  OpenCageGeoSearchKey,
  City,
  DepartmentName,
  StreetNumberAndAddress,
  Postcode,
} from "shared";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";

export const errorMessage = {
  minimumCharErrorMessage: (minLength: number) =>
    `Lookup street address require a minimum of ${minLength} char.`,
};

// https://github.com/OpenCageData/opencagedata-misc-docs/blob/master/countrycode.md
// On prends la france et toutes ses territoires dépendants.
const openCageDataBaseUrl = "https://api.opencagedata.com" as const;

// https://api.gouv.fr/les-api/base-adresse-nationale
const apiAddressBaseUrl: AbsoluteUrl = `https://api-adresse.data.gouv.fr`;

const getDepartmentCodeUrl = `${apiAddressBaseUrl}/search` as const;
const geoCodingUrl = `${openCageDataBaseUrl}/geocode/v1/geojson` as const;
const geoSearchUrl = `${openCageDataBaseUrl}/geosearch` as const;

const franceAndAttachedTerritoryCountryCodes =
  "fr,bl,gf,gp,mf,mq,nc,pf,pm,re,tf,wf,yt";
const language = "fr";

type DepartmentCodeQueryParams = {
  q: string;
};

type GeoCodingQueryParams = {
  q: string;
  key: string;
  language?: string;
  countrycode?: string;
  limit?: string;
};

type GeoSearchQueryParams = {
  q: string;
  language?: string;
  countrycode?: string;
  limit?: string;
};

type GeoSearchHeaders = {
  "OpenCage-Geosearch-Key": OpenCageGeoSearchKey;
  Origin: string;
};

type OpenCageDataLookupSearchResult = {
  bounds: {
    northeast: {
      lat: string;
      lng: string;
    };
    southwest: {
      lat: string;
      lng: string;
    };
  };
  formatted: string;
  geometry: {
    lat: string;
    lng: string;
  };
  name: string;
};

export type AddressesTargets = CreateTargets<{
  getDepartmentCode: Target<
    void,
    DepartmentCodeQueryParams,
    void,
    typeof getDepartmentCodeUrl
  >;
  geocoding: Target<void, GeoCodingQueryParams, void, typeof geoCodingUrl>;
  geosearch: Target<
    void,
    GeoSearchQueryParams,
    GeoSearchHeaders,
    typeof geoSearchUrl
  >;
}>;

export const addressesExternalTargets = createTargets<AddressesTargets>({
  getDepartmentCode: {
    method: "GET",
    url: getDepartmentCodeUrl,
  },
  geocoding: {
    method: "GET",
    url: geoCodingUrl,
  },
  geosearch: {
    method: "GET",
    url: geoSearchUrl,
  },
});

const AXIOS_TIMEOUT_MS = 10_000;

export const createHttpAddressClient = configureHttpClient(
  createAxiosHandlerCreator(axios.create({ timeout: AXIOS_TIMEOUT_MS })),
);

export class HttpAddressGateway implements AddressGateway {
  constructor(
    private readonly httpClient: HttpClient<AddressesTargets>,
    private geocodingApiKey: string,
    private geosearchApiKey: OpenCageGeoSearchKey,
  ) {}

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    const { responseBody } = await this.httpClient.geocoding({
      queryParams: {
        countrycode: franceAndAttachedTerritoryCountryCodes,
        key: this.geocodingApiKey,
        language,
        limit: "5",
        q: `${position.lat}+${position.lon}`,
      },
    });

    const addresses: AddressDto[] = (
      responseBody as OpenCageDataFeatureCollection
    ).features
      .map(this.featureToAddress)
      .filter((feature): feature is AddressDto => !!feature);

    return addresses.at(0);
  }

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    // eslint-disable-next-line no-console
    console.time(`lookupStreetAddress Duration - ${query}`);
    const queryMinLength = 2;
    try {
      if (query.length < queryMinLength)
        throw new Error(errorMessage.minimumCharErrorMessage(queryMinLength));
      const { responseBody } = await this.httpClient.geocoding({
        queryParams: {
          countrycode: franceAndAttachedTerritoryCountryCodes,
          key: this.geocodingApiKey,
          language,
          q: query,
        },
      });

      return (responseBody as OpenCageDataFeatureCollection).features
        .map((feature) => this.toAddressAndPosition(feature))
        .filter((feature): feature is AddressAndPosition => !!feature);
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(`lookupStreetAddress Duration - ${query}`);
    }
  }

  public async lookupLocationName(
    query: string,
  ): Promise<LookupSearchResult[]> {
    // eslint-disable-next-line no-console
    console.time(`lookupLocationName Duration - ${query}`);
    const queryMinLength = 3;
    try {
      if (query.length < queryMinLength)
        throw new Error(errorMessage.minimumCharErrorMessage(queryMinLength));

      const { responseBody } = await this.httpClient.geosearch({
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
      });
      return lookupSearchResultsSchema.parse(
        toLookupSearchResults(
          responseBody as OpenCageDataSearchResultCollection,
        ),
      );
    } finally {
      // eslint-disable-next-line no-console
      console.timeEnd(`lookupStreetAddress Duration - ${query}`);
    }
  }

  private toAddressAndPosition(
    feature: GeoJSON.Feature<Point, OpenCageDataProperties>,
  ): AddressAndPosition | undefined {
    const address = this.featureToAddress(feature);
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

  private featureToAddress(
    feature: GeoJSON.Feature<Point, OpenCageDataProperties>,
  ): AddressDto | undefined {
    const components = feature.properties.components;
    const city = getCityFromAliases(components);
    const postcode = getPostcodeFromAliases(components);
    const departmentName = getDepartmentNameFromAliases(components);
    // OpenCageData gives the department name but not the code.
    const departmentCode =
      departmentName && departmentNameToDepartmentCode[departmentName];

    return (
      city &&
      departmentCode &&
      postcode && {
        streetNumberAndAddress: makeStreetNumberAndAddress(
          getStreetNumberFromAliases(components),
          getStreetNameFromAliases(components),
        ),
        postcode,
        departmentCode,
        city,
      }
    );
  }
}

// Using the GeoJson standard: https://geojson.org/
type OpenCageDataFeatureCollection = GeoJSON.FeatureCollection<
  Point,
  OpenCageDataProperties
>;

type OpenCageDataProperties = {
  components: OpenCageDataAddressComponents; // The address component
  confidence: number; // 10 is the best match inferior is less good
};

type OpenCageDataSearchResultCollection = {
  // move to shared ?
  documentation: string;
  licenses: object[];
  results: OpenCageDataLookupSearchResult[];
  status: object;
  stay_informed: object;
  thanks: string;
  timestamp: object;
  total_results: number;
};

//Aliases Reference : https://github.com/OpenCageData/address-formatting/blob/master/conf/components.yaml
type OpenCageDataAddressComponents = {
  city?: string;
  county?: string;
  county_code?: string;
  department?: string;
  footway?: string;
  house_number?: string;
  housenumber?: string;
  path?: string;
  pedestrian?: string;
  place?: string;
  postcode: string;
  region: string;
  residential?: string;
  road?: string;
  road_reference?: string;
  road_reference_intl?: string;
  square?: string;
  state?: string;
  state_district?: string;
  street?: string;
  street_name?: string;
  street_number?: string;
  town?: string;
  township?: string;
  village?: string;
};

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
  components.village;

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
