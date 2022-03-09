// This test need the env var DISCORD_WEBHOOK_URL to be set.

import {
  notifyAndThrowErrorDiscord,
  notifyErrorDiscord,
} from "../../utils/notifyDiscord";

describe("Notify Discord", () => {
  it("Should serialize the thrown Error and notify channel dev-error channel", async () => {
    try {
      throw new SyntaxError("Invalid syntax for action !");
    } catch (e: any) {
      notifyErrorDiscord(e);
    }
  });

  it("Should serialize the thrown Error, notify channel dev-error channel and throw Error", async () => {
    try {
      throw new SyntaxError("Invalid syntax for action !");
    } catch (e: any) {
      notifyAndThrowErrorDiscord(e);
    }
  });
});
