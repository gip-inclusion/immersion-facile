import type { Location } from "shared";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";

const uuidV4Generator = new UuidV4Generator();

export const query8bdduportLookup = "8+bd+du+port";
export const expected8bdduportAddressAndPositions: Location[] = [
  {
    address: {
      city: "Amiens",
      departmentCode: "80",
      postcode: "80000",
      streetNumberAndAddress: "8 Boulevard du Port",
    },
    position: {
      lat: 49.897442,
      lon: 2.290084,
    },
    id: uuidV4Generator.new(),
  },
  {
    address: {
      city: "Cergy",
      departmentCode: "95",
      postcode: "95000",
      streetNumberAndAddress: "8 Boulevard du Port",
    },
    position: {
      lat: 49.0317,
      lon: 2.062794,
    },
    id: uuidV4Generator.new(),
  },
  {
    address: {
      city: "Mèze",
      departmentCode: "34",
      postcode: "34140",
      streetNumberAndAddress: "8 Boulevard du Port",
    },
    position: {
      lat: 43.425225,
      lon: 3.605884,
    },
    id: uuidV4Generator.new(),
  },
  {
    address: {
      city: "Le Barcarès",
      departmentCode: "66",
      postcode: "66420",
      streetNumberAndAddress: "8 Boulevard du Port",
    },
    position: {
      lat: 42.79091,
      lon: 3.036731,
    },
    id: uuidV4Generator.new(),
  },
  {
    address: {
      city: "Pornichet",
      departmentCode: "44",
      postcode: "44380",
      streetNumberAndAddress: "8 Boulevard du Port",
    },
    position: {
      lat: 47.258811,
      lon: -2.340983,
    },
    id: uuidV4Generator.new(),
  },
];
