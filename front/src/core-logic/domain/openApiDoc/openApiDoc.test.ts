import { OpenAPIV3 } from "openapi-types";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { openApiDocSelectors } from "./openApiDoc.selectors";
import { openApiDocSlice } from "./openApiDoc.slice";

const openApiDocFromApi: OpenAPIV3.Document = {
  info: {
    title: "in memory doc title",
    version: "v1",
  },
  openapi: "",
  paths: {},
};

describe("open api doc slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("fetches open api doc and shows when loading", () => {
    expectIsLoadingToBe(false);

    store.dispatch(openApiDocSlice.actions.fetchOpenApiDocRequested());
    expectIsLoadingToBe(true);

    dependencies.openApiDocGateway.openApiDoc$.next(openApiDocFromApi);
    expectIsLoadingToBe(false);
    expectOpenApiDocToEqual(openApiDocFromApi);
  });

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(openApiDocSelectors.isLoading(store.getState())).toBe(expected);
  };

  const expectOpenApiDocToEqual = (expected: OpenAPIV3.Document) => {
    expect(openApiDocSelectors.openApiDoc(store.getState())).toEqual(expected);
  };
});
