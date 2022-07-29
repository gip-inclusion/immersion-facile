import { Flavor } from "../typeFlavors";

export type DepartmentCode = Flavor<string, "DepartmentCode">;
export type Postcode = Flavor<string, "Postcode">;

export type AddressDto = {
  streetNumberAndAddress: string;
  postcode: Postcode; // (ex: "75001")
  departmentCode: DepartmentCode; // numéro de département (ex: "75")
  city: string;
};

export const isAddressIdentical = (
  address: AddressDto,
  addressToCompare: AddressDto,
): boolean =>
  address.city === addressToCompare.city &&
  address.postcode === addressToCompare.postcode &&
  address.streetNumberAndAddress === addressToCompare.streetNumberAndAddress &&
  address.departmentCode === addressToCompare.departmentCode;


