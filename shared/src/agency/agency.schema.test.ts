import {
  type AgencyStatus,
  activeAgencyStatuses,
  closedOrRejectedAgencyStatuses,
} from "..";
import { AgencyDtoBuilder } from "./AgencyDtoBuilder";
import { agencySchema } from "./agency.schema";

describe("agencySchema", () => {
  describe("statusJustification", () => {
    it.each([...activeAgencyStatuses, "needsReview"] as AgencyStatus[])(
      "is null if the agency is %s",
      (status) => {
        const agency = new AgencyDtoBuilder()
          .withValidatorEmails(["validator@mail.com"])
          .withStatus(status)
          .withStatusJustification(null)
          .build();

        const result = agencySchema.safeParse(agency);

        expect(result.success).toBe(true);
      },
    );

    it.each([closedOrRejectedAgencyStatuses])(
      "should not be empty if the agency is %s",
      (status) => {
        const agency = new AgencyDtoBuilder()
          .withValidatorEmails(["validator@mail.com"])
          .withStatus(status)
          .withStatusJustification(null)
          .build();

        const result = agencySchema.safeParse(agency);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe(
          "Une agence inactive doit avoir une justification",
        );

        const retryResult = agencySchema.safeParse({
          ...agency,
          statusJustification: "test",
        });
        expect(retryResult.success).toBe(true);
      },
    );
  });
});
