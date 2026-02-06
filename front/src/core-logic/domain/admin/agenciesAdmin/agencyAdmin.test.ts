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
import { agencyNeedingReviewSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.selectors";
import { agencyNeedingReviewInitialState } from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.slice";
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
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { makeGeocodingLocatorSelector } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { AGENCY_NEEDING_REVIEW_2 } from "../../../adapters/AgencyGateway/SimulatedAgencyGateway";
import { connectedUsersAdminSelectors } from "../connectedUsersAdmin/connectedUsersAdmin.selectors";

describe("agencyAdmin", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Agency activate or reject", () => {
    describe("update agency needing review status", () => {
      const preloadedAgencyAdminState: AgencyAdminState = {
        ...agencyAdminInitialState,
      };

      beforeEach(() => {
        ({ store, dependencies } = createTestStore({
          admin: adminPreloadedState({
            agencyAdmin: { ...preloadedAgencyAdminState },
            agencyNeedingReview: {
              ...agencyNeedingReviewInitialState,
              agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
            },
          }),
        }));
      });

      it("successfully updates agency needing review status", () => {
        store.dispatch(
          agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
            id: AGENCY_NEEDING_REVIEW_2.id,
            status: "active",
            feedbackTopic: "agency-admin-needing-review",
          }),
        );

        expectAgencyAdminStateToMatch({
          ...preloadedAgencyAdminState,
          isLoading: true,
        });

        feedWithValidateOrRejectSuccess();

        expectAgencyAdminStateToMatch({
          ...preloadedAgencyAdminState,
          isLoading: false,
        });

        expectToEqual(
          agencyNeedingReviewSelectors.agencyNeedingReview(store.getState()),
          null,
        );

        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-admin-needing-review"
          ],
          {
            on: "update",
            level: "success",
            title: "Statut de l'agence mis à jour",
            message: "L'agence a été activée ou rejetée avec succès.",
          },
        );
      });

      it("stores update error in feedback slice when update agency needing review status fails", () => {
        store.dispatch(
          agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
            id: AGENCY_NEEDING_REVIEW_2.id,
            status: "active",
            feedbackTopic: "agency-admin-needing-review",
          }),
        );
        const errorMessage = "Network error";
        feedWithValidateOrRejectError(errorMessage);
        expectAgencyAdminStateToMatch({
          ...preloadedAgencyAdminState,
          isLoading: false,
        });
        expectToEqual(
          feedbacksSelectors.feedbacks(store.getState())[
            "agency-admin-needing-review"
          ],
          {
            on: "update",
            level: "error",
            title: "Problème lors de la mise à jour du statut de l'agence",
            message: errorMessage,
          },
        );
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
          agencyAdmin: { ...agencyAdminInitialState },
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

  const feedWithValidateOrRejectSuccess = () => {
    dependencies.agencyGateway.validateOrRejectAgencyResponse$.next(undefined);
  };

  const feedWithValidateOrRejectError = (msg: string) => {
    dependencies.agencyGateway.validateOrRejectAgencyResponse$.error(
      new Error(msg),
    );
  };

  const feedWithIcUsers = (icUsers: ConnectedUser[]) => {
    dependencies.authGateway.getConnectedUsersResponse$.next(icUsers);
  };

  const whenSearchTextIsProvided = (searchedText: string) => {
    store.dispatch(agencyAdminSlice.actions.setAgencySearchQuery(searchedText));
  };
});
