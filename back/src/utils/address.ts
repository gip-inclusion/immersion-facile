import { omit } from "ramda";
import {
  type AddressDto,
  defaultCountryCode,
  type FormEstablishmentAddress,
  type Location,
  type LocationId,
  type SiretDto,
} from "shared";
import type { AddressGateway } from "../domains/core/address/ports/AddressGateway";

export const rawAddressToLocation = async (
  addressGateway: AddressGateway,
  businessSiret: SiretDto,
  formEstablishementAddress: FormEstablishmentAddress,
): Promise<Location> => {
  const addressWithCountryCodeAndPosition = (
    await addressGateway.lookupStreetAddress(
      formEstablishementAddress.rawAddress,
      defaultCountryCode,
    )
  ).at(0);

  if (!addressWithCountryCodeAndPosition)
    throw new Error(
      `Cannot find the address ${formEstablishementAddress.rawAddress} in API for establishment with siret ${businessSiret}`,
    );

  return {
    ...addressWithCountryCodeAndPosition,
    address: omit(["countryCode"], addressWithCountryCodeAndPosition.address),
    id: formEstablishementAddress.id,
  };
};

export const locationToRawAddress = (
  id: LocationId,
  address: AddressDto,
): FormEstablishmentAddress => ({
  id,
  rawAddress: `${address.streetNumberAndAddress}, ${address.postcode} ${address.city}`,
});
