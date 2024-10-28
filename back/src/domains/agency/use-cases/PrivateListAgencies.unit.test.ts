import { AgencyDtoBuilder, expectToEqual } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryAgencyRepository } from "../adapters/InMemoryAgencyRepository";
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

  it("should return agencies needing review as id an name object", async () => {
    const expectedAgency = AgencyDtoBuilder.create("1")
      .withName("Agency needing review")
      .withStatus("needsReview")
      .build();
    agencyRepository.agencies = [
      toAgencyWithRights(expectedAgency),
      toAgencyWithRights(
        AgencyDtoBuilder.create("3")
          .withName("Agency active")
          .withStatus("active")
          .build(),
      ),
    ];
    const fetchedAgencies = await privateListAgencies.execute({
      status: "needsReview",
    });
    expectToEqual(fetchedAgencies, [
      {
        id: expectedAgency.id,
        kind: expectedAgency.kind,
        name: expectedAgency.name,
      },
    ]);
  });
});
