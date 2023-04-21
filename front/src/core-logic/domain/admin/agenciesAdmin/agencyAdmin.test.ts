import { values } from "ramda";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyOption,
  AgencyRight,
  AuthenticatedUser,
  expectToEqual,
  RegisterAgencyWithRoleToUserDto,
} from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import {
  agencyAdminInitialState,
  agencyAdminSlice,
  AgencyAdminState,
  AgencySubmitFeedback,
  NormalizedInclusionConnectedUserById,
} from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AGENCY_NEEDING_REVIEW_1,
  AGENCY_NEEDING_REVIEW_2,
  PE_AGENCY_ACTIVE,
} from "../../../adapters/AgencyGateway/InMemoryAgencyGateway";

const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
const agency3 = new AgencyDtoBuilder().withId("agency-3").build();
const agency4 = new AgencyDtoBuilder().withId("agency-4").build();

const agency1Right: AgencyRight = { agency: agency1, role: "toReview" };
const agency2Right: AgencyRight = { agency: agency2, role: "validator" };
const user1AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency1.id]: agency1Right,
  [agency2.id]: agency2Right,
};

const agency3Right: AgencyRight = { agency: agency3, role: "toReview" };
const agency4Right: AgencyRight = { agency: agency4, role: "toReview" };
const user2AgencyRights: Record<AgencyId, AgencyRight> = {
  [agency3.id]: agency3Right,
  [agency4.id]: agency4Right,
};

const user1Id = "user-id-1";
const authUser1: AuthenticatedUser = {
  id: user1Id,
  email: "user-email",
  firstName: "user-first-name",
  lastName: "user-last-name",
};

const user2Id = "user-id-2";
const authUser2: AuthenticatedUser = {
  id: user2Id,
  email: "user-email-2",
  firstName: "user-first-name-2",
  lastName: "user-last-name-2",
};

const testUserSet: NormalizedInclusionConnectedUserById = {
  [user1Id]: {
    ...authUser1,
    agencyRights: user1AgencyRights,
  },
  [user2Id]: {
    ...authUser2,
    agencyRights: user2AgencyRights,
  },
};

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
          ...agencyAdminInitialState,
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
              ...agencyAdminInitialState,
              agencyOptions,
              agencySearchText,
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
    it("selects the user to review", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            inclusionConnectedUsersNeedingReview: testUserSet,
            selectedUserId: null,
            feedback: { kind: "agencyUpdated" },
          },
        }),
      }));

      store.dispatch(
        agencyAdminSlice.actions.inclusionConnectedUserSelected(user2Id),
      );

      expectAgencyAdminStateToMatch({
        inclusionConnectedUsersNeedingReview: testUserSet,
        selectedUserId: user2Id,
        feedback: { kind: "agencyUpdated" },
      });
    });

    it("request agencies'users to review for registration and role", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);

      dependencies.adminGateway.getAgencyUsersToReviewResponse$.next([
        {
          ...authUser1,
          agencyRights: [agency1Right, agency2Right],
        },
        {
          ...authUser2,
          agencyRights: [agency3Right, agency4Right],
        },
      ]);
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expectToEqual(agencyAdminSelectors.usersNeedingReview(store.getState()), [
        authUser1,
        authUser2,
      ]);
      expectFeedbackToEqual({ kind: "usersToReviewFetchSuccess" });
    });

    it("request agencies'users to review for registration and role to throw on error", () => {
      store.dispatch(
        agencyAdminSlice.actions.fetchInclusionConnectedUsersToReviewRequested(),
      );
      const errorMessage = "Error fetching users to review";
      expectIsFetchingAgenciesNeedingReviewForUserToBe(true);
      dependencies.adminGateway.getAgencyUsersToReviewResponse$.error(
        new Error(errorMessage),
      );
      expectIsFetchingAgenciesNeedingReviewForUserToBe(false);
      expectFeedbackToEqual({ kind: "errored", errorMessage });
    });

    it("request agency to be registered to a user with a role", () => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyAdmin: {
            ...agencyAdminInitialState,
            inclusionConnectedUsersNeedingReview: testUserSet,
            selectedUserId: user2Id,
          },
        }),
      }));

      const payload: RegisterAgencyWithRoleToUserDto = {
        agencyId: "agency-3",
        userId: user2Id,
        role: "validator",
      };

      expectToEqual(
        agencyAdminSelectors.agenciesNeedingReviewForSelectedUser(
          store.getState(),
        ),
        values(user2AgencyRights),
      );
      store.dispatch(
        agencyAdminSlice.actions.registerAgencyWithRoleToUserRequested(payload),
      );
      expectIsUpdatingUserAgenciesToBe(true);
      dependencies.adminGateway.updateAgencyRoleForUserResponse$.next(
        undefined,
      );
      expectIsUpdatingUserAgenciesToBe(false);

      expectToEqual(
        agencyAdminSelectors.agenciesNeedingReviewForSelectedUser(
          store.getState(),
        ),
        [agency4Right],
      );
      expectFeedbackToEqual({ kind: "agencyRegisterToUserSuccess" });
    });

    it("request agency to be registered to an user with a role should throw on an error", () => {
      const payload: RegisterAgencyWithRoleToUserDto = {
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
