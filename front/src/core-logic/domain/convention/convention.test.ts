import {
  type Beneficiary,
  ConventionDtoBuilder,
  type ConventionReadDto,
  type DashboardUrlAndName,
  type EstablishmentRepresentative,
  type EstablishmentTutor,
  type SignatoryRole,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  type ConventionState,
  conventionSlice,
  initialConventionState,
} from "./convention.slice";

const conventionReadDtoRemainingProps = {
  agencyDepartment: "75",
  agencyId: "some-agency-id",
  agencyName: "some-agency-name",
  agencyKind: "pole-emploi" as const,
  agencySiret: "11112222000033",
  agencyCounsellorEmails: [],
  agencyValidatorEmails: ["validator@mail.com"],
};

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
      const convention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested({
          convention: {
            ...convention,
            ...conventionReadDtoRemainingProps,
          },
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithAddConventionSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "justSubmitted" },
      });
      expect(store.getState().convention.convention?.status).toBe(
        "READY_TO_SIGN",
      );
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
            currentStep: 1,
            agencyDepartment: null,
            showSummary: false,
          },
          jwt: "some-correct-jwt",
          convention: null,
          conventionStatusDashboardUrl: null,
          isLoading: false,
          fetchError: null,
          feedback: { kind: "idle" },
          currentSignatoryRole: null,
          similarConventionIds: [],
        },
      }));
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested({
          convention: {
            ...convention,
            ...conventionReadDtoRemainingProps,
          },
        }),
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
        conventionSlice.actions.saveConventionRequested({
          convention: {
            ...convention,
            ...conventionReadDtoRemainingProps,
          },
        }),
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

  describe("Get similar conventions", () => {
    it("get no similar convention", () => {
      const convention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .build();
      store.dispatch(
        conventionSlice.actions.getSimilarConventionsRequested({
          siret: convention.siret,
          beneficiaryBirthdate: "2023-10-01",
          dateStart: convention.dateStart,
          beneficiaryLastName: "Test",
          codeAppellation: "111222",
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      dependencies.conventionGateway.getSimilarConventionsResult$.next([]);
      expectConventionState({
        isLoading: false,
      });
      expectToEqual(
        conventionSelectors.similarConventionIds(store.getState()),
        [],
      );
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

    it("fetch a convention with rqth beneficiary", () => {
      const beneficiary: Beneficiary<"immersion"> = {
        email: "benef@mail.com",
        role: "beneficiary",
        phone: "0614000000",
        firstName: "John",
        lastName: "Doe",
        birthdate: "1990-02-21T00:00:00.000Z",
        isRqth: true,
      };
      const convention = new ConventionDtoBuilder()
        .withBeneficiary(beneficiary)
        .build();
      const conventionRead: ConventionReadDto = {
        ...convention,
        agencyName: "agency",
        agencyDepartment: "75",
        agencyKind: "pole-emploi",
        agencySiret: "11112222000033",
        agencyCounsellorEmails: [],
        agencyValidatorEmails: ["validator@mail.com"],
      };
      // tester l'état initiale
      expectConventionState({
        isLoading: false,
        convention: null,
      });

      //dispatch fetch convention
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested({
          jwt: "my-jwt",
          conventionId: "some-convention-id",
        }),
      );

      //test state
      expectConventionState({
        isLoading: true,
        convention: null,
      });

      //feed gateway
      feedGatewayWithConvention(conventionRead);

      //test state
      expectConventionState({
        isLoading: false,
        convention: {
          ...conventionRead,
          signatories: {
            ...conventionRead.signatories,
            beneficiary: {
              ...beneficiary,
              isRqth: true,
            },
          },
        } as ConventionReadDto,
      });
    });

    it("stores the Convention if one matches in backend with magicLinkJwt", () => {
      const convention = new ConventionDtoBuilder().build();
      const conventionRead: ConventionReadDto = {
        ...convention,
        agencyName: "agency",
        agencyDepartment: "75",
        agencyKind: "pole-emploi",
        agencySiret: "11112222000033",
        agencyCounsellorEmails: [],
        agencyValidatorEmails: ["validator@mail.com"],
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
            currentStep: 1,
            agencyDepartment: null,
            showSummary: false,
          },
          feedback: { kind: "justSubmitted" },
          isLoading: false,
          convention: null,
          conventionStatusDashboardUrl: null,
          fetchError: null,
          jwt: null,
          currentSignatoryRole: null,
          similarConventionIds: [],
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

    describe("Convention formUi update based on convention data", () => {
      describe("isTutorEstablishmentRepresentative", () => {
        it("reflects formUi when get convention with tutor different from establishment representative", () => {
          const convention = new ConventionDtoBuilder()
            .withEstablishmentRepresentativeEmail("a-different@email.com")
            .build();
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "cci",
            agencySiret: "11112222000044",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });

        it("reflects formUi when get convention with tutor same as establishment representative", () => {
          const tutor: EstablishmentTutor = {
            email: "tutor@email.com",
            firstName: "tutorName",
            lastName: "tutorLastName",
            job: "Tutor",
            phone: "+33611223344",
            role: "establishment-tutor",
          };
          const establishmentRepresentative: EstablishmentRepresentative = {
            ...tutor,
            role: "establishment-representative",
          };

          const convention = new ConventionDtoBuilder()
            .withEstablishmentTutor(tutor)
            .withEstablishmentRepresentative(establishmentRepresentative)
            .build();
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "cci",
            agencySiret: "11112222000055",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              isTutorEstablishmentRepresentative: true,
              hasCurrentEmployer: false,
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });
      });

      describe("isMinor", () => {
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
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "cci",
            agencySiret: "11112222000055",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });

        it("reflects formUi when get convention with not minor", () => {
          const convention = new ConventionDtoBuilder()
            .withBeneficiaryRepresentative(undefined)
            .build();
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "cci",
            agencySiret: "11112222000055",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });
      });

      describe("hasCurrentEmployer", () => {
        it("reflects formUi when we fetch a convention without current employer", () => {
          const convention = new ConventionDtoBuilder()
            .withBeneficiaryCurrentEmployer(undefined)
            .build();
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "mission-locale",
            agencySiret: "11112222000055",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });

        it("reflects formUi when we fetch a convention with current employer", () => {
          const convention = new ConventionDtoBuilder()
            .withBeneficiaryCurrentEmployer({
              businessName: "France Merguez",
              businessSiret: "12345678901234",
              email: "currentEmployer@gmail.com",
              firstName: "Current",
              lastName: "LastName",
              job: "job",
              phone: "+33112233445",
              role: "beneficiary-current-employer",
              businessAddress: "20 rue des merguez ",
            })
            .build();
          const conventionRead: ConventionReadDto = {
            ...convention,
            agencyName: "agency",
            agencyDepartment: "75",
            agencyKind: "mission-locale",
            agencySiret: "11112222000055",
            agencyCounsellorEmails: [],
            agencyValidatorEmails: ["validator@mail.com"],
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
              hasCurrentEmployer: true,
              currentStep: 1,
              agencyDepartment: null,
              showSummary: false,
            },
          });
        });
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
      const convention: ConventionReadDto = {
        ...new ConventionDtoBuilder().build(),
        agencyName: "My agency",
        agencyDepartment: "75",
        agencyKind: "cap-emploi",
        agencySiret: "11112222000055",
        agencyCounsellorEmails: [],
        agencyValidatorEmails: ["validator@mail.com"],
      };
      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
            currentStep: 1,
            agencyDepartment: null,
            showSummary: false,
          },
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          conventionStatusDashboardUrl: null,
          currentSignatoryRole: null,
          similarConventionIds: [],
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
        isRqth: false,
      };
      const convention: ConventionReadDto = {
        ...new ConventionDtoBuilder().withBeneficiary(beneficiary).build(),
        agencyName: "My agency",
        agencyDepartment: "75",
        agencyKind: "conseil-departemental",
        agencySiret: "11112222000066",
        agencyCounsellorEmails: [],
        agencyValidatorEmails: ["validator@mail.com"],
      };

      ({ store, dependencies } = createTestStore({
        convention: {
          formUi: {
            preselectedAgencyId: null,
            isMinor: false,
            isTutorEstablishmentRepresentative: true,
            hasCurrentEmployer: false,
            currentStep: 1,
            agencyDepartment: null,
            showSummary: false,
          },
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          conventionStatusDashboardUrl: null,
          currentSignatoryRole: "beneficiary",
          similarConventionIds: [],
        },
      }));

      const signatoryData = conventionSelectors.signatoryData(store.getState());

      expectToEqual(signatoryData, {
        signatory: beneficiary,
        signedAtFieldName: "signatories.beneficiary.signedAt",
      });
    });
  });

  it("gets the dashboard Url for convention status check", () => {
    const jwt = "some-correct-jwt";
    store.dispatch(
      conventionSlice.actions.conventionStatusDashboardRequested(jwt),
    );
    expectConventionState({ isLoading: true });
    const urlAndName: DashboardUrlAndName = {
      name: "conventionStatus",
      url: "https://my-dashboard.com/123",
    };
    feedGatewayWithConventionStatusDashboardUrl(urlAndName);
    expectConventionState({ conventionStatusDashboardUrl: urlAndName.url });
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
          currentStep: 1,
          agencyDepartment: null,
          showSummary: false,
        },
        jwt: null,
        convention: null,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "justSubmitted" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
        similarConventionIds: [],
      },
    }));
    store.dispatch(conventionSlice.actions.clearFeedbackTriggered());
    expectConventionState({ feedback: { kind: "idle" } });
  });

  it("changes the form current step when asked", () => {
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: false,
          currentStep: 1,
          agencyDepartment: null,
          showSummary: false,
        },
        jwt: null,
        convention: null,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "idle" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
        similarConventionIds: [],
      },
    }));
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, currentStep: 1 },
    });
    store.dispatch(conventionSlice.actions.setCurrentStep(2));
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, currentStep: 2 },
    });
  });

  it("changes the form agencyDepartment when asked", () => {
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: false,
          currentStep: 1,
          agencyDepartment: null,
          showSummary: false,
        },
        jwt: null,
        convention: null,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "idle" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
        similarConventionIds: [],
      },
    }));
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, agencyDepartment: null },
    });
    store.dispatch(
      conventionSlice.actions.agencyDepartementChangeRequested("86"),
    );
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, agencyDepartment: "86" },
    });
  });

  it("changes the form showSummary when asked (and populate convention if provided)", () => {
    const fakeConvention =
      new ConventionDtoBuilder().build() as ConventionReadDto;
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: false,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: false,
          currentStep: 1,
          agencyDepartment: null,
          showSummary: false,
        },
        jwt: null,
        convention: null,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "idle" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
        similarConventionIds: [],
      },
    }));
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, showSummary: false },
    });
    store.dispatch(
      conventionSlice.actions.showSummaryChangeRequested({
        showSummary: true,
        convention: fakeConvention,
      }),
    );
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, showSummary: true },
      convention: fakeConvention,
    });
    store.dispatch(
      conventionSlice.actions.showSummaryChangeRequested({
        showSummary: false,
      }),
    );
    expectConventionState({
      formUi: { ...store.getState().convention.formUi, showSummary: false },
    });
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
    const convention: ConventionReadDto = {
      ...new ConventionDtoBuilder().build(),
      agencyName: "agency",
      agencyDepartment: "75",
      agencyKind: "cci",
      agencySiret: "11112222000077",
      agencyCounsellorEmails: [],
      agencyValidatorEmails: ["validator@mail.com"],
    };
    ({ store } = createTestStore({
      convention: {
        formUi: {
          preselectedAgencyId: null,
          isMinor: true,
          isTutorEstablishmentRepresentative: true,
          hasCurrentEmployer: true,
          currentStep: 3,
          agencyDepartment: "87",
          showSummary: false,
        },
        jwt: null,
        convention,
        conventionStatusDashboardUrl: null,
        feedback: { kind: "idle" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
        similarConventionIds: [],
      },
    }));
    expectConventionState({ convention });
    store.dispatch(conventionSlice.actions.clearFetchedConvention());
    expectConventionState({
      convention: initialConventionState.convention,
      formUi: initialConventionState.formUi,
    });
  });

  const expectConventionState = (conventionState: Partial<ConventionState>) => {
    expectObjectsToMatch(store.getState().convention, conventionState);
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

  const feedGatewayWithConventionStatusDashboardUrl = (
    params: DashboardUrlAndName,
  ) => {
    dependencies.conventionGateway.conventionDashboardUrl$.next(params);
  };

  const feedGatewayWithConventionStatusDashboardUrlError = (error: Error) => {
    dependencies.conventionGateway.conventionDashboardUrl$.error(error);
  };

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

  const expectIsMinorToBe = (expected: boolean) => {
    expectToEqual(conventionSelectors.isMinor(store.getState()), expected);
  };

  const expectIsTutorEstablishmentRepresentativeToBe = (expected: boolean) => {
    expectToEqual(
      conventionSelectors.isTutorEstablishmentRepresentative(store.getState()),
      expected,
    );
  };
});
