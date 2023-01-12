import { AgencyDto, expectToEqual } from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { PrivateListAgencies } from "./PrivateListAgencies";

describe("PrivateListAgencies use case", () => {
  let agencyRepository: InMemoryAgencyRepository;
  let privateListAgencies: PrivateListAgencies;

  beforeEach(() => {
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);
    privateListAgencies = new PrivateListAgencies(uowPerformer);
  });

  it("does something", async () => {
    const expectedAgency = {
      id: "1",
      name: "Agency needing review",
      status: "needsReview",
    } as AgencyDto;
    agencyRepository.setAgencies([
      expectedAgency,
      {
        id: "3",
        name: "Agency active",
        status: "active",
      } as AgencyDto,
    ]);
    const fetchedAgencies = await privateListAgencies.execute({
      status: "needsReview",
    });
    expect(fetchedAgencies).toHaveLength(1);
    expectToEqual(fetchedAgencies[0], {
      id: expectedAgency.id,
      name: expectedAgency.name,
    });
  });
});
