import { AgencyDtoBuilder } from "shared";
import { createLogger } from "./logger";

describe("Test logger 2", () => {
  const logger = createLogger("filename");

  it("test log", () => {
    const agency = new AgencyDtoBuilder().build();

    logger.info({
      agencyId: agency.id,
      message: "test message",
    });

    expect(true).toBe(true);
  });
});
