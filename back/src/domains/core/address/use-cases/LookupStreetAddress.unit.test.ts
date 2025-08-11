import {
  type AddressWithCountryCodeAndPosition,
  defaultCountryCode,
  type Location,
  type WithLookupAddressQueryParams,
} from "shared";
import { InMemoryAddressGateway } from "../adapters/InMemoryAddressGateway";
import { LookupStreetAddress } from "./LookupStreetAddress";

describe("Lookup Street Address", () => {
  let useCase: LookupStreetAddress;
  let addressApiGateway: InMemoryAddressGateway;

  beforeEach(() => {
    addressApiGateway = new InMemoryAddressGateway();
    useCase = new LookupStreetAddress(addressApiGateway);
  });

  it("retrieve Street and Addresse from query ''", async () => {
    const location: Location = {
      id: "123",
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
    };
    const expectedStreetAndAddresses: AddressWithCountryCodeAndPosition[] = [
      {
        ...location,
        address: {
          ...location.address,
          countryCode: defaultCountryCode,
        },
      },
    ];
    addressApiGateway.setNextLookupStreetAndAddresses([
      expectedStreetAndAddresses,
    ]);

    const lookupStreetAddressQuery: WithLookupAddressQueryParams = {
      lookup: "1 rue",
      countryCode: defaultCountryCode,
    };
    expect(await useCase.execute(lookupStreetAddressQuery)).toEqual(
      expectedStreetAndAddresses,
    );
  });
});
