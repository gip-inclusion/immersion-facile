import { values } from "ramda";
import { AgencyDto, AgencyDtoBuilder, expectToEqual } from "shared";
import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

import { agencyDashboardSelectors } from "src/core-logic/domain/dashboards/agencyDashboard/agencyDashboard.selectors";

import {
  AgencyDashboardState,
  agencyDashboardInitialState,
  agencyDashboardSlice,
} from "src/core-logic/domain/dashboards/agencyDashboard/agencyDashboard.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const agencyDto = new AgencyDtoBuilder().build();

const fakeAgencyUsers: NormalizedIcUserById = {
  "fake-user-id-1": {
    id: "fake-user-id-1",
    email: "jbon8745@wanadoo.fr",
    firstName: "Jean",
    lastName: "Bon",
    agencyRights: {
      [agencyDto.id]: {
        agency: agencyDto,
        isNotifiedByEmail: true,
        roles: ["agency-admin"],
      },
    },
    dashboards: { agencies: {}, establishments: {} },
    externalId: "fake-user-external-id-1",
    createdAt: new Date().toISOString(),
  },
  "user-in-error": {
    id: "user-in-error",
    email: "fake-user-email-4@test.fr",
    firstName: "Jean-Michel",
    lastName: "Jeplante",
    agencyRights: {
      [agencyDto.id]: {
        agency: agencyDto,
        isNotifiedByEmail: true,
        roles: ["agency-admin"],
      },
    },
    dashboards: { agencies: {}, establishments: {} },
    externalId: "fake-user-in-error-external-id",
    createdAt: new Date().toISOString(),
  },
};

describe("agencyDashboard", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      dashboards: { agencyDashboard: agencyDashboardInitialState },
    }));
  });

  describe("Fetch agency", () => {
    it("Fetch agency by id", () => {
      expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
      );

      feedWithFetchedAgency(agencyDto);

      expectAgencyDashboardStateToMatch({
        isFetchingAgency: false,
        feedback: { kind: "agencyFetchSuccess" },
        agency: agencyDto,
      });
    });

    it("Failed when no agency fetched", () => {
      expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
      );

      dependencies.agencyGateway.fetchedAgencyForDashboard$.error(
        new Error("some-error"),
      );

      expectAgencyDashboardStateToMatch({
        isFetchingAgency: false,
        feedback: { kind: "errored", errorMessage: "some-error" },
        agency: null,
      });
    });
  });

  describe("Fetch agency users", () => {
    it("Fetch agency users by agency id", () => {
      expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
      );

      feedWithFetchedAgencyUsers(fakeAgencyUsers);

      expectAgencyDashboardStateToMatch({
        isFetchingAgencyUsers: false,
        feedback: { kind: "agencyUsersFetchSuccess" },
        agencyUsers: fakeAgencyUsers,
      });
    });

    it("Failed when no agency users fetched", () => {
      expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
      );

      dependencies.agencyGateway.fetchedAgencyUsers$.error(
        new Error("some-error"),
      );

      expectAgencyDashboardStateToMatch({
        isFetchingAgencyUsers: false,
        feedback: { kind: "errored", errorMessage: "some-error" },
        agencyUsers: {},
      });
    });
  });

  describe("clearAgencyAndUsers", () => {
    it("Clear agency and users", () => {
      expectAgencyDashboardStateToMatch(agencyDashboardInitialState);

      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyRequested(agencyDto.id),
      );
      store.dispatch(
        agencyDashboardSlice.actions.fetchAgencyUsersRequested(agencyDto.id),
      );

      feedWithFetchedAgencyUsers(fakeAgencyUsers);
      feedWithFetchedAgency(agencyDto);

      expectAgencyDashboardStateToMatch({
        agency: agencyDto,
        agencyUsers: fakeAgencyUsers,
        feedback: { kind: "agencyFetchSuccess" },
      });

      store.dispatch(agencyDashboardSlice.actions.clearAgencyAndUsers());

      expectAgencyDashboardStateToMatch({
        agency: null,
        agencyUsers: {},
        feedback: { kind: "idle" },
      });
    });
  });

  const expectAgencyDashboardStateToMatch = (
    params: Partial<AgencyDashboardState>,
  ) => {
    expectToEqual(
      agencyDashboardSelectors.agencyDashboardState(store.getState()),
      {
        ...agencyDashboardInitialState,
        ...params,
      },
    );
  };

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgencyForDashboard$.next(agencyDto);
  };
  const feedWithFetchedAgencyUsers = (agencyUsers: NormalizedIcUserById) => {
    dependencies.agencyGateway.fetchedAgencyUsers$.next(
      values(agencyUsers).map((agencyUser) => ({
        ...agencyUser,
        agencyRights: values(agencyUser.agencyRights),
      })),
    );
  };
});
