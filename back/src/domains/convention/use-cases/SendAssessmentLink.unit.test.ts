describe("SendAssessmentLink", () => {

  describe("wrong paths", () => {

    it("throws bad request if requested convention does not match the one in jwt", async () => {
    });

    it("throws not found if convention does not exist", async () => {
    });

    it("throws bad request if status is not ACCEPTED_BY_VALIDATOR", () => {

    });

    it("throws bad request if immersion ends in more than 1 day", () => {

    });

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
      });
  
      it("throws unauthorized if user has no rights on agency", async () => {
      });

      it("throws unauthorized if signatory has no rights on convention", async () => {
      });
    });
    
    describe("from magiclink", () => {
  
      it("throws unauthorized if user has no actual rights on agency", async () => {
      });

      it("throws unauthorized if signatory has no rights on convention", async () => {
      });

      it(`throws too many requests if there was already a signature link sent less than ${MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER} hours before`, async () => {
      });
    });
  });

  describe("right paths: send assessment link", () => {
    it.each(["agency-viewer", "validator", "counsellor", "agency-admin"] as const)("when agency user %s triggers it", () => {

    });

    it.each(["beneficiary", "establishment-representative", "beneficiary-current-employer", "beneficiary-representative"] as const)("when signatory %s triggers it", () => {

    });
  });
});