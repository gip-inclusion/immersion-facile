import React from "react";
import { apiAddressGateway } from "src/app/config/dependencies";
import { AddressWithCoordinates } from "src/core-logic/ports/ApiAddressGateway";

export const getAddressesFromApi = async (
  term: string,
  setOptions: React.Dispatch<React.SetStateAction<AddressWithCoordinates[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<AddressWithCoordinates[]> => {
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];
  try {
    setIsSearching(true);
    const addresses = await apiAddressGateway.lookupStreetAddress(
      sanitizedTerm,
    );
    setOptions(addresses);
    return addresses;
  } catch (e: any) {
    //eslint-disable-next-line no-console
    console.error("lookupStreetAddress", e);
    return [];
  } finally {
    setIsSearching(false);
  }
};
