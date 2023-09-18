import { AgencyDtoBuilder, ConventionDtoBuilder, expectToEqual } from "shared";
import { ApiConsumerBuilder } from "../../../_testBuilders/ApiConsumerBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  InMemorySubscribersGateway,
  NotifySubscriberParams,
} from "../../../adapters/secondary/subscribersGateway/InMemorySubscribersGateway";
import { BroadcastUpdatedConvention } from "./BroadcastUpdatedConvention";

describe("Broadcast updated convention", () => {
  it("broadcast updated convention", async () => {
    const uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const subscribersGateway = new InMemorySubscribersGateway();

    const agency = new AgencyDtoBuilder().build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .build();
    uow.agencyRepository.setAgencies([agency]);
    uow.conventionRepository.setConventions({
      [convention.id]: convention,
    });

    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [agency.id] },
      })
      .build();
    uow.apiConsumerRepository.consumers = [apiConsumer];

    const broadcastUpdatedConvention = new BroadcastUpdatedConvention(
      uowPerformer,
      subscribersGateway,
    );

    await broadcastUpdatedConvention.execute(convention);

    //expect partners having correct scope are called with corresponding params
    //expect partners not having correct scope are not called
    const expectedCalls: NotifySubscriberParams[] = [
      {
        callbackHeaders: { authorization: "yolo" },
        callbackUrl: "https://www.yolo.com",
        conventionRead: {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
        },
      },
    ];

    expectToEqual(subscribersGateway.calls, expectedCalls);
  });
});
