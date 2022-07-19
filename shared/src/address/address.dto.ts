import { Flavor } from "../typeFlavors";

export type CountyCode = Flavor<string, "CountyCode">;
export type PostCode = Flavor<string, "PostCode">;

export type AddressDto = {
  streetNumberAndAddress: string;
  postCode: PostCode; // (ex: "75001")
  countyCode: CountyCode; // numéro de département (ex: "75")
  city: string;
};
