import {
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { candidateEstablishmentMapper } from "./establishmentBatch.epics";
import {
  AddFormEstablishmentBatchFeedback,
  establishmentBatchSlice,
  FormEstablishmentDtoWithErrors,
} from "./establishmentBatch.slice";

const defaultEstablishment = FormEstablishmentDtoBuilder.valid().build();
const establishmentBatch: FormEstablishmentBatchDto = {
  groupName: "L'amie caline",
  formEstablishments: [defaultEstablishment],
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
    const responseData: EstablishmentBatchReport = {
      numberOfEstablishmentsProcessed: 10,
      numberOfSuccess: 9,
      failures: [
        {
          errorMessage: "Ooops, error",
          siret: "01234567890123",
        },
      ],
    };
    store.dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested(
        establishmentBatch,
      ),
    );
    dependencies.adminGateway.establishmentBatchResponse$.next(responseData);
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
    const formEstablishmentBuilder = FormEstablishmentDtoBuilder.valid();

    const candidateEstablishmentsFromCSVData: EstablishmentCSVRow =
      formEstablishmentBuilder.buildCsvRow();
    const expectedCandidateEstablishmentParsed: FormEstablishmentDtoWithErrors[] =
      [candidateEstablishmentMapper(candidateEstablishmentsFromCSVData)];
    store.dispatch(
      establishmentBatchSlice.actions.candidateEstablishmentBatchProvided([
        candidateEstablishmentsFromCSVData,
      ]),
    );
    expectCandidateEstablishmentsToEqual(expectedCandidateEstablishmentParsed);
  });

  const expectIsLoadingToBe = (isLoading: boolean) =>
    expect(store.getState().establishmentBatch.isLoading).toBe(isLoading);

  const expectFeedbackToEqual = (feedback: AddFormEstablishmentBatchFeedback) =>
    expect(store.getState().establishmentBatch.feedback).toEqual(feedback);

  const expectCandidateEstablishmentsToEqual = (
    candidateEstablishment: FormEstablishmentDtoWithErrors[],
  ) =>
    expect(store.getState().establishmentBatch.candidateEstablishments).toEqual(
      candidateEstablishment,
    );
});
