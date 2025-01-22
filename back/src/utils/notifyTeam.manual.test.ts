// This test need the env var DISCORD_WEBHOOK_URL to be set.

import { DomainEvent } from "../domains/core/events/events";
import { notifyObjectToTeam, notifyToTeamAndThrowError } from "./notifyTeam";

describe("Notify Team", () => {
  it("Should serialize the thrown Error and notify channel dev-error channel", () => {
    try {
      throw new SyntaxError("TEST NOTIFICATION - Invalid syntax for action !");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(SyntaxError);
      notifyObjectToTeam(e as Error);
    }
  });

  it("Should serialize an object like Domain Event", () => {
    const domainEvent: DomainEvent = {
      id: "000112256465465465456",
      occurredAt: new Date().toISOString(),
      payload: {
        internshipKind: "immersion",
        emails: ["test@mail.com"],
        magicLink: "http://0000magicLink00000",
        conventionStatusLink: "http://0000conventionStatusLink00000",
        conventionId: "123",
        triggeredBy: null,
      },
      status: "failed-but-will-retry",
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
    notifyObjectToTeam({
      event: domainEvent,
      message: "TEST NOTIFICATION - test message with domain event",
    });
    expect(true).toBe(true);
  });

  it("Should serialize the thrown Error, notify channel dev-error channel and throw Error", () => {
    try {
      throw new SyntaxError("TEST NOTIFICATION - Invalid syntax for action !");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(SyntaxError);

      expect(() => notifyToTeamAndThrowError(e as Error)).toThrow();
    }
  });
});
