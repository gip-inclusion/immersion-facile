import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  SubscriptionParams,
  expectToEqual,
} from "shared";
import { SavedError } from "../../saved-errors/ports/SavedErrorRepository";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { ApiConsumerBuilder } from "../adapters/InMemoryApiConsumerRepository";
import {
  CallbackParams,
  InMemorySubscribersGateway,
} from "../adapters/InMemorySubscribersGateway";
import { SubscriberResponse } from "../ports/SubscribersGateway";
import { BroadcastToPartnersOnConventionUpdates } from "./BroadcastToPartnersOnConventionUpdates";

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

const subscriptionParams: SubscriptionParams = {
  callbackHeaders: { authorization: "my-cb-auth-header" },
  callbackUrl: "https://www.my-service.com/convention-updated",
};

const apiConsumer1 = new ApiConsumerBuilder()
  .withId("my-api-consumer1")
  .withConventionRight({
    kinds: ["SUBSCRIPTION"],
    scope: { agencyIds: [agency1.id] },
    subscriptions: [
      {
        ...subscriptionParams,
        subscribedEvent: "convention.updated",
        createdAt: new Date().toISOString(),
        id: "my-subscription-id",
      },
    ],
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
    subscriptions: [
      {
        ...callbackParams2,
        subscribedEvent: "convention.updated",
        createdAt: new Date().toISOString(),
        id: "my-subscription-id",
      },
    ],
  })
  .build();

const apiConsumerWithoutSubscription = new ApiConsumerBuilder()
  .withId("my-api-consumer-without-subscription")
  .withConventionRight({
    kinds: ["SUBSCRIPTION"],
    scope: { agencyIds: [agency1.id, agency2.id] },
    subscriptions: [],
  })
  .build();

const apiConsumerNotAllowedToBeNotified = new ApiConsumerBuilder()
  .withId("my-api-consumer-not-allowed")
  .withConventionRight({
    kinds: ["READ"],
    scope: { agencyIds: [agency1.id] },
    subscriptions: [
      {
        ...subscriptionParams,
        subscribedEvent: "convention.updated",
        createdAt: new Date().toISOString(),
        id: "my-subscription-id",
      },
    ],
  })
  .build();

describe("Broadcast to partners on updated convention", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let subscribersGateway: InMemorySubscribersGateway;
  let broadcastUpdatedConvention: BroadcastToPartnersOnConventionUpdates;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    subscribersGateway = new InMemorySubscribersGateway();
    timeGateway = new CustomTimeGateway();

    broadcastUpdatedConvention = new BroadcastToPartnersOnConventionUpdates(
      uowPerformer,
      subscribersGateway,
      timeGateway,
    );
  });

  it("broadcast updated convention", async () => {
    uow.agencyRepository.setAgencies([agency1, agency2]);
    uow.conventionRepository.setConventions([convention1, convention2]);

    uow.apiConsumerRepository.consumers = [
      apiConsumer1,
      apiConsumer2,
      apiConsumerNotAllowedToBeNotified,
      apiConsumerWithoutSubscription,
    ];

    await broadcastUpdatedConvention.execute({ convention: convention1 });

    const expectedCallsAfterFirstExecute: CallbackParams[] = [
      {
        body: {
          subscribedEvent: "convention.updated",
          payload: {
            convention: {
              ...convention1,
              agencyName: agency1.name,
              agencyDepartment: agency1.address.departmentCode,
              agencyKind: agency1.kind,
              agencySiret: agency1.agencySiret,
              agencyCounsellorEmails: agency1.counsellorEmails,
              agencyValidatorEmails: agency1.validatorEmails,
            },
          },
        },
        subscriptionParams,
      },
    ];

    expectToEqual(subscribersGateway.calls, expectedCallsAfterFirstExecute);

    await broadcastUpdatedConvention.execute({ convention: convention2 });

    const expectedCallsAfterSecondExecute: CallbackParams[] = [
      ...expectedCallsAfterFirstExecute,
      {
        body: {
          subscribedEvent: "convention.updated",
          payload: {
            convention: {
              ...convention2,
              agencyName: agency2.name,
              agencyDepartment: agency2.address.departmentCode,
              agencyKind: agency2.kind,
              agencySiret: agency2.agencySiret,
              agencyCounsellorEmails: agency2.counsellorEmails,
              agencyValidatorEmails: agency2.validatorEmails,
            },
          },
        },
        subscriptionParams: {
          callbackHeaders: callbackParams2.callbackHeaders,
          callbackUrl: callbackParams2.callbackUrl,
        },
      },
    ];

    expectToEqual(subscribersGateway.calls, expectedCallsAfterSecondExecute);
  });

  it("save webhook error", async () => {
    uow.agencyRepository.setAgencies([agency1]);
    uow.conventionRepository.setConventions([convention1]);

    uow.apiConsumerRepository.consumers = [apiConsumer1];

    const now = new Date("2024-03-04T10:00:00Z");
    timeGateway.setNextDate(now);

    const errorResponse: SubscriberResponse = {
      title: "Partner subscription errored",
      callbackUrl: "http://fake.com",
      conventionStatus: "ACCEPTED_BY_VALIDATOR",
      conventionId: "lala",
      status: 200,
      message: "ca va très mal",
    };

    subscribersGateway.simulatedResponse = errorResponse;

    await broadcastUpdatedConvention.execute({ convention: convention1 });

    const expectedSavedError: SavedError = {
      serviceName: "BroadcastToPartnersOnConventionUpdates",
      occurredAt: now,
      message: errorResponse.message,
      params: {
        httpStatus: errorResponse.status,
        conventionId: errorResponse.conventionId,
        conventionStatus: errorResponse.conventionStatus,
        callbackUrl: errorResponse.callbackUrl,
      },
      handledByAgency: false,
    };

    expectToEqual(uow.errorRepository.savedErrors, [expectedSavedError]);
  });
});
