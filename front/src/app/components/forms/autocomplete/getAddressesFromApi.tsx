import React from "react";
import { AddressAndPosition } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

export const getAddressesFromApi = async (
  term: string,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
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
