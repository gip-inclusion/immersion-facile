import { AgencyDtoBuilder } from "shared";
import { createLogger } from "./logger";

describe("Test logger 2", () => {
  const logger = createLogger("filename");
  // const legacyCreateLog = legacyCreateLogger("filename");

  it("test log", () => {
    const agency = new AgencyDtoBuilder().build();

    logger.info({
      agencyId: agency.id,
      message: "test message",
    });
    // legacyCreateLog.info({ agency }, "toto message");
    // legacyLogger.info({ agency });

    expect(true).toBe(true);
  });
});
