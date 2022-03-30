import { trim } from "ramda";
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
    /(?<address>^.+) (?<postalCode>[0-9]{5}) (?<city>.+$)/u;
  const capture = captureAddressGroupsRegex.exec(fullAddressString);
  const address = capture?.groups?.["address"];
  const postalCode = capture?.groups?.["postalCode"];
  const city = capture?.groups?.["city"];

  return {
    address: trim(address ?? ""),
    postalCode: trim(postalCode ?? ""),
    city: trim(city ?? ""),
    validAddress: address != null && postalCode != null && city != null,
  };
};
