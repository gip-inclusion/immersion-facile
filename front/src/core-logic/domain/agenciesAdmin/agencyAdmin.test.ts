import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyOption,
  expectObjectsToMatch,
} from "shared";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import {
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
        agencyAdmin: {
          agencyOptions,
          agencySearchText: "My ",
          agency: null,
          selectedAgencyId: null,
          isSearching: false,
          error: null,
        },
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
});
