import { AddressAndPosition, Location, SiretDto } from "shared";
import { UuidV4Generator } from "../adapters/secondary/core/UuidGeneratorImplementations";
import { AddressGateway } from "../domain/offer/ports/AddressGateway";

const uuidV4Generator = new UuidV4Generator();

export const getAddressAndPosition = async (
  addressGateway: AddressGateway,
  businessAddress: string,
  businessSiret: SiretDto,
): Promise<Location> => {
  const positionAndAddress = (
    await addressGateway.lookupStreetAddress(businessAddress)
  ).at(0);

  if (!positionAndAddress)
    throw new Error(
      `Cannot find the address ${businessAddress} in API for establishment with siret ${businessSiret}`,
    );

  return {
    ...positionAndAddress,
    id: uuidV4Generator.new(),
  };
};
