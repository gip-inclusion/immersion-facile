import { FormEstablishmentBatchDto, FormEstablishmentDtoBuilder } from "shared";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AddFormEstablishmentBatchFeedback,
  establishmentBatchSlice,
  EstablishmentCSVRow,
  FormEstablishmentDtoWithErrors,
} from "./establishmentBatch.slice";

const establishmentBatch: FormEstablishmentBatchDto = {
  groupName: "L'amie caline",
  formEstablishments: [FormEstablishmentDtoBuilder.valid().build()],
};

describe("Establishment batch", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    const storeAndDeps = createTestStore();
    ({ store, dependencies } = storeAndDeps);
  });
  it("should indicates load state on add batch requested", () => {
    expectIsLoadingToBe(false);
    store.dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested(
        establishmentBatch,
      ),
    );
    expectIsLoadingToBe(true);
  });

  it("should send establishment batch to the gateway and show success feedback", () => {
    store.dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested(
        establishmentBatch,
      ),
    );
    dependencies.adminGateway.establishmentBatchResponse$.next(undefined);
    expectIsLoadingToBe(false);
    expectFeedbackToEqual({
      kind: "success",
    });
  });

  it("should send establishment batch to the gateway and show error feedback when it goes wrong", () => {
    const errorMessage = "Error trying to send establishmentBatch";
    store.dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested(
        establishmentBatch,
      ),
    );
    dependencies.adminGateway.establishmentBatchResponse$.error(
      new Error(errorMessage),
    );
    expectIsLoadingToBe(false);
    expectFeedbackToEqual({
      kind: "errored",
      errorMessage,
    });
  });

  it("should update establishments to review in store", () => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid().build();

    const candidateEstablishmentsFromCSV: EstablishmentCSVRow[] = [
      {
        // todo builder
        businessAddress: "1 Rue du Moulin, 12345 Quelque Part",
        businessContact_email: "amil@mail.com",
        businessContact_firstName: "Esteban",
        businessContact_lastName: "Ocon",
        businessContact_phone: "+33012345678",
        businessContact_job: "a job",
        businessContact_contactMethod: "EMAIL",
        businessContact_copyEmails: "copy1@mail.com, copy2@mail.com",
        naf_code: "A",
        businessName: "Ma super entreprise",
        businessNameCustomized: "Ma belle enseigne du quartier",
        siret: "01234567890123",
        website: "www@super.com/jobs",
        additionalInformation: "",
        appellations_code: "11111, 22222, 33333",
        isEngagedEnterprise: "1",
        isSearchable: "0",
        fitForDisabledWorkers: "",
      },
    ];
    const expectedCandidateEstablishmentParsed: FormEstablishmentDtoWithErrors[] =
      [
        {
          ...formEstablishment,
          zodErrors: [],
        },
      ];
    store.dispatch(
      establishmentBatchSlice.actions.candidateEstablishmentBatchProvided(
        candidateEstablishmentsFromCSV,
      ),
    );
    expectStaginEstablishmentsToEqual(expectedCandidateEstablishmentParsed);
  });

  const expectIsLoadingToBe = (isLoading: boolean) =>
    expect(store.getState().establishmentBatch.isLoading).toBe(isLoading);

  const expectFeedbackToEqual = (feedback: AddFormEstablishmentBatchFeedback) =>
    expect(store.getState().establishmentBatch.feedback).toEqual(feedback);

  const expectStaginEstablishmentsToEqual = (
    stagingEstablishments: FormEstablishmentDtoWithErrors[],
  ) =>
    expect(store.getState().establishmentBatch.candidateEstablishments).toEqual(
      stagingEstablishments,
    );
});
