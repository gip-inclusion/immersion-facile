import { expectToEqual } from "../test.helpers";
import type { ShareConventionLinkByEmailDto } from "./shareConventionLinkByEmail.dto";
import { shareConventionLinkByEmailSchema } from "./shareConventionLinkByEmail.schema";

describe("shareConventionLinkByEmailSchema schema validation", () => {
  it("accepts valid data", () => {
    const data: ShareConventionLinkByEmailDto = {
      senderEmail: "test@test.com",
      details: "",
      recipientEmail: "",
      convention: {},
    };

    expectToEqual(shareConventionLinkByEmailSchema.parse(data), data);
  });
});
