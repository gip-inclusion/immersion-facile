import {
  type ConventionDto,
  ConventionDtoBuilder,
  type DataWithPagination,
  expectToEqual,
} from "shared";
import { connectedUserConventionsToManageSelectors } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.selectors";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("ConnectedUserConventionsToManage", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("get the conventions for the connected user", () => {
    expectToEqual(
      connectedUserConventionsToManageSelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      connectedUserConventionsToManageSlice.actions.getConventionsForConnectedUserRequested(
        {
          params: {},
          jwt: "my-jwt",
          feedbackTopic: "connected-user-conventions",
        },
      ),
    );

    expectToEqual(
      connectedUserConventionsToManageSelectors.isLoading(store.getState()),
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
    expectToEqual(store.getState().connectedUserConventionsToManage, {
      isLoading: false,
      conventions: result.data,
      pagination: result.pagination,
    });
  });
});
