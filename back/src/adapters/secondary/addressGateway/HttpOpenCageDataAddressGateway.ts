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
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  GeoPositionDto,
} from "shared";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";

// https://github.com/OpenCageData/opencagedata-misc-docs/blob/master/countrycode.md
// On prends la france et toutes ses territoires dépendants.
const baseUrl = "https://api.opencagedata.com/geocode/v1/geojson";
type BaseUrl = typeof baseUrl;
const franceAndAttachedTerritoryCountryCodes =
  "fr,bl,gf,gp,mf,mq,nc,pf,pm,re,tf,wf,yt";
const language = "fr";
type QueryParams = {
  q: string;
  key: string;
  language?: string;
  countrycode?: string;
  limit?: string;
};

export type OpenCageDataTargets = CreateTargets<{
  geocoding: Target<void, QueryParams, void, BaseUrl>;
}>;

export const openCageDataTargets = createTargets<OpenCageDataTargets>({
  geocoding: {
    method: "GET",
    url: baseUrl,
  },
});

const AXIOS_TIMEOUT_MS = 10_000;
export const createHttpOpenCageDataClient = configureHttpClient(
  createAxiosHandlerCreator(axios.create({ timeout: AXIOS_TIMEOUT_MS })),
);
export const queryMinLength = 2;
export const minimumCharErrorMessage = (minLength: number) =>
  `Lookup street address require a minimum of ${minLength} char.`;

export class HttpOpenCageDataAddressGateway implements AddressGateway {
  constructor(
    private readonly httpClient: HttpClient<OpenCageDataTargets>,
    private apiKey: string,
  ) {}

  public async findDepartmentCodeFromPostCode(
    postCode: string,
  ): Promise<DepartmentCode | null> {
    const reponse = await this.httpClient.geocoding({
      queryParams: {
        countrycode: franceAndAttachedTerritoryCountryCodes,
        key: this.apiKey,
        language,
        limit: "1",
        q: postCode,
      },
    });

    const feature = (
      reponse.responseBody as OpenCageDataFeatureCollection
    ).features.at(0);

    const department =
      feature && getDepartmentFromAliases(feature.properties.components);

    return department ? departmentNameToDepartmentCode[department] : null;
  }

  public async getAddressFromPosition(
    position: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    const { responseBody } = await this.httpClient.geocoding({
      queryParams: {
        countrycode: franceAndAttachedTerritoryCountryCodes,
        key: this.apiKey,
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
    try {
      if (query.length < queryMinLength)
        throw new Error(minimumCharErrorMessage(queryMinLength));
      const { responseBody } = await this.httpClient.geocoding({
        queryParams: {
          countrycode: franceAndAttachedTerritoryCountryCodes,
          key: this.apiKey,
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

const departmentNameToDepartmentCode: Record<string, string> = {
  Ain: "01",
  Aisne: "02",
  Allier: "03",
  "Alpes-de-Haute-Provence": "04",
  "Hautes-Alpes": "05",
  "Alpes-Maritimes": "06",
  Ardèche: "07",
  Ardennes: "08",
  Ariège: "09",
  Aube: "10",
  Aude: "11",
  Aveyron: "12",
  "Bouches-du-Rhône": "13",
  Calvados: "14",
  Cantal: "15",
  Charente: "16",
  "Charente-Maritime": "17",
  Cher: "18",
  Corrèze: "19",
  "Côte-d'Or": "21",
  "Côtes-d'Armor": "22",
  Creuse: "23",
  Dordogne: "24",
  Doubs: "25",
  Drôme: "26",
  Eure: "27",
  "Eure-et-Loir": "28",
  Finistère: "29",
  "Corse-du-Sud": "2A",
  "Haute-Corse": "2B",
  Gard: "30",
  "Haute-Garonne": "31",
  Gers: "32",
  Gironde: "33",
  Hérault: "34",
  "Ille-et-Vilaine": "35",
  Indre: "36",
  "Indre-et-Loire": "37",
  "Île-de-France": "75",
  Isère: "38",
  Jura: "39",
  Landes: "40",
  "Loir-et-Cher": "41",
  Loire: "42",
  "Haute-Loire": "43",
  "Loire-Atlantique": "44",
  Loiret: "45",
  Lot: "46",
  "Lot-et-Garonne": "47",
  Lozère: "48",
  "Maine-et-Loire": "49",
  Manche: "50",
  Marne: "51",
  "Haute-Marne": "52",
  Mayenne: "53",
  "Meurthe-et-Moselle": "54",
  Meuse: "55",
  Morbihan: "56",
  Moselle: "57",
  Nièvre: "58",
  Nord: "59",
  Oise: "60",
  Orne: "61",
  "Pas-de-Calais": "62",
  "Puy-de-Dôme": "63",
  "Pyrénées-Atlantiques": "64",
  "Hautes-Pyrénées": "65",
  "Pyrénées-Orientales": "66",
  "Bas-Rhin": "67",
  "Haut-Rhin": "68",
  "Auvergne-Rhône-Alpes": "69",
  Rhône: "69",
  "Métropole de Lyon": "69",
  "Haute-Saône": "70",
  "Saône-et-Loire": "71",
  Sarthe: "72",
  Savoie: "73",
  "Haute-Savoie": "74",
  Paris: "75",
  "Seine-Maritime": "76",
  "Seine-et-Marne": "77",
  Yvelines: "78",
  "Deux-Sèvres": "79",
  Somme: "80",
  Tarn: "81",
  "Tarn-et-Garonne": "82",
  Var: "83",
  Vaucluse: "84",
  Vendée: "85",
  Vienne: "86",
  "Haute-Vienne": "87",
  Vosges: "88",
  Yonne: "89",
  "Territoire-de-Belfort": "90",
  Essonne: "91",
  "Hauts-de-Seine": "92",
  "Seine-Saint-Denis": "93",
  "Val-de-Marne": "94",
  "Val-d'Oise": "95",
  Guadeloupe: "971",
  Martinique: "972",
  Guyane: "973",
  "La Réunion": "974",
  Mayotte: "976",
};
