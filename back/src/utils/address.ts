import { AddressAndPosition, FormEstablishmentDto } from "shared";
import { AddressGateway } from "../domain/offer/ports/AddressGateway";

export const getAddressAndPosition = async (
  addressGateway: AddressGateway,
  formEstablishment: FormEstablishmentDto,
): Promise<AddressAndPosition> => {
  const positionAndAddress = (
    await addressGateway.lookupStreetAddress(formEstablishment.businessAddress)
  ).at(0);

  if (!positionAndAddress)
    throw new Error(
      `Cannot find the address ${formEstablishment.businessAddress} in API for establishment with siret ${formEstablishment.siret}`,
    );

  return positionAndAddress;
};
