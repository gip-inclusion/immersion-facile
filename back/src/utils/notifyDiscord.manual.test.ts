// This test need the env var DISCORD_WEBHOOK_URL to be set.

import { DomainEvent } from "../domain/core/eventBus/events";
import {
  notifyAndThrowErrorDiscord,
  notifyObjectDiscord,
} from "./notifyDiscord";

describe("Notify Discord", () => {
  it("Should serialize the thrown Error and notify channel dev-error channel", () => {
    try {
      throw new SyntaxError(
        "TESTING NOTIFY DISCORD - Invalid syntax for action !",
      );
    } catch (e: unknown) {
      //eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(SyntaxError);
      notifyObjectDiscord(e as Error);
    }
  });

  it("Should serialize an object like Domain Event", () => {
    const domainEvent: DomainEvent = {
      id: "000112256465465465456",
      occurredAt: new Date().toISOString(),
      payload: {
        emails: ["test@mail.com"],
        magicLink: "http://0000magicLink00000",
      },
      publications: [
        {
          publishedAt: new Date().toISOString(),
          failures: [
            {
              errorMessage: "Error message on subscription failure",
              subscriptionId: "352ds4f6s5d4fs6d5f4sd65f4",
            },
          ],
        },
      ],
      topic: "MagicLinkRenewalRequested",
      wasQuarantined: false,
    };
    notifyObjectDiscord({
      event: domainEvent,
      message: "TESTING NOTIFY DISCORD - test message with domain event",
    });
    expect(true).toBe(true);
  });

  it("Should serialize the thrown Error, notify channel dev-error channel and throw Error", () => {
    try {
      throw new SyntaxError(
        "TESTING NOTIFY DISCORD - Invalid syntax for action !",
      );
    } catch (e: unknown) {
      //eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(SyntaxError);
      //eslint-disable-next-line jest/no-conditional-expect
      expect(() => notifyAndThrowErrorDiscord(e as Error)).toThrow();
    }
  });
});
