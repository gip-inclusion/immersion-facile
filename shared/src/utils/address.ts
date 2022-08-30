import { keys, trim } from "ramda";
import { AddressDto } from "../address/address.dto";
export interface CaptureAddressGroupsResult {
  validAddress: boolean;
  address: string;
  postalCode: string;
  city: string;
}

// In the solution context an address has the address api (https://adresse.data.gouv.fr) format with the groups
// "address postalCode city" in that order
// The 3 groups must be present for the address syntax to be considered valid
export const captureAddressGroups = (
  fullAddressString: string,
): CaptureAddressGroupsResult => {
  const captureAddressGroupsRegex =
    /(?<address>^.*)(?<postalCode>[0-9]{5}) (?<city>.+$)/u;
  const capture = captureAddressGroupsRegex.exec(fullAddressString);
  const address = capture?.groups?.["address"];
  const postalCode = capture?.groups?.["postalCode"];
  const city = capture?.groups?.["city"];

  return {
    address: dropLastComma(trim(address ?? "")),
    postalCode: trim(postalCode ?? ""),
    city: trim(city ?? ""),
    validAddress: address != null && postalCode != null && city != null,
  };
};
const dropLastComma = (text: string) => text.replace(/,(?=[^,]*$)/, "");

const DEPARTMENT_CODES_FROM_3_CHARS: Record<string, string> = {
  "971": "971",
  "972": "972",
  "973": "973",
  "974": "974",
  "975": "975",
  "976": "976",
  "200": "2A",
  "201": "2A",
  "202": "2B",
  "206": "2B",
};

export const inferDepartmentCode = (postcode: string): string => {
  if (keys(DEPARTMENT_CODES_FROM_3_CHARS).includes(postcode.slice(0, 3))) {
    return DEPARTMENT_CODES_FROM_3_CHARS[postcode.slice(0, 3)];
  }
  return postcode.slice(0, 2);
};

export const addressDtoToString = (address: AddressDto): string =>
  address.streetNumberAndAddress === address.city
    ? `${address.postcode} ${address.city}`
    : `${address.streetNumberAndAddress} ${address.postcode} ${address.city}`;

export const addressStringToDto = (address: string): AddressDto => {
  const addressGroups = captureAddressGroups(address);
  return {
    streetNumberAndAddress: addressGroups.address,
    city: addressGroups.city,
    departmentCode: inferDepartmentCode(addressGroups.postalCode),
    postcode: addressGroups.postalCode,
  };
};
