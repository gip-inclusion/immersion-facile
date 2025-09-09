import {
  type ConventionDto,
  ConventionDtoBuilder,
  type DataWithPagination,
  expectToEqual,
} from "shared";
import { connectedUserConventionsSelectors } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.selectors";
import { connectedUserConventionsSlice } from "src/core-logic/domain/connected-user/conventions/connectedUserConventions.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("ConnectedUserConventions", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("get the conventions for the connected user", () => {
    expectToEqual(
      connectedUserConventionsSelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      connectedUserConventionsSlice.actions.getConventionsForConnectedUserRequested(
        {
          params: {},
          jwt: "my-jwt",
          feedbackTopic: "connected-user-conventions",
        },
      ),
    );

    expectToEqual(
      connectedUserConventionsSelectors.isLoading(store.getState()),
      true,
    );
    const result: DataWithPagination<ConventionDto> = {
      data: [new ConventionDtoBuilder().build()],
      pagination: {
        totalRecords: 10,
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
      },
    };
    dependencies.conventionGateway.getConventionsForUserResult$.next(result);
    expectToEqual(store.getState().connectedUserConventions, {
      isLoading: false,
      conventions: result.data,
      pagination: result.pagination,
    });
  });
});
