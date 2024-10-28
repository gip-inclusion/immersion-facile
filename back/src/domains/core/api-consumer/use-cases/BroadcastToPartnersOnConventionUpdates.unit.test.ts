import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  SubscriptionParams,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { toAgencyWithRights } from "../../../../utils/agency";
import { BroadcastFeedback } from "../../saved-errors/ports/BroadcastFeedbacksRepository";
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

describe("Broadcast to partners on updated convention", () => {
  const counsellor1 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("counsellor1@email.com")
    .buildUser();
  const counsellor2 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("counsellor2@email.com")
    .buildUser();
  const counsellor3 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("counsellor3@email.com")
    .buildUser();
  const validator1 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("validator1@email.com")
    .buildUser();
  const validator2 = new InclusionConnectedUserBuilder()
    .withId(uuid())
    .withEmail("validator2@email.com")
    .buildUser();

  const agency1 = toAgencyWithRights(
    new AgencyDtoBuilder().withId("agency-1").build(),
    {
      [counsellor1.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
      [validator1.id]: { roles: ["validator"], isNotifiedByEmail: false },
    },
  );
  const agency2 = toAgencyWithRights(
    new AgencyDtoBuilder().withId("agency-2").build(),
    {
      [counsellor2.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
      [validator2.id]: { roles: ["validator"], isNotifiedByEmail: false },
    },
  );

  const agencyWithRefersTo = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("agency-with-refers-to")
      .withKind("autre")
      .withRefersToAgencyInfo({
        refersToAgencyId: agency1.id,
        refersToAgencyName: agency1.name,
      })
      .build(),
    {
      [counsellor3.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
      [validator1.id]: { roles: ["validator"], isNotifiedByEmail: false },
    },
  );

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
    uow.userRepository.users = [
      counsellor1,
      counsellor2,
      counsellor3,
      validator1,
      validator2,
    ];
    uow.agencyRepository.agencies = [agency1, agency2, agencyWithRefersTo];
  });

  it("broadcast updated convention to agency only", async () => {
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
              agencyCounsellorEmails: [counsellor1.email],
              agencyValidatorEmails: [validator1.email],
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
              agencyCounsellorEmails: [counsellor2.email],
              agencyValidatorEmails: [validator2.email],
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
      subscriberErrorFeedback: { message: "ca va très mal" },
      body: { success: true },
    };

    subscribersGateway.simulatedResponse = errorResponse;

    await broadcastUpdatedConvention.execute({ convention: convention1 });

    const expectedBroadcastFeedback: BroadcastFeedback = {
      consumerId: apiConsumer1.id,
      consumerName: apiConsumer1.name,
      handledByAgency: false,
      subscriberErrorFeedback: errorResponse.subscriberErrorFeedback,
      occurredAt: now,
      requestParams: {
        callbackUrl: errorResponse.callbackUrl,
        conventionId: errorResponse.conventionId,
        conventionStatus: errorResponse.conventionStatus,
      },
      ...(errorResponse.status
        ? {
            response: {
              httpStatus: errorResponse.status,
              body: errorResponse.body,
            },
          }
        : {}),
      serviceName: "BroadcastToPartnersOnConventionUpdates",
    };

    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      expectedBroadcastFeedback,
    ]);
  });

  it("save feedback success", async () => {
    uow.conventionRepository.setConventions([convention1]);
    uow.apiConsumerRepository.consumers = [apiConsumer1];

    const now = new Date("2024-03-04T10:00:00Z");
    timeGateway.setNextDate(now);

    const successResponse: SubscriberResponse = {
      title: "Partner subscription notified successfully",
      callbackUrl: "http://fake.com",
      conventionStatus: "ACCEPTED_BY_VALIDATOR",
      conventionId: "lala",
      status: 200,
      body: { success: true },
    };

    subscribersGateway.simulatedResponse = successResponse;

    await broadcastUpdatedConvention.execute({ convention: convention1 });

    const expectedBroadcastFeedback: BroadcastFeedback = {
      consumerId: apiConsumer1.id,
      consumerName: apiConsumer1.name,
      handledByAgency: false,
      occurredAt: now,
      requestParams: {
        callbackUrl: successResponse.callbackUrl,
        conventionId: successResponse.conventionId,
        conventionStatus: successResponse.conventionStatus,
      },
      ...(successResponse.status
        ? {
            response: {
              httpStatus: successResponse.status,
              body: successResponse.body,
            },
          }
        : {}),
      serviceName: "BroadcastToPartnersOnConventionUpdates",
    };

    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      expectedBroadcastFeedback,
    ]);
  });

  it("broadcast updated convention to agency and agency refered to ", async () => {
    const agencyWithRefersTo = new AgencyDtoBuilder()
      .withId("agency-with-refers-to")
      .withKind("autre")
      .withRefersToAgencyInfo({
        refersToAgencyId: agency1.id,
        refersToAgencyName: agency1.name,
      })
      .build();

    const conventionFromAgencyWithRefersTo = new ConventionDtoBuilder()
      .withId("11111111-ee70-4c90-b3f4-668d492f7397")
      .withAgencyId(agencyWithRefersTo.id)
      .build();

    const apiConsumerWithSubscriptionOnAgencyWithReferesTo =
      new ApiConsumerBuilder()
        .withId("my-api-consumer-with-subscription-on-agency-with-referes-to")
        .withConventionRight({
          kinds: ["SUBSCRIPTION"],
          scope: { agencyIds: [agencyWithRefersTo.id] },
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

    uow.conventionRepository.setConventions([conventionFromAgencyWithRefersTo]);
    uow.apiConsumerRepository.consumers = [
      apiConsumer1,
      apiConsumerWithSubscriptionOnAgencyWithReferesTo,
      apiConsumerNotAllowedToBeNotified,
      apiConsumerWithoutSubscription,
    ];

    await broadcastUpdatedConvention.execute({
      convention: conventionFromAgencyWithRefersTo,
    });

    const expectedCallsAfterFirstExecute: CallbackParams[] = [
      {
        body: {
          subscribedEvent: "convention.updated",
          payload: {
            convention: {
              ...conventionFromAgencyWithRefersTo,
              agencyName: agencyWithRefersTo.name,
              agencyDepartment: agencyWithRefersTo.address.departmentCode,
              agencyKind: agencyWithRefersTo.kind,
              agencySiret: agencyWithRefersTo.agencySiret,
              agencyCounsellorEmails: [counsellor3.email],
              agencyValidatorEmails: [validator1.email],
              agencyRefersTo: {
                id: agency1.id,
                kind: agency1.kind,
                name: agency1.name,
              },
            },
          },
        },
        subscriptionParams,
      },
      {
        body: {
          subscribedEvent: "convention.updated",
          payload: {
            convention: {
              ...conventionFromAgencyWithRefersTo,
              agencyName: agencyWithRefersTo.name,
              agencyDepartment: agencyWithRefersTo.address.departmentCode,
              agencyKind: agencyWithRefersTo.kind,
              agencySiret: agencyWithRefersTo.agencySiret,
              agencyCounsellorEmails: [counsellor3.email],
              agencyValidatorEmails: [validator1.email],
              agencyRefersTo: {
                id: agency1.id,
                kind: agency1.kind,
                name: agency1.name,
              },
            },
          },
        },
        subscriptionParams,
      },
    ];

    expectToEqual(subscribersGateway.calls, expectedCallsAfterFirstExecute);
  });
});
