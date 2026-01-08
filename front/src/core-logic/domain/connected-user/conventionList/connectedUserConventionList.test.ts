import {
  ConventionDtoBuilder,
  type ConventionReadDto,
  type DataWithPagination,
  defaultPerPageInWebPagination,
  expectToEqual,
  type FlatGetConventionsForAgencyUserParams,
} from "shared";
import { conventionListSelectors } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.selectors";
import {
  type ConventionListState,
  conventionListSlice,
  initialConventionWithPagination,
} from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("ConnectedUserConventionList", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  const conventionListFetchErrorMessage = "Convention list fetch error";
  const conventionListFetchError = new Error(conventionListFetchErrorMessage);
  const defaultConventionListState: ConventionListState = {
    isLoading: false,
    conventionsWithPagination: initialConventionWithPagination,
  };
  const jwt = "my-jwt";

  const agencyFields = {
    agencyContactEmail: "contact@mail.com",
    agencyName: "Agency Name",
    agencyDepartment: "75",
    agencyKind: "pole-emploi" as const,
    agencySiret: "11112222000033",
    agencyCounsellorEmails: [],
    agencyValidatorEmails: [],
  };

  const convention1: ConventionReadDto = {
    ...new ConventionDtoBuilder()
      .withId("convention-1")
      .withDateStart("2024-01-15")
      .build(),
    ...agencyFields,
    assessment: null,
  };

  const convention2: ConventionReadDto = {
    ...new ConventionDtoBuilder()
      .withId("convention-2")
      .withDateStart("2024-02-20")
      .build(),
    ...agencyFields,
    assessment: null,
  };

  const conventionsWithPagination: DataWithPagination<ConventionReadDto> = {
    data: [convention1, convention2],
    pagination: {
      totalRecords: 2,
      currentPage: 1,
      totalPages: 1,
      numberPerPage: defaultPerPageInWebPagination,
    },
  };

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("on convention list fetched successfully", () => {
    expectConventionListSelector(defaultConventionListState);

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: {
          sortBy: "dateStart",
          sortDirection: "desc",
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    expectConventionListSelector({
      ...defaultConventionListState,
      isLoading: true,
    });

    feedGatewayWithConventionListOrError(conventionsWithPagination);

    expectConventionListSelector({
      ...defaultConventionListState,
      conventionsWithPagination: {
        ...conventionsWithPagination,
        filters: {
          sortBy: "dateStart",
          sortDirection: "desc",
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
      },
    });
  });

  it("on convention list fetched failed", () => {
    expectConventionListSelector(defaultConventionListState);

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: {
          sortBy: "dateStart",
          sortDirection: "desc",
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    expectConventionListSelector({
      ...defaultConventionListState,
      isLoading: true,
    });

    feedGatewayWithConventionListOrError(conventionListFetchError);

    expectConventionListSelector({
      ...defaultConventionListState,
    });
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "connected-user-conventionList": {
        on: "fetch",
        level: "error",
        title: "Problème lors de la récupération des conventions",
        message: conventionListFetchErrorMessage,
      },
    });
  });

  it("updates filters when fetching convention list", () => {
    expectConventionListSelector(defaultConventionListState);

    const customFilters: FlatGetConventionsForAgencyUserParams = {
      sortBy: "dateStart",
      sortDirection: "asc",
      page: 2,
      perPage: 20,
    };

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: customFilters,
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    expectConventionListSelector({
      ...defaultConventionListState,
      isLoading: true,
      conventionsWithPagination: {
        ...defaultConventionListState.conventionsWithPagination,
        filters: customFilters,
      },
    });
  });

  it("previous convention list in state preserved on new fetch requested", () => {
    expectConventionListSelector(defaultConventionListState);

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: {
          sortBy: "dateStart",
          sortDirection: "desc",
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    feedGatewayWithConventionListOrError(conventionsWithPagination);

    expectConventionListSelector({
      ...defaultConventionListState,
      conventionsWithPagination: {
        ...conventionsWithPagination,
        filters: {
          sortBy: "dateStart",
          sortDirection: "desc",
          page: 1,
          perPage: defaultPerPageInWebPagination,
        },
      },
    });

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: {
          sortBy: "dateStart",
          sortDirection: "asc",
          page: 2,
          perPage: 10,
        },
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    expectConventionListSelector({
      ...defaultConventionListState,
      isLoading: true,
      conventionsWithPagination: {
        ...conventionsWithPagination,
        filters: {
          sortBy: "dateStart",
          sortDirection: "asc",
          page: 2,
          perPage: 10,
        },
      },
    });
  });

  it("clears convention list filters", () => {
    expectConventionListSelector(defaultConventionListState);

    const customFilters: FlatGetConventionsForAgencyUserParams = {
      sortBy: "dateStart",
      sortDirection: "asc",
      page: 2,
      perPage: 20,
      statuses: ["PARTIALLY_SIGNED"],
      dateStartFrom: "2024-01-01",
    };

    store.dispatch(
      conventionListSlice.actions.fetchConventionListRequested({
        jwt,
        filters: customFilters,
        feedbackTopic: "connected-user-conventionList",
      }),
    );

    feedGatewayWithConventionListOrError(conventionsWithPagination);

    expectConventionListSelector({
      ...defaultConventionListState,
      conventionsWithPagination: {
        ...conventionsWithPagination,
        filters: customFilters,
      },
    });

    store.dispatch(conventionListSlice.actions.clearConventionListFilters());

    expectConventionListSelector(defaultConventionListState);
  });

  const feedGatewayWithConventionListOrError = (
    conventionListOrError?: DataWithPagination<ConventionReadDto> | Error,
  ) => {
    if (conventionListOrError instanceof Error) {
      dependencies.conventionGateway.getConventionsForUserResult$.error(
        conventionListOrError,
      );
    } else if (conventionListOrError) {
      dependencies.conventionGateway.getConventionsForUserResult$.next(
        conventionListOrError,
      );
    }
  };

  const expectConventionListSelector = ({
    isLoading,
    conventionsWithPagination,
  }: ConventionListState) => {
    expectToEqual(
      conventionListSelectors.isLoading(store.getState()),
      isLoading,
    );
    expectToEqual(
      conventionListSelectors.conventionsWithPagination(store.getState()),
      conventionsWithPagination,
    );
  };
});
