import {
  type EstablishmentBatchReport,
  type EstablishmentCSVRow,
  type FormEstablishmentBatchDto,
  type FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  expectToEqual,
} from "shared";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { candidateEstablishmentMapper } from "./establishmentBatch.epics";
import {
  type FormEstablishmentDtoWithErrors,
  establishmentBatchSlice,
} from "./establishmentBatch.slice";

const defaultEstablishment = FormEstablishmentDtoBuilder.valid().build();
const establishmentBatch: FormEstablishmentBatchDto = {
  groupName: "L'amie caline",
  title: "My title",
  description: "My description",
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
      establishmentBatchSlice.actions.addEstablishmentBatchRequested({
        formEstablishmentBatch: establishmentBatch,
        feedbackTopic: "establishments-batch",
      }),
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
      establishmentBatchSlice.actions.addEstablishmentBatchRequested({
        formEstablishmentBatch: establishmentBatch,
        feedbackTopic: "establishments-batch",
      }),
    );
    dependencies.adminGateway.establishmentBatchResponse$.next(responseData);
    expectIsLoadingToBe(false);
    expectToEqual(store.getState().feedbacks, {
      "establishments-batch": {
        level: "success",
        on: "create",
        title: "Le groupe d'entreprises a bien été créé",
        message: "L'import en masse a réussi, voici le détail :",
      },
    });
  });

  it("should send establishment batch to the gateway and show error feedback when it goes wrong", () => {
    const errorMessage = "Error trying to send establishmentBatch";
    store.dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested({
        formEstablishmentBatch: establishmentBatch,
        feedbackTopic: "establishments-batch",
      }),
    );
    dependencies.adminGateway.establishmentBatchResponse$.error(
      new Error(errorMessage),
    );
    expectIsLoadingToBe(false);
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

  const expectCandidateEstablishmentsToEqual = (
    expectedCandidateEstablishments: FormEstablishmentDtoWithErrors[],
  ) => {
    const { candidateEstablishments } = store.getState().establishmentBatch;

    const actual = ignoreLocationIds(candidateEstablishments);
    const expected = ignoreLocationIds(expectedCandidateEstablishments);

    expect(actual).toEqual(expected);
  };
});

const ignoreLocationIds = (
  candidateEstablishments: FormEstablishmentDtoWithErrors[],
): FormEstablishmentDto[] =>
  candidateEstablishments
    .filter(({ formEstablishment }) => !!formEstablishment)
    .map(({ formEstablishment }) => {
      // biome-ignore lint/style/noNonNullAssertion: we just filtered out the nulls
      const { businessAddresses, ...rest } = formEstablishment!;

      return {
        ...rest,
        businessAddresses: businessAddresses.map(({ rawAddress }) => ({
          id: "irrelevant",
          rawAddress,
        })),
      };
    });
