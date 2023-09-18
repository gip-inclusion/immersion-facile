import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectToEqual,
  SubscriptionParams,
} from "shared";
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

    const agency1 = new AgencyDtoBuilder().withId("agency-1").build();
    const agency2 = new AgencyDtoBuilder().withId("agency-2").build();
    const convention1 = new ConventionDtoBuilder()
      .withId("11111111-ee70-4c90-b3f4-668d492f7395")
      .withAgencyId(agency1.id)
      .build();
    const convention2 = new ConventionDtoBuilder()
      .withId("22222222-ee70-4c90-b3f4-668d492f7395")
      .withAgencyId(agency2.id)
      .build();

    uow.agencyRepository.setAgencies([agency1, agency2]);
    uow.conventionRepository.setConventions({
      [convention1.id]: convention1,
      [convention2.id]: convention2,
    });

    const callbackParams1: SubscriptionParams = {
      callbackHeaders: { authorization: "my-cb-auth-header" },
      callbackUrl: "https://www.my-service.com/convention-updated",
    };

    const apiConsumer1 = new ApiConsumerBuilder()
      .withId("my-api-consumer1")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [agency1.id] },
        subscriptions: {
          "convention.updated": callbackParams1,
        },
      })
      .build();

    const callbackParams2: SubscriptionParams = {
      callbackHeaders: { authorization: "my-cb-auth-header" },
      callbackUrl: "https://www.my-service.com/convention-updated",
    };
    const apiConsumer2 = new ApiConsumerBuilder()
      .withId("my-api-consumer2")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [agency2.id] },
        subscriptions: {
          "convention.updated": callbackParams2,
        },
      })
      .build();

    const apiConsumerNotAllowedToBeNotified = new ApiConsumerBuilder()
      .withId("my-api-consumer-not-allowed")
      .withConventionRight({
        kinds: ["READ"],
        scope: { agencyIds: [agency1.id] },
        subscriptions: {
          "convention.updated": callbackParams1,
        },
      })
      .build();

    uow.apiConsumerRepository.consumers = [
      apiConsumer1,
      apiConsumer2,
      apiConsumerNotAllowedToBeNotified,
    ];

    const broadcastUpdatedConvention = new BroadcastUpdatedConvention(
      uowPerformer,
      subscribersGateway,
    );

    await broadcastUpdatedConvention.execute(convention1);

    const expectedCallsAfterFirstExecute: NotifySubscriberParams[] = [
      {
        callbackHeaders: callbackParams1.callbackHeaders,
        callbackUrl: callbackParams1.callbackUrl,
        conventionRead: {
          ...convention1,
          agencyName: agency1.name,
          agencyDepartment: agency1.address.departmentCode,
          agencyKind: agency1.kind,
        },
      },
    ];

    expectToEqual(subscribersGateway.calls, expectedCallsAfterFirstExecute);

    await broadcastUpdatedConvention.execute(convention2);

    const expectedCallsAfterSecondExecute: NotifySubscriberParams[] = [
      ...expectedCallsAfterFirstExecute,
      {
        callbackHeaders: callbackParams2.callbackHeaders,
        callbackUrl: callbackParams2.callbackUrl,
        conventionRead: {
          ...convention2,
          agencyName: agency2.name,
          agencyDepartment: agency2.address.departmentCode,
          agencyKind: agency2.kind,
        },
      },
    ];

    expectToEqual(subscribersGateway.calls.length, 2);
    expectToEqual(subscribersGateway.calls, expectedCallsAfterSecondExecute);
  });
});
