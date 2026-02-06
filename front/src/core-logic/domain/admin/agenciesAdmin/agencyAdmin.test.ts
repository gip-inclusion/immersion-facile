import {
  type AddressDto,
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyOption,
  type AgencyRight,
  type ConnectedUser,
  ConnectedUserBuilder,
  defaultCountryCode,
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
import { updateAgencySelectors } from "src/core-logic/domain/agencies/update-agency/updateAgency.selectors";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { makeGeocodingLocatorSelector } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AGENCY_NEEDING_REVIEW_2,
  PE_AGENCY_ACTIVE,
} from "../../../adapters/AgencyGateway/SimulatedAgencyGateway";
import { connectedUsersAdminSelectors } from "../connectedUsersAdmin/connectedUsersAdmin.selectors";

describe("agencyAdmin", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Agency activate or reject", () => {
    describe("fetch agencies needing review", () => {
      it("display the agency to activate or reject on selection", () => {
        store.dispatch(
          agencyAdminSlice.actions.fetchAgencyNeedingReviewRequested(
            AGENCY_NEEDING_REVIEW_2.id,
          ),
        );

        feedWithFetchedAgency(AGENCY_NEEDING_REVIEW_2);

        expectAgencyAdminStateToMatch({
          agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
        });
      });

      describe("Needing review related", () => {
        const preloadedAgencyAdminState: AgencyAdminState = {
          ...agencyAdminInitialState,
          agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
        };

        beforeEach(() => {
          ({ store, dependencies } = createTestStore({
            admin: adminPreloadedState({
              agencyAdmin: { ...preloadedAgencyAdminState },
            }),
          }));
        });

        it("shows when status update is ongoing", () => {
          store.dispatch(
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
              id: AGENCY_NEEDING_REVIEW_2.id,
              status: "active",
            }),
          );
          const expectedAgencyAdminState: AgencyAdminState = {
            ...preloadedAgencyAdminState,
            isLoading: true,
          };
          expectAgencyAdminStateToMatch(expectedAgencyAdminState);
        });

        it("sets isUpdatingNeedingReviewStatus false and feedback on status update success", () => {
          store.dispatch(
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
              id: AGENCY_NEEDING_REVIEW_2.id,
              status: "active",
            }),
          );
          store.dispatch(
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusSucceeded(
              AGENCY_NEEDING_REVIEW_2.id,
            ),
          );
          expectAgencyAdminStateToMatch({
            ...preloadedAgencyAdminState,
            isLoading: false,
            feedback: { kind: "agencyUpdated" },
          });
        });

        it("editing an agency which is not needing review, should not impact the one needing review", () => {
          store.dispatch(
            updateAgencySlice.actions.updateAgencySucceeded({
              ...PE_AGENCY_ACTIVE,
              feedbackTopic: "agency-admin",
            }),
          );

          expectAgencyAdminStateToMatch({
            agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
          });
        });
      });
    });
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

    const agencyDto = new AgencyDtoBuilder().build();

    it("shows when update is ongoing", () => {
      store.dispatch(
        updateAgencySlice.actions.updateAgencyRequested({
          ...agencyDto,
          feedbackTopic: "agency-admin",
        }),
      );
      expect(updateAgencySelectors.isLoading(store.getState())).toBe(true);
    });

    it("triggers update when updateAgencyRequested is dispatched with agency-admin topic", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            feedback: { kind: "errored", errorMessage: "something wrong" },
          },
        }),
      }));
      store.dispatch(
        updateAgencySlice.actions.updateAgencyRequested({
          ...agencyDto,
          feedbackTopic: "agency-admin",
        }),
      );
      expect(updateAgencySelectors.isLoading(store.getState())).toBe(true);
    });

    it("send request to update agency and shows feedback, and refetch agency users", () => {
      const updatedAgency: AgencyDto = {
        ...agencyDto,
        validatorEmails: ["a@b.com", "c@d.com"],
      };
      store.dispatch(
        updateAgencySlice.actions.updateAgencyRequested({
          ...updatedAgency,
          feedbackTopic: "agency-admin",
        }),
      );

      feedWithUpdateResponse();
      const user = new ConnectedUserBuilder().build();
      feedWithIcUsers([user]);
      expectToEqual(
        connectedUsersAdminSelectors.agencyUsers(store.getState()),
        {
          [user.id]: {
            ...user,
            agencyRights: user.agencyRights.reduce(
              (acc, agencyRight) => ({
                ...acc,
                [agencyRight.agency.id]: agencyRight,
              }),
              {} as Record<AgencyId, AgencyRight>,
            ),
          },
        },
      );
    });

    it("when something goes wrong, update epic dispatches updateAgencyFailed", () => {
      store.dispatch(
        updateAgencySlice.actions.updateAgencyRequested({
          ...agencyDto,
          feedbackTopic: "agency-admin",
        }),
      );
      feedWithUpdateError("Something went wrong !");
      expect(updateAgencySelectors.isLoading(store.getState())).toBe(false);
    });

    it("clears feedback and agency on agency selection", () => {
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
        ...{
          admin: adminPreloadedState({
            agencyAdmin: {
              ...agencyAdminInitialState,
              feedback: { kind: "agencyUpdated" },
              agencyOptions,
            },
          }),
        },
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
      expectAgencyAdminStateToMatch({
        agencyOptions,
        feedback: { kind: "agencyUpdated" },
      });
      expectToEqual(fetchAgencySelectors.agency(store.getState()), null);
    });
  });

  it("clear agency", () => {
    const agencyDto = new AgencyDtoBuilder().withId("1").build();
    const agencyNeedingReviewDto = new AgencyDtoBuilder().withId("2").build();

    ({ store, dependencies } = createTestStore({
      ...{
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            agencyNeedingReview: agencyNeedingReviewDto,
          },
        }),
        agency: agenciesPreloadedState({
          fetchAgency: {
            ...fetchAgencyInitialState,
            agency: agencyDto,
          },
        }),
      },
    }));
    store.dispatch(agencyAdminSlice.actions.clearAgencyNeedingReview());
    expectAgencyAdminStateToMatch({
      agencyNeedingReview: null,
    });
  });

  it("populates address when agency is selected", () => {
    const address: AddressDto = {
      streetNumberAndAddress: "1 rue de la paix",
      postcode: "75016",
      departmentCode: "75",
      city: "Paris",
    };
    const agencyDto = new AgencyDtoBuilder().withAddress(address).build();

    store.dispatch(
      fetchAgencySlice.actions.fetchAgencyRequested({
        agencyId: agencyDto.id,
        feedbackTopic: "agency-admin",
      }),
    );
    feedWithFetchedAgency(agencyDto);
    expectToEqual(fetchAgencySelectors.agency(store.getState()), agencyDto);
    expectToEqual(
      makeGeocodingLocatorSelector("agency-address")(store.getState())?.value,
      {
        address: {
          ...address,
          countryCode: defaultCountryCode,
        },
        position: {
          lat: 48.866667,
          lon: 2.333333,
        },
      },
    );
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

  const feedWithUpdateResponse = () => {
    dependencies.agencyGateway.updateAgencyResponse$.next(undefined);
  };

  const feedWithUpdateError = (msg: string) => {
    dependencies.agencyGateway.updateAgencyResponse$.error(new Error(msg));
  };

  const feedWithIcUsers = (icUsers: ConnectedUser[]) => {
    dependencies.authGateway.getConnectedUsersResponse$.next(icUsers);
  };

  const whenSearchTextIsProvided = (searchedText: string) => {
    store.dispatch(agencyAdminSlice.actions.setAgencySearchQuery(searchedText));
  };
});
