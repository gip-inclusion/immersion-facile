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
  DepartmentCode,
  departmentNameToDepartmentCode,
  featureToAddressDto,
  GeoPositionDto,
  LookupSearchResult,
  lookupSearchResultsSchema,
  OpenCageGeoSearchKey,
  toFeatureCollection,
} from "shared";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";

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
export const minimumCharErrorMessage = (minLength: number) =>
  `Lookup street address require a minimum of ${minLength} char.`;

export class HttpAddressGateway implements AddressGateway {
  constructor(
    private readonly httpClient: HttpClient<AddressesTargets>,
    private geocodingApiKey: string,
    private geosearchApiKey: OpenCageGeoSearchKey,
  ) {}
  public async getDepartmentCodeFromAddressAPI(
    postCode: string,
  ): Promise<DepartmentCode | null> {
    const response = await this.httpClient.getDepartmentCode({
      queryParams: {
        q: postCode,
      },
    });
    const feature = toFeatureCollection(response.responseBody).features.at(0);
    if (!feature) {
      throw new Error(`No feature on Address API for postCode ${postCode}`);
    }
    return featureToAddressDto(feature).departmentCode;
  }
  public async findDepartmentCodeFromPostCode(
    postCode: string,
  ): Promise<DepartmentCode | null> {
    const response = await this.httpClient.geocoding({
      queryParams: {
        countrycode: franceAndAttachedTerritoryCountryCodes,
        key: this.geocodingApiKey,
        language,
        limit: "1",
        q: postCode,
      },
    });

    const feature = (
      response.responseBody as OpenCageDataFeatureCollection
    ).features.at(0);
    if (!feature) throw new Error(missingFeatureForPostcode(postCode));
    const department = getDepartmentFromAliases(feature.properties.components);
    if (!department) return this.getDepartmentCodeFromAddressAPI(postCode);

    const departmentCode = departmentNameToDepartmentCode[department];
    if (!departmentCode)
      throw new Error(
        `Department '${department}' not found on departmentNameToDepartmentCode mapping.`,
      );
    return departmentCode;
  }

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    const { responseBody } = await this.httpClient.geocoding({
      queryParams: {
        countrycode: franceAndAttachedTerritoryCountryCodes,
        key: this.geocodingApiKey,
        language,
        limit: "1",
        q: `${position.lat}+${position.lon}`,
      },
    });

    const feature = (responseBody as OpenCageDataFeatureCollection).features.at(
      0,
    );
    return feature && this.featureToAddress(feature);
  }
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    // eslint-disable-next-line no-console
    console.time(`lookupStreetAddress Duration - ${query}`);
    const queryMinLength = 2;
    try {
      if (query.length < queryMinLength)
        throw new Error(minimumCharErrorMessage(queryMinLength));
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
        throw new Error(minimumCharErrorMessage(queryMinLength));

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
    const department: string | undefined = getDepartmentFromAliases(components);
    const city: string | undefined = getCityFromAliases(components);
    const streetName: string | undefined = getStreetNameFromAliases(components);
    const streetNumber: string | undefined =
      getStreetNumberFromAliases(components);

    if (!(city && department)) return undefined;

    // OpenCageData gives the department name but not the code.
    const departmentCode = departmentNameToDepartmentCode[department];
    if (!departmentCode) return undefined;

    const streetNumberAndAddress = `${streetNumber ?? ""} ${
      streetName ?? ""
    }`.trim();

    return {
      streetNumberAndAddress,
      postcode: components.postcode ?? "",
      departmentCode,
      city,
    };
  }
}

// Using the GeoJson standard: https://geojson.org/
type OpenCageDataFeatureCollection = GeoJSON.FeatureCollection<
  Point,
  OpenCageDataProperties
>;

export type OpenCageDataSearchResultCollection = {
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

type OpenCageDataProperties = {
  components: OpenCageDataAddressComponents; // The address component
  confidence: number; // 10 is the best match inferior is less good
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
): string | undefined =>
  components.city ??
  components.town ??
  components.township ??
  components.village;

// We have the best results for department when merging 'county' and 'state' related keys
const getDepartmentFromAliases = (components: OpenCageDataAddressComponents) =>
  components.county ??
  components.county_code ??
  components.department ??
  components.state_district ??
  components.state;

export const missingFeatureForPostcode = (postCode: string) =>
  `No OCD feature found for postCode ${postCode}.`;
export const missingDepartmentOnFeatureForPostcode = (
  postCode: string,
  components: any,
) =>
  `No department provided for postcode ${postCode}. OCD Components: ${JSON.stringify(
    components,
  )}`;

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
