import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyOption,
  expectObjectsToMatch,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import {
  agencyAdminInitialState,
  agencyAdminSlice,
  AgencyAdminState,
} from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("agencyAdmin", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Agency autocomplete", () => {
    it("shows when search is onGoing", () => {
      const searchedText = "agen";
      store.dispatch(
        agencyAdminSlice.actions.setAgencySearchText(searchedText),
      );
      expectAgencyAdminStateToMatch({
        isSearching: true,
        agencySearchText: searchedText,
      });
    });

    it("returns searched results", () => {
      const searchedText = "agen";
      store.dispatch(
        agencyAdminSlice.actions.setAgencySearchText(searchedText),
      );
      const agencies: AgencyOption[] = [
        {
          id: "123",
          name: "My agency",
        },
      ];
      feedWithAgencyOptions(agencies);

      expectAgencyAdminStateToMatch({
        isSearching: false,
        agencyOptions: agencies,
      });
    });

    it("selects one of the results and fetches the corresponding Agency", () => {
      const agencyDto = new AgencyDtoBuilder().build();
      const agencyOptions: AgencyOption[] = [
        { id: agencyDto.id, name: agencyDto.name },
        { id: "456", name: "My other agency" },
      ];

      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            agencyOptions,
            agencySearchText: "My ",
            agency: null,
            selectedAgencyId: null,
            isSearching: false,
            isUpdating: false,
            feedback: { kind: "idle" },
            error: null,
          },
        }),
      }));

      store.dispatch(
        agencyAdminSlice.actions.setSelectedAgencyId(agencyDto.id),
      );

      expectAgencyAdminStateToMatch({
        selectedAgencyId: agencyDto.id,
      });
      feedWithFetchedAgency(agencyDto);

      expectAgencyAdminStateToMatch({
        isSearching: false,
        agency: agencyDto,
      });
    });
  });

  it("clears feedback and agency on agency selection", () => {
    const agencyDto1 = new AgencyDtoBuilder().withId("1").build();
    const agencyOptions: AgencyOption[] = [
      { id: agencyDto1.id, name: agencyDto1.name },
    ];
    ({ store, dependencies } = createTestStore({
      admin: adminPreloadedState({
        agencyAdmin: {
          ...agencyAdminInitialState,
          feedback: { kind: "agencyUpdated" },
          agencyOptions,
          selectedAgencyId: "456",
          agency: agencyDto1,
        },
      }),
    }));
    store.dispatch(agencyAdminSlice.actions.setSelectedAgencyId("anything"));
    expectAgencyAdminStateToMatch({
      feedback: { kind: "idle" },
      agency: null,
    });
  });

  describe("Agency update", () => {
    const agencyDto = new AgencyDtoBuilder().build();

    it("shows when update is ongoing", () => {
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));
      expectAgencyAdminStateToMatch({
        isUpdating: true,
      });
    });

    it("reset feedback to idle when updating an agency", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            feedback: { kind: "errored", errorMessage: "something wrong" },
          },
        }),
      }));
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));
      expectAgencyAdminStateToMatch({
        isUpdating: true,
        feedback: { kind: "idle" },
      });
    });

    it("send request to update agency and shows feedback", () => {
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));

      feedWithUpdateResponse();
      expectAgencyAdminStateToMatch({
        isUpdating: false,
        feedback: { kind: "agencyUpdated" },
      });
    });

    it("when something goes wrong, showes error", () => {
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));
      feedWithUpdateError("Something went wrong !");
      expectAgencyAdminStateToMatch({
        isUpdating: false,
        feedback: { kind: "errored", errorMessage: "Something went wrong !" },
      });
    });
  });

  const expectAgencyAdminStateToMatch = (params: Partial<AgencyAdminState>) => {
    expectObjectsToMatch(
      agencyAdminSelectors.agencyState(store.getState()),
      params,
    );
  };

  const feedWithAgencyOptions = (agencyOptions: AgencyOption[]) => {
    dependencies.agencyGateway.agencies$.next(agencyOptions);
  };

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgency$.next(agencyDto);
  };

  const feedWithUpdateResponse = () => {
    dependencies.agencyGateway.updateAgencyResponse$.next(undefined);
  };

  const feedWithUpdateError = (msg: string) => {
    dependencies.agencyGateway.updateAgencyResponse$.error(new Error(msg));
  };
});
