import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  AgencyId,
  Beneficiary,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionReadDto,
  expectObjectsToMatch,
  expectToEqual,
  SignatoryRole,
} from "shared";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { conventionSlice, ConventionState } from "./convention.slice";

describe("Convention slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("sets JWT in store", () => {
    const jwt = "some-jwt";
    store.dispatch(conventionSlice.actions.jwtProvided(jwt));
    expectConventionState({ jwt });
  });

  describe("Save convention", () => {
    it("saves a new convention", () => {
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithAddConventionSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "justSubmitted" },
      });
      expectAddConventionToHaveBeenCalled(1);
      expectUpdateConventionToHaveBeenCalled(0);
    });

    it("saves an already existing convention base (base on presence of JWT)", () => {
      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
          },
          jwt: "some-correct-jwt",
          convention: null,
          conventionStatusDashboardUrl: null,
          isLoading: false,
          fetchError: null,
          feedback: { kind: "idle" },
          currentSignatoryRole: null,
        },
      }));
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithUpdateConventionSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "justSubmitted" },
      });
      expectUpdateConventionToHaveBeenCalled(1);
      expectAddConventionToHaveBeenCalled(0);
    });

    it("shows message when something goes wrong when saving", () => {
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "Une erreur lors de la sauvegarde ! ";
      feedGatewayWithAddConventionError(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  describe("Get convention", () => {
    it("stores null as Convention without a convention matching in backend", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(undefined);
      expectConventionState({
        convention: null,
        isLoading: false,
      });
    });

    it("stores the Convention if one matches in backend with magicLinkJwt", () => {
      const convention = new ConventionDtoBuilder().build();
      const conventionRead = {
        ...convention,
        agencyName: "agency",
        agencyDepartment: "75",
      };
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(conventionRead);
      expectConventionState({
        convention: conventionRead,
        isLoading: false,
      });
    });

    it("stores error if failure during fetch", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
        fetchError: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithErrorOnConventionFetch(new Error("I failed !"));
      expectConventionState({
        convention: null,
        isLoading: false,
        fetchError: "I failed !",
      });
    });

    it("clears initial submit feedback kind if it was not idle when it started to fetch", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
        fetchError: null,
      });
      ({ store } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
          },
          feedback: { kind: "justSubmitted" },
          isLoading: false,
          convention: null,
          conventionStatusDashboardUrl: null,
          fetchError: null,
          jwt: null,
          currentSignatoryRole: null,
        },
      }));
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true, feedback: { kind: "idle" } });
    });

    it("reflects formUi when get convention with tutor different from establishment representative", () => {
      const convention = new ConventionDtoBuilder()
        .withEstablishmentRepresentativeEmail("a-different@email.com")
        .build();
      const conventionRead = {
        ...convention,
        agencyName: "agency",
        agencyDepartment: "75",
      };
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(conventionRead);
      expectConventionState({
        convention: conventionRead,
        isLoading: false,
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: false,
          hasCurrentEmployer: false,
        },
      });
    });

    it("reflects formUi when get convention with minor", () => {
      const convention = new ConventionDtoBuilder()
        .withBeneficiaryRepresentative({
          email: "benef-rep@rep.com",
          phone: "0102",
          firstName: "yo",
          lastName: "lo",
          role: "beneficiary-representative",
        })
        .build();
      const conventionRead = {
        ...convention,
        agencyName: "agency",
        agencyDepartment: "75",
      };
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(conventionRead);
      expectConventionState({
        convention: conventionRead,
        isLoading: false,
        formUi: {
          preselectedAgencyId: null,
          isMinor: true,
          isTutorEstablishmentRepresentative: false,
          hasCurrentEmployer: false,
        },
      });
    });
  });

  describe("Signatory data from convention selector", () => {
    it("returns null values when there is no convention", () => {
      const signatoryData = conventionSelectors.signatoryData(store.getState());
      expectToEqual(signatoryData, {
        signatory: null,
        signedAtFieldName: null,
      });
    });

    it("returns null values when no there is no current signatory", () => {
      const convention = {
        ...new ConventionDtoBuilder().build(),
        agencyName: "My agency",
        agencyDepartment: "75",
      };
      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
          },
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          conventionStatusDashboardUrl: null,
          currentSignatoryRole: null,
        },
      }));
      const signatoryData = conventionSelectors.signatoryData(store.getState());
      expectToEqual(signatoryData, {
        signatory: null,
        signedAtFieldName: null,
      });
    });

    it("selects signatory data in convention when there is convention and currentSignatoryRole", () => {
      const beneficiary: Beneficiary<"immersion"> = {
        email: "benef@mail.com",
        role: "beneficiary",
        phone: "0614000000",
        firstName: "John",
        lastName: "Doe",
        birthdate: "1990-02-21T00:00:00.000Z",
      };
      const convention = {
        ...new ConventionDtoBuilder().withBeneficiary(beneficiary).build(),
        agencyName: "My agency",
        agencyDepartment: "75",
      };

      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
          },
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          conventionStatusDashboardUrl: null,
          currentSignatoryRole: "beneficiary",
        },
      }));

      const signatoryData = conventionSelectors.signatoryData(store.getState());

      expectToEqual(signatoryData, {
        signatory: beneficiary,
        signedAtFieldName: "signatories.beneficiary.signedAt",
      });
    });
  });

  describe("Convention signature", () => {
    it("signs the conventions with role from jwt", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.signConventionRequested({
          jwt,
          role: "beneficiary",
          signedAt: new Date().toISOString(),
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithSignSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "signedSuccessfully" },
      });
    });

    it("updates the convention with the new signature if convention exists in store", () => {
      const signedAt = "2022-10-10T12:00:00.000Z";
      const conventionBuilder = new ConventionDtoBuilder().notSigned();
      const addAgencyName = (convention: ConventionDto): ConventionReadDto => ({
        agencyName: "My agency",
        agencyDepartment: "75",
        ...convention,
      });

      const conventionNotSigned = addAgencyName(conventionBuilder.build());
      const conventionSignedByBeneficiary = addAgencyName(
        conventionBuilder.signedByBeneficiary(signedAt).build(),
      );

      const jwt = "some-correct-jwt";
      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
          },
          jwt: null,
          convention: conventionNotSigned,
          conventionStatusDashboardUrl: null,
          feedback: { kind: "modificationsAskedFromSignatory" },
          isLoading: false,
          fetchError: null,
          currentSignatoryRole: null,
        },
      }));
      store.dispatch(
        conventionSlice.actions.signConventionRequested({
          jwt,
          role: "beneficiary",
          signedAt,
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithSignSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "signedSuccessfully" },
        convention: conventionSignedByBeneficiary,
      });
    });

    it("gets error message when signature fails", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.signConventionRequested({
          jwt,
          role: "beneficiary",
          signedAt: new Date().toISOString(),
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "You are not allowed to sign";
      feedGatewayWithSignError(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  describe("Convention status change", () => {
    it("sends modification request with provided justification", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.statusChangeRequested({
          updateStatusParams: {
            status: "DRAFT",
            justification: "There is a mistake in my last name",
          },
          feedbackKind: "modificationsAskedFromSignatory",
          jwt,
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithModificationSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "modificationsAskedFromSignatory" },
      });
    });

    it("gets error message when modification fails", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.statusChangeRequested({
          updateStatusParams: {
            status: "DRAFT",
            justification: "There is a mistake in my last name",
          },
          feedbackKind: "modificationsAskedFromSignatory",
          jwt,
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "You are not allowed to ask for modifications";
      feedGatewayWithModificationFailure(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  it("gets the dashboard Url for convention status check", () => {
    const jwt = "some-correct-jwt";
    store.dispatch(
      conventionSlice.actions.conventionStatusDashboardRequested(jwt),
    );
    expectConventionState({ isLoading: true });
    const dashboardUrl: AbsoluteUrl = "https://my-dashboard.com/123";
    feedGatewayWithConventionStatusDashboardUrl(dashboardUrl);
    expectConventionState({ conventionStatusDashboardUrl: dashboardUrl });
  });

  it("stores the error when something goes wrong when fetching the dashboard Url for convention status check", () => {
    const jwt = "some-correct-jwt";
    store.dispatch(
      conventionSlice.actions.conventionStatusDashboardRequested(jwt),
    );
    expectConventionState({ isLoading: true });
    feedGatewayWithConventionStatusDashboardUrlError(new Error("Oops !"));
    expectConventionState({
      feedback: {
        kind: "errored",
        errorMessage: "Oops !",
      },
    });
  });

  it("stores the current signatory role", () => {
    expectConventionState({ currentSignatoryRole: null });
    const newRole: SignatoryRole = "beneficiary";
    store.dispatch(
      conventionSlice.actions.currentSignatoryRoleChanged(newRole),
    );
    expectConventionState({ currentSignatoryRole: newRole });
  });

  it("changes the feedback to idle when asked", () => {
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: false,
        },
        jwt: null,
        convention: null,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "modificationsAskedFromSignatory" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
      },
    }));
    store.dispatch(conventionSlice.actions.clearFeedbackTriggered());
    expectConventionState({ feedback: { kind: "idle" } });
  });

  it("Toggle is minor", () => {
    expectIsMinorToBe(false);

    store.dispatch(conventionSlice.actions.isMinorChanged(true));
    expectIsMinorToBe(true);

    store.dispatch(conventionSlice.actions.isMinorChanged(false));
    expectIsMinorToBe(false);
  });

  it("Toggle is tutor establishment representative", () => {
    expectIsTutorEstablishmentRepresentativeToBe(true);
    store.dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(false),
    );
    expectIsTutorEstablishmentRepresentativeToBe(false);
    store.dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(true),
    );
    expectIsTutorEstablishmentRepresentativeToBe(true);
  });

  it("Clear fetched convention", () => {
    const convention = {
      ...new ConventionDtoBuilder().build(),
      agencyName: "agency",
      agencyDepartment: "75",
    };
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: false,
        },
        jwt: null,
        convention,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "modificationsAskedFromSignatory" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
      },
    }));
    expectConventionState({ convention });
    store.dispatch(conventionSlice.actions.clearFetchedConvention());
    expectConventionState({ convention: null });
  });

  describe("Getting custom agency id for convention form", () => {
    it("changes loading state when fetches custom agency id", () => {
      store.dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
      expectIsLoadingToBe(true);
    });
    it("fetches agency id successfully", () => {
      const agency = new AgencyDtoBuilder().build();
      store.dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
      dependencies.agencyGateway.customAgencyId$.next(agency.id);
      expectIsLoadingToBe(false);
      expectPreselectedAgencyIdToBe(agency.id);
    });
    it("returns an error if fetches fail", () => {
      store.dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
      dependencies.agencyGateway.customAgencyId$.error(
        new Error("Failed fetch preselectedAgencyId"),
      );
      expectIsLoadingToBe(false);
      expectPreselectedAgencyIdToBe(null);
    });
  });

  const expectConventionState = (conventionState: Partial<ConventionState>) => {
    expectObjectsToMatch(store.getState().convention, conventionState);
  };

  const expectPreselectedAgencyIdToBe = (expected: AgencyId | null) => {
    expectToEqual(
      conventionSelectors.preselectedAgencyId(store.getState()),
      expected,
    );
  };

  const feedGatewayWithAddConventionSuccess = () => {
    dependencies.conventionGateway.addConventionResult$.next(undefined);
  };

  const feedGatewayWithAddConventionError = (error: Error) => {
    dependencies.conventionGateway.addConventionResult$.error(error);
  };

  const feedGatewayWithUpdateConventionSuccess = () => {
    dependencies.conventionGateway.updateConventionResult$.next(undefined);
  };

  const feedGatewayWithConventionStatusDashboardUrl = (url: AbsoluteUrl) => {
    dependencies.conventionGateway.conventionDashboardUrl$.next(url);
  };

  const feedGatewayWithConventionStatusDashboardUrlError = (error: Error) => {
    dependencies.conventionGateway.conventionDashboardUrl$.error(error);
  };

  // const feedGatewayWithUpdateConventionError = (error: Error) => {
  //   dependencies.conventionGateway.updateConventionResult$.error(error);
  // };

  const expectAddConventionToHaveBeenCalled = (numberOfCalls: number) => {
    expect(dependencies.conventionGateway.addConventionCallCount).toBe(
      numberOfCalls,
    );
  };

  const expectUpdateConventionToHaveBeenCalled = (numberOfCalls: number) => {
    expect(dependencies.conventionGateway.updateConventionCallCount).toBe(
      numberOfCalls,
    );
  };

  const feedGatewayWithErrorOnConventionFetch = (error: Error) => {
    dependencies.conventionGateway.convention$.error(error);
  };

  const feedGatewayWithConvention = (
    convention: ConventionReadDto | undefined,
  ) => {
    dependencies.conventionGateway.convention$.next(convention);
  };

  const feedGatewayWithSignSuccess = () => {
    dependencies.conventionGateway.conventionSignedResult$.next(undefined);
  };

  const feedGatewayWithSignError = (error: Error) => {
    dependencies.conventionGateway.conventionSignedResult$.error(error);
  };

  const feedGatewayWithModificationSuccess = () => {
    dependencies.conventionGateway.conventionModificationResult$.next(
      undefined,
    );
  };

  const feedGatewayWithModificationFailure = (error: Error) => {
    dependencies.conventionGateway.conventionModificationResult$.error(error);
  };

  const expectIsMinorToBe = (expected: boolean) => {
    expectToEqual(conventionSelectors.isMinor(store.getState()), expected);
  };
  const expectIsLoadingToBe = (expected: boolean) => {
    expectToEqual(conventionSelectors.isLoading(store.getState()), expected);
  };
  const expectIsTutorEstablishmentRepresentativeToBe = (expected: boolean) => {
    expectToEqual(
      conventionSelectors.isTutorEstablishmentRepresentative(store.getState()),
      expected,
    );
  };
});
