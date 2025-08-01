import type {
  AddressDto,
  FormEstablishmentAddress,
  Location,
  LocationId,
  SiretDto,
} from "shared";
import type { AddressGateway } from "../domains/core/address/ports/AddressGateway";

export const rawAddressToLocation = async (
  addressGateway: AddressGateway,
  businessSiret: SiretDto,
  formEstablishementAddress: FormEstablishmentAddress,
): Promise<Location> => {
  const positionAndAddress = (
    await addressGateway.lookupStreetAddress(
      formEstablishementAddress.rawAddress,
      "FR",
    )
  ).at(0);

  if (!positionAndAddress)
    throw new Error(
      `Cannot find the address ${formEstablishementAddress.rawAddress} in API for establishment with siret ${businessSiret}`,
    );

  return {
    ...positionAndAddress,
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
