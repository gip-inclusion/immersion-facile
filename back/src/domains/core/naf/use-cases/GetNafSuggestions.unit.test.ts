import { type NafSectionSuggestion, expectToEqual } from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import {
  type GetNafSuggestions,
  makeGetNafSuggestions,
} from "./GetNafSuggestions";

describe("NafSuggestions", () => {
  let getNafSuggestions: GetNafSuggestions;
  let uow: InMemoryUnitOfWork;

  const agricultureSection: NafSectionSuggestion = {
    label: "Agriculture",
    nafCodes: ["3215A", "7841A"],
  };

  const industriesExtractiveSection: NafSectionSuggestion = {
    label: "Industries extractives",
    nafCodes: ["7845C", "5578C"],
  };

  const industrieManufacturiereSection: NafSectionSuggestion = {
    label: "Industrie manufacturière",
    nafCodes: ["4587C", "9658C"],
  };

  beforeEach(async () => {
    uow = createInMemoryUow();
    getNafSuggestions = makeGetNafSuggestions({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
    uow.nafRepository.nafSuggestions = [
      agricultureSection,
      industriesExtractiveSection,
      industrieManufacturiereSection,
    ];
  });

  it("One result", async () => {
    expectToEqual(await getNafSuggestions.execute({ searchText: "Agri" }), [
      agricultureSection,
    ]);
  });

  it("Multiple result with lowercase", async () => {
    expectToEqual(await getNafSuggestions.execute({ searchText: "inDus " }), [
      industrieManufacturiereSection,
      industriesExtractiveSection,
    ]);
  });

  it("No result", async () => {
    expectToEqual(
      await getNafSuggestions.execute({ searchText: "Missing" }),
      [],
    );
  });
});
