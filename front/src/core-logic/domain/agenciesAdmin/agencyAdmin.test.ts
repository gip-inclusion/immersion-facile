import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyOption,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import {
  agencyAdminInitialState,
  agencyAdminSlice,
  AgencyAdminState,
  AgencySubmitFeedback,
} from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AGENCY_NEEDING_REVIEW_1,
  AGENCY_NEEDING_REVIEW_2,
  PE_AGENCY_ACTIVE,
} from "../../adapters/AgencyGateway/InMemoryAgencyGateway";

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
          { id: "my-id", name: "My expected agency" },
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
        const expectedFeedback: AgencySubmitFeedback = {
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
          agencyOptions: [],
          agencyNeedingReviewOptions: [
            {
              id: AGENCY_NEEDING_REVIEW_1.id,
              name: AGENCY_NEEDING_REVIEW_1.name,
            },
            {
              id: AGENCY_NEEDING_REVIEW_2.id,
              name: AGENCY_NEEDING_REVIEW_2.name,
            },
          ],
          agencySearchText: "",
          agency: null,
          agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
          isSearching: false,
          isFetchingAgenciesNeedingReview: false,
          isUpdating: false,
          feedback: { kind: "idle" },
          error: null,
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
            agencyAdminSlice.actions.updateAgencyNeedingReviewStatusSucceded(
              AGENCY_NEEDING_REVIEW_2.id,
            ),
          );

          expectAgencyAdminStateToMatch({
            agencyNeedingReviewOptions: [
              {
                id: AGENCY_NEEDING_REVIEW_1.id,
                name: AGENCY_NEEDING_REVIEW_1.name,
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
              },
              {
                id: AGENCY_NEEDING_REVIEW_2.id,
                name: AGENCY_NEEDING_REVIEW_2.name,
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
          agencyAdminSlice.actions.setAgencySearchText(searchedText),
        );
        expectAgencyAdminStateToMatch({
          isSearching: true,
          agencySearchText: searchedText,
        });
      });

      it("does not trigger call api before debounce time is reached, then triggers search and gets results", () => {
        const searchedText = "agen";
        whenSearchTextIsProvided(searchedText);
        expectIsSearchingToBe(true);
        fastForwardObservables();
        expectIsSearchingToBe(true);
        const agencies: AgencyOption[] = [{ id: "my-id", name: "My agency" }];
        feedWithAgencyOptions(agencies);
        expectAgencyAdminStateToMatch({
          agencySearchText: searchedText,
          isSearching: false,
          agencyOptions: agencies,
        });
      });

      it("selects one of the results and fetches the corresponding Agency", () => {
        const agencySearchText = "My ";
        const agencyDto = new AgencyDtoBuilder().build();
        const agencyOptions: AgencyOption[] = [
          { id: agencyDto.id, name: agencyDto.name },
          { id: "456", name: "My other agency" },
        ];

        ({ store, dependencies } = createTestStore({
          admin: adminPreloadedState({
            agencyAdmin: {
              agencyOptions,
              agencyNeedingReviewOptions: [],
              agencySearchText,
              agency: null,
              agencyNeedingReview: null,
              isSearching: false,
              isFetchingAgenciesNeedingReview: false,
              isUpdating: false,
              feedback: { kind: "idle" },
              error: null,
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
          agencySearchText,
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

    it("send request to update agency and shows feedback", () => {
      store.dispatch(agencyAdminSlice.actions.updateAgencyRequested(agencyDto));

      feedWithUpdateResponse();
      expectAgencyAdminStateToMatch({
        isUpdating: false,
        feedback: { kind: "agencyUpdated" },
      });
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
        { id: agencyDto1.id, name: agencyDto1.name },
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
    dependencies.agencyGateway.agencies$.next(agencyOptions);
  };

  const feedAgencyOptionsWithError = (error: Error) => {
    dependencies.agencyGateway.agencies$.error(error);
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

  const whenSearchTextIsProvided = (searchedText: string) => {
    store.dispatch(agencyAdminSlice.actions.setAgencySearchText(searchedText));
  };
});
