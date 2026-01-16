// This test need the env var DISCORD_WEBHOOK_URL to be set.

import type { DomainEvent } from "../domains/core/events/events";
import {
  notifyErrorObjectToTeam,
  notifyToTeamAndThrowError,
} from "./notifyTeam";

describe("Notify Team", () => {
  it("Should serialize the thrown Error and notify channel dev-error channel", () => {
    try {
      throw new SyntaxError("TEST NOTIFICATION - Invalid syntax for action !");
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(SyntaxError);
      notifyErrorObjectToTeam(e as Error);
    }
  });

  it("Should serialize an object like Domain Event", () => {
    const domainEvent: DomainEvent = {
      id: "000112256465465465456",
      occurredAt: new Date().toISOString(),
      payload: {
        agencyId: "0000",
        triggeredBy: { kind: "connected-user", userId: "0001" },
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
      topic: "AgencyActivated",
      wasQuarantined: false,
    };
    notifyErrorObjectToTeam({
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
