import { expectToEqual, type NafSectionSuggestion } from "shared";
import { withNoCache } from "../../caching-gateway/adapters/withNoCache";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type GetAllNafSections,
  makeGetAllNafSections,
} from "./GetAllNafSections";

describe("NafSuggestions", () => {
  let getNafSuggestions: GetAllNafSections;
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

  const expectedResult = [
    agricultureSection,
    industriesExtractiveSection,
    industrieManufacturiereSection,
  ];

  beforeEach(async () => {
    uow = createInMemoryUow();
    getNafSuggestions = makeGetAllNafSections({
      deps: {
        withCache: withNoCache,
        uowPerformer: new InMemoryUowPerformer(uow),
      },
    });
    uow.nafRepository.nafSuggestions = [
      agricultureSection,
      industriesExtractiveSection,
      industrieManufacturiereSection,
    ];
  });

  it("returns everything in the repository", async () => {
    expectToEqual(await getNafSuggestions.execute(), expectedResult);
  });
});
