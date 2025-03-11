import type { Dispatch, SetStateAction } from "react";
import type { AddressAndPosition } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

export const getAddressesFromApi = async (
  term: string,
  setOptions: Dispatch<SetStateAction<AddressAndPosition[]>>,
  setIsSearching: Dispatch<SetStateAction<boolean>>,
): Promise<AddressAndPosition[]> => {
  try {
    setIsSearching(true);
    const addresses =
      await outOfReduxDependencies.addressGateway.lookupStreetAddress(term);
    setOptions(addresses);
    return addresses;
  } catch (_e: any) {
    return [];
  } finally {
    setIsSearching(false);
  }
};
