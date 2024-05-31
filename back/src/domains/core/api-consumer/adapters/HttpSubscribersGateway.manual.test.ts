import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  AbsoluteUrl,
  ConventionDtoBuilder,
  ConventionReadDto,
  SubscriptionParams,
  expectToEqual,
} from "shared";
import { ConventionUpdatedSubscriptionCallbackBody } from "../ports/SubscribersGateway";
import { HttpSubscribersGateway } from "./HttpSubscribersGateway";

describe("HttpSubscribersGateway", () => {
  let httpSubscribersGateway: HttpSubscribersGateway;
  let mock: MockAdapter;

  const conventionReadDto: ConventionReadDto = {
    ...new ConventionDtoBuilder().build(),
    agencyName: "Agence de test",
    agencyDepartment: "75",
    agencyKind: "mission-locale",
    agencySiret: "11112222000033",
    agencyCounsellorEmails: [],
    agencyValidatorEmails: ["validator@mail.com"],
    agencyRefersTo: undefined,
  };

  const subscriptionBody: ConventionUpdatedSubscriptionCallbackBody = {
    payload: { convention: conventionReadDto },
    subscribedEvent: "convention.updated",
  };

  const makeSubscriptionParams = (
    callbackUrl: AbsoluteUrl,
  ): SubscriptionParams => ({
    callbackUrl,
    callbackHeaders: {
      authorization: "my-cb-auth-header",
    },
  });

  beforeEach(() => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    mock = new MockAdapter(axios);
  });

  it("send notification", async () => {
    const callbackUrl = "https://jsonplaceholder.typicode.com/posts";

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: conventionReadDto.id,
      conventionStatus: conventionReadDto.status,
      callbackUrl,
      status: 201,
      title: "Partner subscription notified successfully",
    });
  });

  it("throws error axios timeout", async () => {
    const callbackUrl = "https://fake-callback-url.fr";

    mock.onPost(callbackUrl).timeout();

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: conventionReadDto.id,
      conventionStatus: conventionReadDto.status,
      callbackUrl,
      status: undefined,
      title: "Partner subscription errored",
      subscriberErrorFeedback: {
        message: "timeout of 0ms exceeded",
        error: new Error("timeout of 0ms exceeded"),
      },
    });
  });

  it("consumer api returns an string error", async () => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    const callbackUrl = "https://fake-callback-url.fr";
    const mock = new MockAdapter(axios);

    mock.onPost(callbackUrl).reply(500, "Custom server error");

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: conventionReadDto.id,
      conventionStatus: conventionReadDto.status,
      callbackUrl,
      status: 500,
      title: "Partner subscription errored",
      subscriberErrorFeedback: {
        message: "Custom server error",
        error: new Error("Request failed with status code 500"),
      },
    });
  });

  it("consumer api returns an object error with message property", async () => {
    const callbackUrl = "https://fake-callback-url.fr";

    mock.onPost(callbackUrl).reply(500, { message: "Custom server error" });

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: conventionReadDto.id,
      conventionStatus: conventionReadDto.status,
      callbackUrl,
      status: 500,
      title: "Partner subscription errored",
      subscriberErrorFeedback: {
        message: "Custom server error",
        error: new Error("Request failed with status code 500"),
      },
    });
  });

  it("consumer api returns an object error with no message property", async () => {
    const callbackUrl = "https://fake-callback-url.fr";

    mock.onPost(callbackUrl).reply(500, { msg: "Custom server error" });

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: subscriptionBody.payload.convention.id,
      conventionStatus: subscriptionBody.payload.convention.status,
      callbackUrl,
      status: 500,
      title: "Partner subscription errored",
      subscriberErrorFeedback: {
        message: "Pas d'informations mais des données techniques disponibles",
        error: new Error("Request failed with status code 500"),
      },
    });
  });

  it("consumer api returns no response body", async () => {
    const callbackUrl = "https://fake-callback-url.fr";

    mock.onPost(callbackUrl).reply(500);

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectToEqual(response, {
      conventionId: subscriptionBody.payload.convention.id,
      conventionStatus: subscriptionBody.payload.convention.status,
      callbackUrl,
      status: 500,
      title: "Partner subscription errored",
      subscriberErrorFeedback: {
        message: "Pas d'informations mais des données techniques disponibles",
        error: new Error("Request failed with status code 500"),
      },
    });
  });
});
