import { FormEstablishmentAddress, Location, SiretDto } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { AddressGateway } from "../domain/offer/ports/AddressGateway";

export const rawAddressToLocation = async (
  addressGateway: AddressGateway,
  businessSiret: SiretDto,
  formEstablishementAddress: FormEstablishmentAddress,
): Promise<Location> => {
  const positionAndAddress = (
    await addressGateway.lookupStreetAddress(
      formEstablishementAddress.rawAddress,
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
