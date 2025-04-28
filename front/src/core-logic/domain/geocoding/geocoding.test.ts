import {
  type AddressAndPosition,
  expectArraysToEqual,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { geocodingSelectors } from "src/core-logic/domain/geocoding/geocoding.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { geocodingSlice } from "./geocoding.slice";

describe("Geocoding epic", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should reset the value and suggestions when the query has been emptied", () => {
    store.dispatch(
      geocodingSlice.actions.suggestionHasBeenSelected({
        addressAndPosition: {
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75000",
            streetNumberAndAddress: "123 Rue de la Paix",
          },
          position: {
            lat: 48.8566,
            lon: 2.3522,
          },
        },
        addressAutocompleteLocator: "conventionImmersionAddress",
      }),
    );
    store.dispatch(geocodingSlice.actions.queryWasEmptied());
    expect(store.getState().geocoding.values).toBeNull();
    expect(store.getState().geocoding.suggestions).toEqual([]);
  });

  it("should update the searched query and reset the state", () => {
    const query = "foi";
    store.dispatch(
      geocodingSlice.actions.queryHasChanged({
        locator: "conventionImmersionAddress",
        lookupAddress: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    expectQueryToBe(query);
  });

  it("shouldn't update the searched query if threshold is not reached", () => {
    const query = "fo";
    store.dispatch(
      geocodingSlice.actions.queryHasChanged({
        locator: "conventionImmersionAddress",
        lookupAddress: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectLoadingToBe(false);
    expectQueryToBe("");
  });

  it("should trigger a new request to the gateway when query > threshold", () => {
    const query = "Poit";
    const expectedSuggestions: AddressAndPosition[] = [
      {
        address: {
          city: "Saint-Georges-les-Baillargeaux",
          departmentCode: "86",
          postcode: "86110",
          streetNumberAndAddress: "123 Rue de la Paix",
        },
        position: {
          lat: 45.984,
          lon: 2.5465,
        },
      },
    ];
    store.dispatch(
      geocodingSlice.actions.queryHasChanged({
        locator: "conventionImmersionAddress",
        lookupAddress: query,
      }),
    );
    expectDebouncingToBe(true);
    dependencies.scheduler.flush();
    expectDebouncingToBe(false);
    expectLoadingToBe(true);
    dependencies.addressGateway.lookupStreetAddressResults$.next(
      expectedSuggestions,
    );
    expectLoadingToBe(false);
    expectSuggestionsToBe(expectedSuggestions);
  });

  it("should update selected suggestion in store", () => {
    const addressAndPosition: AddressAndPosition = {
      address: {
        city: "Paris",
        departmentCode: "75",
        postcode: "75000",
        streetNumberAndAddress: "123 Rue de la Paix",
      },
      position: {
        lat: 49.6548,
        lon: 2.65498,
      },
    };
    store.dispatch(
      geocodingSlice.actions.suggestionHasBeenSelected({
        addressAndPosition,
        addressAutocompleteLocator: "conventionImmersionAddress",
      }),
    );
    expectSelectedSuggestionToBe(addressAndPosition);
  });

  it("should throw an error if something goes wrong and returns error feedback", () => {
    const errorMessage = "Error trying to get location";
    store.dispatch(
      geocodingSlice.actions.suggestionsHaveBeenRequested({
        locator: "conventionImmersionAddress",
        lookupAddress: "bord",
        selectFirstSuggestion: false,
      }),
    );
    dependencies.addressGateway.lookupStreetAddressResults$.error(
      new Error(errorMessage),
    );
    expectLoadingToBe(false);
  });

  it("should select the first suggestion if selectFirstSuggestion is true", () => {
    const expectedSuggestions: AddressAndPosition[] = [
      {
        address: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75000",
          streetNumberAndAddress: "123 Rue de la Paix",
        },
        position: {
          lat: 48.8566,
          lon: 2.3522,
        },
      },
    ];
    store.dispatch(
      geocodingSlice.actions.suggestionsHaveBeenRequested({
        locator: "conventionImmersionAddress",
        lookupAddress: "bord",
        selectFirstSuggestion: true,
      }),
    );
    dependencies.addressGateway.lookupStreetAddressResults$.next(
      expectedSuggestions,
    );
    expectLoadingToBe(false);
    expectSelectedSuggestionToBe(expectedSuggestions[0]);
  });

  it("should select the first suggestion if siret info is successfully fetched", () => {
    const expectedSuggestions: AddressAndPosition[] = [
      {
        address: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75000",
          streetNumberAndAddress: "123 Rue de la Paix",
        },
        position: {
          lat: 48.8566,
          lon: 2.3522,
        },
      },
    ];
    store.dispatch(
      siretSlice.actions.siretInfoSucceeded({
        siretEstablishment: {
          businessAddress: "123 Rue de la Paix",
          businessName: "test",
          isOpen: true,
          numberEmployeesRange: "1-2",
          siret: "12345678901234",
        },
        feedbackTopic: "siret-input",
        addressAutocompleteLocator: "conventionImmersionAddress",
      }),
    );
    dependencies.addressGateway.lookupStreetAddressResults$.next(
      expectedSuggestions,
    );
    expectLoadingToBe(false);
    expectSelectedSuggestionToBe(expectedSuggestions[0]);
  });

  const expectQueryToBe = (expected: string) => {
    expectToEqual(geocodingSelectors.query(store.getState()), expected);
  };
  const expectLoadingToBe = (expected: boolean) => {
    expectToEqual(geocodingSelectors.isLoading(store.getState()), expected);
  };
  const expectDebouncingToBe = (expected: boolean) => {
    expectToEqual(geocodingSelectors.isDebouncing(store.getState()), expected);
  };
  const expectSuggestionsToBe = (expected: AddressAndPosition[]) => {
    expectArraysToEqual(
      geocodingSelectors.suggestions(store.getState()),
      expected,
    );
  };
  const expectSelectedSuggestionToBe = (expected: AddressAndPosition) => {
    expectObjectsToMatch(geocodingSelectors.value(store.getState()), {
      conventionImmersionAddress: expected,
    });
  };
});
