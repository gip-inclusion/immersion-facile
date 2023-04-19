import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyOption,
  AuthenticatedUser,
  expectToEqual,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import {
  agencyAdminInitialState,
  agencyAdminSlice,
  AgencyAdminState,
  AgencySubmitFeedback,
  RegisterAgencyWithRoleToUserPayload,
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

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
const agency3 = new AgencyDtoBuilder().withId("agency-3").build();
const agency4 = new AgencyDtoBuilder().withId("agency-4").build();
const testAgencySet = [agency1, agency2, agency3, agency4];

const testUserSet: AuthenticatedUser[] = [
  {
    id: "user-id",
    email: "user-email",
    firstName: "user-first-name",
    lastName: "user-last-name",
  },
  {
    id: "user-id-2",
    email: "user-email-2",
    firstName: "user-first-name-2",
    lastName: "user-last-name-2",
  },
];

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
          agenciesNeedingReviewForUser: [],
          isFetchingAgenciesNeedingReviewForUser: false,
          usersNeedingReview: [],
          isUpdatingUserAgencies: false,
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
              usersNeedingReview: [],
              isSearching: false,
              isFetchingAgenciesNeedingReview: false,
              isUpdating: false,
              agenciesNeedingReviewForUser: [],
              isFetchingAgenciesNeedingReviewForUser: false,
              isUpdatingUserAgencies: false,
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
  describe("Agency registration for authenticated users", () => {
    it("request agencies'users to review for registration and role", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchAgencyUsersToReviewRequested(),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);
      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next(
        testUserSet,
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expect(store.getState().admin.agencyAdmin.usersNeedingReview).toEqual(
        testUserSet,
      );
      expectFeedbackToEqual({ kind: "usersToReviewFetchSuccess" });
    });

    it("request agencies'users to review for registration and role to throw on error", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchAgencyUsersToReviewRequested(),
      );
      const errorMessage = "Error fetching users to review";
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);
      dependencies.adminGateway.getAgencyUsersToReviewResponse$.error(
        new Error(errorMessage),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });
    it("request agencies to review for given authenticated user", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchAgenciesToReviewForUserRequested(
          "user-id",
        ),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);
      dependencies.adminGateway.getAgenciesToReviewForUserResponse$.next(
        testAgencySet,
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expect(
        store.getState().admin.agencyAdmin.agenciesNeedingReviewForUser,
      ).toEqual(testAgencySet);
      expectFeedbackToEqual({ kind: "agenciesToReviewForUserFetchSuccess" });
    });

    it("request agencies to review for given authenticated to throw on error", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchAgenciesToReviewForUserRequested(
          "user-id",
        ),
      );
      const errorMessage = "Error fetching user agencies to review";
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);
      dependencies.adminGateway.getAgenciesToReviewForUserResponse$.error(
        new Error(errorMessage),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });

    it("request agency to be registered to an user with a role", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            agenciesNeedingReviewForUser: testAgencySet,
          },
        }),
      }));
      const payload: RegisterAgencyWithRoleToUserPayload = {
        agencyId: "agency-3",
        userId: "user-id",
        role: "validator",
      };
      const expectedAgencies = testAgencySet.filter(
        (agency) => agency.id !== payload.agencyId,
      );

      expect(
        store.getState().admin.agencyAdmin.agenciesNeedingReviewForUser,
      ).toEqual(testAgencySet);
      store.dispatch(
        agencyAdminSlice.actions.registerAgencyWithRoleToUserRequested(payload),
      );
      expectIsUpdatingUserAgenciesToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.next(
        undefined,
      );
      expectIsUpdatingUserAgenciesToBe(false);
      expect(
        store.getState().admin.agencyAdmin.agenciesNeedingReviewForUser,
      ).toEqual(expectedAgencies);
      expectFeedbackToEqual({ kind: "agencyRegisterToUserSuccess" });
    });

    it("request agency to be registered to an user with a role should throw on an error", () => {
      const payload: RegisterAgencyWithRoleToUserPayload = {
        agencyId: "agency-3",
        userId: "user-id",
        role: "validator",
      };
      const errorMessage = `Error registering user ${payload.userId} to agency ${payload.agencyId} with role ${payload.role}`;

      store.dispatch(
        agencyAdminSlice.actions.registerAgencyWithRoleToUserRequested(payload),
      );
      expectIsUpdatingUserAgenciesToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.error(
        new Error(errorMessage),
      );
      expectIsUpdatingUserAgenciesToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });
  });
  const expectIsUpdatingUserAgenciesToBe = (expected: boolean) => {
    expect(store.getState().admin.agencyAdmin.isUpdatingUserAgencies).toBe(
      expected,
    );
  };

  const expectIsFetchingAgenciesNeedingReviewForUserToBe = (
    expected: boolean,
  ) => {
    expect(
      store.getState().admin.agencyAdmin.isFetchingAgenciesNeedingReviewForUser,
    ).toBe(expected);
  };
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

  const expectFeedbackToEqual = (expected: AgencySubmitFeedback) => {
    expectToEqual(agencyAdminSelectors.feedback(store.getState()), expected);
  };
});
