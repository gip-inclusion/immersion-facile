import { LookupSearchResult, WithLookupLocationInputQueryParams } from "shared";
import { InMemoryAddressGateway } from "../../../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { LookupLocation } from "./LookupLocation";

describe("Lookup Street Address", () => {
  let useCase: LookupLocation;
  let addressApiGateway: InMemoryAddressGateway;

  beforeEach(() => {
    addressApiGateway = new InMemoryAddressGateway();
    useCase = new LookupLocation(addressApiGateway);
  });

  it("retrieve location search result from query ''", async () => {
    const expectedLookupSearchResults: LookupSearchResult[] = [
      {
        label: "Barbezieux",
        position: {
          lat: 1111,
          lon: 1111,
        },
      },
    ];
    addressApiGateway.setLookupSearchResults(expectedLookupSearchResults);

    const lookupLocationInput: WithLookupLocationInputQueryParams = {
      query: "Barb",
    };
    expect(await useCase.execute(lookupLocationInput)).toEqual(
      expectedLookupSearchResults,
    );
  });
});
