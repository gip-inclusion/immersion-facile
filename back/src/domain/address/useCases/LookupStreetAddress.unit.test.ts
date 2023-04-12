import { AddressAndPosition, WithLookupAddressQueryParams } from "shared";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { LookupStreetAddress } from "./LookupStreetAddress";

describe("Lookup Street Address", () => {
  let useCase: LookupStreetAddress;
  let addressApiGateway: InMemoryAddressGateway;

  beforeEach(() => {
    addressApiGateway = new InMemoryAddressGateway();
    useCase = new LookupStreetAddress(addressApiGateway);
  });

  it("retrieve Street and Addresse from query ''", async () => {
    const expectedStreeAndAddresses: AddressAndPosition[] = [
      {
        address: {
          streetNumberAndAddress: "1 rue de la gare",
          departmentCode: "75001",
          city: "Paris",
          postcode: "75",
        },
        position: {
          lat: 1111,
          lon: 1111,
        },
      },
    ];
    addressApiGateway.setAddressAndPosition(expectedStreeAndAddresses);

    const lookupStreetAddressQuery: WithLookupAddressQueryParams = {
      lookup: "1 rue",
    };
    expect(await useCase.execute(lookupStreetAddressQuery)).toEqual(
      expectedStreeAndAddresses,
    );
  });
});
