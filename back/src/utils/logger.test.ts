import { createLogger, legacyCreateLogger } from "./logger";
import { AgencyDtoBuilder } from "shared";

describe("Test logger 2", () => {
  const logger = createLogger("filename");
  const legacyCreateLog = legacyCreateLogger("filename");

  it("test log", () => {
    const agency = new AgencyDtoBuilder().build();

    logger.info({
      agency: { name: "toto", id: "agency-id" },
      message: "test message",
    });
    // legacyCreateLog.info({ agency }, "toto message");
    // legacyLogger.info({ agency });

    expect(true).toBe(true);
  });
});
