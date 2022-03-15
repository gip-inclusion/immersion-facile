// This test need the env var DISCORD_WEBHOOK_URL to be set.

import {
  notifyAndThrowErrorDiscord,
  notifyErrorDiscord,
} from "../../utils/notifyDiscord";

describe("Notify Discord", () => {
  it("Should serialize the thrown Error and notify channel dev-error channel", async () => {
    try {
      throw new SyntaxError("Invalid syntax for action !");
    } catch (e: unknown) {
      //eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(SyntaxError);
      notifyErrorDiscord(e as Error);
    }
  });

  it("Should serialize the thrown Error, notify channel dev-error channel and throw Error", async () => {
    try {
      throw new SyntaxError("Invalid syntax for action !");
    } catch (e: unknown) {
      //eslint-disable-next-line jest/no-conditional-expect
      expect(e).toBeInstanceOf(SyntaxError);
      notifyAndThrowErrorDiscord(e as Error);
    }
  });
});
