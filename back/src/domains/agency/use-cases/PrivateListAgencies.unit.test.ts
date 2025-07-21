import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { InMemoryAgencyRepository } from "../adapters/InMemoryAgencyRepository";
import {
  makePrivateListAgencies,
  type PrivateListAgencies,
} from "./PrivateListAgencies";

describe("PrivateListAgencies use case", () => {
  let agencyRepository: InMemoryAgencyRepository;
  let privateListAgencies: PrivateListAgencies;
  const adminUser = new ConnectedUserBuilder().withIsAdmin(true).build();
  const notAdminUser = new ConnectedUserBuilder().withIsAdmin(false).build();

  beforeEach(() => {
    const uow = createInMemoryUow();
    agencyRepository = uow.agencyRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);
    privateListAgencies = makePrivateListAgencies({
      uowPerformer,
    });
  });

  it("throws if connected user is not admin", async () => {
    await expectPromiseToFailWithError(
      privateListAgencies.execute(
        {
          status: "needsReview",
        },
        notAdminUser,
      ),
      errors.user.forbidden({ userId: notAdminUser.id }),
    );
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
    const fetchedAgencies = await privateListAgencies.execute(
      {
        status: "needsReview",
      },
      adminUser,
    );
    expectToEqual(fetchedAgencies, [
      {
        id: expectedAgency.id,
        kind: expectedAgency.kind,
        name: expectedAgency.name,
        status: expectedAgency.status,
        address: expectedAgency.address,
        refersToAgencyName: expectedAgency.refersToAgencyName,
      },
    ]);
  });
});
