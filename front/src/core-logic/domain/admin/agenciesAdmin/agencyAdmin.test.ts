import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyOption,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import {
  type AgencyAdminState,
  agencyAdminInitialState,
  agencyAdminSlice,
} from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { fetchAgencySelectors } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.selectors";
import {
  fetchAgencyInitialState,
  fetchAgencySlice,
} from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("agencyAdmin", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Agency update", () => {
    describe("Agency autocomplete", () => {
      it("shows when search is onGoing", () => {
        const searchedText = "agen";
        store.dispatch(
          agencyAdminSlice.actions.setAgencySearchQuery(searchedText),
        );
        expectAgencyAdminStateToMatch({
          isLoading: true,
          agencySearchQuery: searchedText,
        });
      });

      it("does not trigger call api before debounce time is reached, then triggers search and gets results", () => {
        const searchedText = "agen";
        whenSearchTextIsProvided(searchedText);
        expectIsLoadingToBe(true);
        fastForwardObservables();
        expectIsLoadingToBe(true);
        const agencies: AgencyOption[] = [
          {
            id: "my-id",
            name: "My agency",
            kind: "cap-emploi",
            status: "active",
            address: {
              streetNumberAndAddress: "",
              postcode: "75002",
              departmentCode: "75",
              city: "Paris",
            },
            refersToAgencyName: null,
          },
        ];
        feedWithAgencyOptions(agencies);
        expectAgencyAdminStateToMatch({
          agencySearchQuery: searchedText,
          isLoading: false,
          agencyOptions: agencies,
        });
      });

      it("selects one of the results and fetches the corresponding Agency", () => {
        const agencySearchText = "My ";
        const agencyDto = new AgencyDtoBuilder().build();

        const agencyOptions: AgencyOption[] = [
          {
            id: agencyDto.id,
            name: agencyDto.name,
            kind: "pole-emploi",
            status: "active",
            address: {
              streetNumberAndAddress: "",
              postcode: "75002",
              departmentCode: "75",
              city: "Paris",
            },
            refersToAgencyName: null,
          },
          {
            id: "456",
            name: "My other agency",
            kind: "cci",
            status: "active",
            address: {
              streetNumberAndAddress: "",
              postcode: "75002",
              departmentCode: "75",
              city: "Paris",
            },
            refersToAgencyName: null,
          },
        ];

        ({ store, dependencies } = createTestStore({
          admin: adminPreloadedState({
            agencyAdmin: {
              ...agencyAdminInitialState,
              agencyOptions,
              agencySearchQuery: agencySearchText,
            },
          }),
        }));

        store.dispatch(
          fetchAgencySlice.actions.fetchAgencyRequested({
            agencyId: agencyDto.id,
            feedbackTopic: "agency-admin",
          }),
        );

        feedWithFetchedAgency(agencyDto);

        expectAgencyAdminStateToMatch({
          isLoading: false,
          agencyOptions,
          agencySearchQuery: agencySearchText,
        });
        expectToEqual(fetchAgencySelectors.agency(store.getState()), agencyDto);
      });
    });

    it("clears agency on agency selection", () => {
      const agencyDto1 = new AgencyDtoBuilder().withId("1").build();

      const agencyOptions: AgencyOption[] = [
        {
          id: agencyDto1.id,
          name: agencyDto1.name,
          kind: "autre",
          status: "active",
          address: {
            streetNumberAndAddress: "",
            postcode: "75002",
            departmentCode: "75",
            city: "Paris",
          },
          refersToAgencyName: null,
        },
      ];
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            agencyOptions,
          },
        }),
        agency: agenciesPreloadedState({
          fetchAgency: {
            ...fetchAgencyInitialState,
            agency: agencyDto1,
          },
        }),
      }));
      store.dispatch(
        fetchAgencySlice.actions.fetchAgencyRequested({
          agencyId: "anything",
          feedbackTopic: "agency-admin",
        }),
      );
      expectAgencyAdminStateToMatch({ agencyOptions });
      expectToEqual(fetchAgencySelectors.agency(store.getState()), null);
    });
  });

  const expectAgencyAdminStateToMatch = (params: Partial<AgencyAdminState>) => {
    expectToEqual(agencyAdminSelectors.agencyState(store.getState()), {
      ...agencyAdminInitialState,
      ...params,
    });
  };

  const expectIsLoadingToBe = (isLoading: boolean) =>
    expect(agencyAdminSelectors.agencyState(store.getState()).isLoading).toBe(
      isLoading,
    );

  const fastForwardObservables = () => dependencies.scheduler.flush();

  const feedWithAgencyOptions = (agencyOptions: AgencyOption[]) => {
    dependencies.agencyGateway.agencyOptions$.next(agencyOptions);
  };

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgency$.next(agencyDto);
  };

  const whenSearchTextIsProvided = (searchedText: string) => {
    store.dispatch(agencyAdminSlice.actions.setAgencySearchQuery(searchedText));
  };
});
