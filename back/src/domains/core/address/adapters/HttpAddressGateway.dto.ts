import { Point } from "geojson";

type OpenCageDataLookupSearchResult = {
  bounds?: {
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

export type GeoCodingQueryParams = {
  q: string;
  key: string;
  language?: string;
  countrycode?: string;
  limit?: string;
};

export type OpenCageDataFeatureCollection = GeoJSON.FeatureCollection<
  Point,
  OpenCageDataProperties
>;

export type OpenCageDataProperties = {
  components: OpenCageDataAddressComponents; // The address component
  confidence: number; // 10 is the best match inferior is less good
};

//Aliases Reference : https://github.com/OpenCageData/address-formatting/blob/master/conf/components.yaml
export type OpenCageDataAddressComponents = {
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
  postcode?: string;
  region?: string;
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
