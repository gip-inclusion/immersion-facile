import type {
  LookupSearchResult,
  WithLookupLocationInputQueryParams,
} from "shared";
import { InMemoryAddressGateway } from "../adapters/InMemoryAddressGateway";
import { type LookupLocation, makeLookupLocation } from "./LookupLocation";

describe("Lookup Street Address", () => {
  let useCase: LookupLocation;
  let addressGateway: InMemoryAddressGateway;

  beforeEach(() => {
    addressGateway = new InMemoryAddressGateway();
    useCase = makeLookupLocation({ deps: { addressGateway } });
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
    addressGateway.setLookupSearchResults(expectedLookupSearchResults);

    const lookupLocationInput: WithLookupLocationInputQueryParams = {
      query: "Barb",
    };
    expect(await useCase.execute(lookupLocationInput)).toEqual(
      expectedLookupSearchResults,
    );
  });
});
