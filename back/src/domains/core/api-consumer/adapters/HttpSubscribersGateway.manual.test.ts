import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  AbsoluteUrl,
  ConventionDtoBuilder,
  ConventionReadDto,
  SubscriptionParams,
  expectObjectsToMatch,
} from "shared";
import { ConventionUpdatedSubscriptionCallbackBody } from "../ports/SubscribersGateway";
import { HttpSubscribersGateway } from "./HttpSubscribersGateway";

describe("HttpSubscribersGateway", () => {
  let httpSubscribersGateway: HttpSubscribersGateway;
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
  ): SubscriptionParams => {
    return {
      callbackUrl,
      callbackHeaders: {
        authorization: "my-cb-auth-header",
      },
    };
  };

  it("send notification", async () => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    const callbackUrl = "https://jsonplaceholder.typicode.com/posts";

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectObjectsToMatch(response, {
      callbackUrl,
      status: 201,
    });
  });

  it("throws error axios timeout", async () => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    const callbackUrl = "https://fake-callback-url.fr";
    const mock = new MockAdapter(axios);

    mock.onPost(callbackUrl).timeout();

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectObjectsToMatch(response, {
      callbackUrl,
      status: undefined,
      subscriberErrorFeedback: {
        message: "timeout of 0ms exceeded",
      },
    });
  });

  it("consumer api returns an error", async () => {
    httpSubscribersGateway = new HttpSubscribersGateway(axios);
    const callbackUrl = "https://fake-callback-url.fr";
    const mock = new MockAdapter(axios);

    mock.onPost(callbackUrl).reply(500, "Custom server error");

    const response = await httpSubscribersGateway.notify(
      subscriptionBody,
      makeSubscriptionParams(callbackUrl),
    );

    expectObjectsToMatch(response, {
      callbackUrl,
      status: 500,
      subscriberErrorFeedback: {
        message: "Custom server error",
      },
    });
  });
});
