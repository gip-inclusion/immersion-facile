import type { Builder } from "../Builder";
import type {
  GeoPositionDto,
  WithGeoPosition,
} from "../geoPosition/geoPosition.dto";
import type { Flavor } from "../typeFlavors";

export type DepartmentName = Flavor<string, "DepartmentName">;
export type DepartmentCode = Flavor<string, "DepartmentCode">;

export type Postcode = Flavor<string, "Postcode">;

export type LookupAddress = Flavor<string, "LookupAddress">;
export type WithLookupAddressQueryParams = { lookup: LookupAddress };

export type LookupLocationInput = Flavor<string, "LookupLocation">;
export type WithLookupLocationInputQueryParams = { query: LookupLocationInput };

export type StreetNumberAndAddress = Flavor<string, "StreetNumberAndAddress">;
export type City = Flavor<string, "City">;

export type LookupSearchResult = WithGeoPosition & {
  label: string;
};

export type AddressDto = {
  streetNumberAndAddress: StreetNumberAndAddress;
  postcode: Postcode; // (ex: "75001")
  departmentCode: DepartmentCode; // numéro de département (ex: "75")
  city: City;
};

export type LocationId = Flavor<string, "AddressId">;

export type Location = {
  id: LocationId;
  position: GeoPositionDto;
  address: AddressDto;
};

export type AddressAndPosition = Omit<Location, "id">;

export const departmentNameToDepartmentCode: Record<
  DepartmentName,
  DepartmentCode
> = {
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
  Rhône: "69",
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
  "Saint-Pierre-et-Miquelon": "975",
  Mayotte: "976",
  "Saint-Barthélemy": "977",
  "Saint-Martin": "978",
};

export const getDepartmentCodeFromDepartmentNameOrCity: Record<
  DepartmentName,
  DepartmentCode
> = {
  ...departmentNameToDepartmentCode,
  "Île-de-France": "75",
  "Métropole de Lyon": "69",
  "Auvergne-Rhône-Alpes": "69",
};

export class LocationBuilder implements Builder<Location> {
  constructor(
    dto: Location = {
      address: {
        city: "Cergy",
        departmentCode: "95",
        postcode: "95000",
        streetNumberAndAddress: "5 Avenue Jean Bart",
      },
      id: "a352bd48-b0ed-4e02-a664-02725fab8ad3",
      position: { lat: 49.0317438, lon: 2.0606685 },
    },
  ) {
    this.#dto = dto;
  }

  public withPosition(position: GeoPositionDto) {
    return new LocationBuilder({ ...this.#dto, position });
  }

  public withId(id: LocationId) {
    return new LocationBuilder({ ...this.#dto, id });
  }

  public build(): Location {
    return this.#dto;
  }

  #dto: Location;
}
