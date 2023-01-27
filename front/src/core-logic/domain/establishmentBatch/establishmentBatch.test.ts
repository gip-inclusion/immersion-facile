import {
  FormEstablishmentBatchDto,
  FormEstablishmentDtoBuilder,
} from "src/../../shared/src";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  AddFormEstablishmentBatchFeedback,
  establishmentBatchSlice,
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

  const expectIsLoadingToBe = (isLoading: boolean) =>
    expect(store.getState().establishmentBatch.isLoading).toBe(isLoading);

  const expectFeedbackToEqual = (feedback: AddFormEstablishmentBatchFeedback) =>
    expect(store.getState().establishmentBatch.feedback).toEqual(feedback);
});
