import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyOption,
  type AgencyRight,
  type ConnectedUser,
  ConnectedUserBuilder,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import {
  type AgencyAdminState,
  type AgencyAdminSubmitFeedback,
  agencyAdminInitialState,
  agencyAdminSlice,
} from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { makeGeocodingLocatorSelector } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AGENCY_NEEDING_REVIEW_1,
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
      it("triggers fetch of agencies needing review, shows it is fetching", () => {
        store.dispatch(
          agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested(),
        );

        expectAgencyAdminStateToMatch({
          isFetchingAgenciesNeedingReview: true,
          agencyOptions: [],
        });
      });

      it("after fetch agencies options are fetched", () => {
        const expectedAgencies: AgencyOption[] = [
          {
            id: "my-id",
            name: "My expected agency",
            kind: "mission-locale",
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

        store.dispatch(
          agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested(),
        );
        feedWithAgencyOptions(expectedAgencies);
        expectAgencyAdminStateToMatch({
          isFetchingAgenciesNeedingReview: false,
          agencyNeedingReviewOptions: expectedAgencies,
        });
      });

      it("display feedback error on fetch failure", () => {
        const expectedFeedback: AgencyAdminSubmitFeedback = {
          kind: "errored",
          errorMessage: "Ceci est mon erreur",
        };

        store.dispatch(
          agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested(),
        );

        feedAgencyOptionsWithError(new Error(expectedFeedback.errorMessage));

        expectAgencyAdminStateToMatch({
          feedback: expectedFeedback,
          isFetchingAgenciesNeedingReview: false,
          agencyNeedingReviewOptions: [],
        });
      });

      it("display the agency to activate or reject on selection", () => {
        store.dispatch(
          agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId(
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
          agencyNeedingReviewOptions: [
            {
              id: AGENCY_NEEDING_REVIEW_1.id,
              name: AGENCY_NEEDING_REVIEW_1.name,
              kind: AGENCY_NEEDING_REVIEW_1.kind,
              status: AGENCY_NEEDING_REVIEW_1.status,
              address: AGENCY_NEEDING_REVIEW_1.address,
              refersToAgencyName: AGENCY_NEEDING_REVIEW_1.refersToAgencyName,
            },
            {
              id: AGENCY_NEEDING_REVIEW_2.id,
              name: AGENCY_NEEDING_REVIEW_2.name,
              kind: AGENCY_NEEDING_REVIEW_2.kind,
              status: AGENCY_NEEDING_REVIEW_2.status,
              address: AGENCY_NEEDING_REVIEW_2.address,
              refersToAgencyName: AGENCY_NEEDING_REVIEW_2.refersToAgencyName,
            },
          ],
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
              id: preloadedAgencyAdminState.agencyNeedingReviewOptions[0].id,
              status: "active",
            }),
          );
          const expectedAgencyAdminState: AgencyAdminState = {
            ...preloadedAgencyAdminState,
            isUpdating: true,
          };
          expectAgencyAdminStateToMatch(expectedAgencyAdminState);
        });

        it("remove from agencyNeedingReviewOptions on update success and remove displayed agency", () => {
          store.dispatch(
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusSucceeded(
              AGENCY_NEEDING_REVIEW_2.id,
            ),
          );

          expectAgencyAdminStateToMatch({
            agencyNeedingReviewOptions: [
              {
                id: AGENCY_NEEDING_REVIEW_1.id,
                name: AGENCY_NEEDING_REVIEW_1.name,
                kind: AGENCY_NEEDING_REVIEW_1.kind,
                status: AGENCY_NEEDING_REVIEW_1.status,
                address: AGENCY_NEEDING_REVIEW_1.address,
                refersToAgencyName: AGENCY_NEEDING_REVIEW_1.refersToAgencyName,
              },
            ],
            agencyNeedingReview: null,
            feedback: { kind: "agencyUpdated" },
          });
        });

        it("editing an agency which is not needing review, should not impact the one needing review", () => {
          store.dispatch(
            agencyAdminSlice.actions.updateAgencySucceeded(PE_AGENCY_ACTIVE),
          );

          expectAgencyAdminStateToMatch({
            agencyNeedingReviewOptions: [
              {
                id: AGENCY_NEEDING_REVIEW_1.id,
                name: AGENCY_NEEDING_REVIEW_1.name,
                kind: AGENCY_NEEDING_REVIEW_1.kind,
                status: AGENCY_NEEDING_REVIEW_1.status,
                address: AGENCY_NEEDING_REVIEW_1.address,
                refersToAgencyName: AGENCY_NEEDING_REVIEW_1.refersToAgencyName,
              },
              {
                id: AGENCY_NEEDING_REVIEW_2.id,
                name: AGENCY_NEEDING_REVIEW_2.name,
                kind: AGENCY_NEEDING_REVIEW_2.kind,
                status: AGENCY_NEEDING_REVIEW_2.status,
                address: AGENCY_NEEDING_REVIEW_2.address,
                refersToAgencyName: AGENCY_NEEDING_REVIEW_2.refersToAgencyName,
              },
            ],
            agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
            feedback: { kind: "agencyUpdated" },
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
          isSearching: true,
          agencySearchQuery: searchedText,
        });
      });

      it("does not trigger call api before debounce time is reached, then triggers search and gets results", () => {
        const searchedText = "agen";
        whenSearchTextIsProvided(searchedText);
        expectIsSearchingToBe(true);
        fastForwardObservables();
        expectIsSearchingToBe(true);
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
          isSearching: false,
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
          agencyAdminSlice.actions.setSelectedAgencyId(agencyDto.id),
        );

        feedWithFetchedAgency(agencyDto);

        expectAgencyAdminStateToMatch({
          isSearching: false,
          agency: agencyDto,
          agencyOptions,
          agencySearchQuery: agencySearchText,
        });
      });
    });

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

    it("send request to update agency and shows feedback, and refetch agency users", () => {
      const updatedAgency: AgencyDto = {
        ...agencyDto,
        validatorEmails: ["a@b.com", "c@d.com"],
      };
      store.dispatch(
        agencyAdminSlice.actions.updateAgencyRequested(updatedAgency),
      );

      feedWithUpdateResponse();
      expectAgencyAdminStateToMatch({
        isUpdating: false,
        feedback: { kind: "agencyUpdated" },
      });
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

    it("when something goes wrong, shows error", () => {
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));
      feedWithUpdateError("Something went wrong !");
      expectAgencyAdminStateToMatch({
        isUpdating: false,
        feedback: { kind: "errored", errorMessage: "Something went wrong !" },
      });
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
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            feedback: { kind: "agencyUpdated" },
            agencyOptions,
            agency: agencyDto1,
          },
        }),
      }));
      store.dispatch(agencyAdminSlice.actions.setSelectedAgencyId("anything"));
      expectAgencyAdminStateToMatch({
        feedback: { kind: "idle" },
        agency: null,
        agencyOptions,
      });
    });
  });

  it("clear agency", () => {
    const agencyDto = new AgencyDtoBuilder().withId("1").build();
    const agencyNeedingReviewDto = new AgencyDtoBuilder().withId("2").build();

    ({ store, dependencies } = createTestStore({
      admin: adminPreloadedState({
        agencyAdmin: {
          ...agencyAdminInitialState,
          agency: agencyDto,
          agencyNeedingReview: agencyNeedingReviewDto,
        },
      }),
    }));
    store.dispatch(agencyAdminSlice.actions.clearAgencyRequested());
    expectAgencyAdminStateToMatch({
      agency: null,
      agencyNeedingReview: null,
    });
  });

  it("populates address when agency is selected", () => {
    const agencyDto = new AgencyDtoBuilder()
      .withAddress({
        streetNumberAndAddress: "123 Main St",
        postcode: "12345",
        departmentCode: "CA",
        city: "Los Angeles",
      })
      .build();

    store.dispatch(agencyAdminSlice.actions.setAgency(agencyDto));
    expectAgencyAdminStateToMatch({
      agency: agencyDto,
    });
    expectToEqual(
      makeGeocodingLocatorSelector("agency-address")(store.getState())?.value,
      {
        address: {
          streetNumberAndAddress: "123 Main St",
          postcode: "12345",
          departmentCode: "CA",
          city: "Los Angeles",
          countryCode: "US",
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

  const expectIsSearchingToBe = (isSearching: boolean) =>
    expect(agencyAdminSelectors.agencyState(store.getState()).isSearching).toBe(
      isSearching,
    );

  const fastForwardObservables = () => dependencies.scheduler.flush();

  const feedWithAgencyOptions = (agencyOptions: AgencyOption[]) => {
    dependencies.agencyGateway.agencyOptions$.next(agencyOptions);
  };

  const feedAgencyOptionsWithError = (error: Error) => {
    dependencies.agencyGateway.agencyOptions$.error(error);
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
    dependencies.adminGateway.getAgencyUsersToReviewResponse$.next(icUsers);
  };

  const whenSearchTextIsProvided = (searchedText: string) => {
    store.dispatch(agencyAdminSlice.actions.setAgencySearchQuery(searchedText));
  };
});
