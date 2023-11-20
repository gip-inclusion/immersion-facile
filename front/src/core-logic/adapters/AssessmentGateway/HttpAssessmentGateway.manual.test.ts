import { firstValueFrom } from "rxjs";
import { AssessmentDto, createManagedAxiosInstance } from "shared";
import { AssessmentGateway } from "src/core-logic/ports/AssessmentGateway";
import { HttpAssessmentGateway } from "./HttpAssessmentGateway";
import {
  failedId,
  failedIdError,
  SimulatedAssessmentGateway,
} from "./SimulatedAssessmentGateway";

const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  expectedError: Error,
) => {
  await expect(promise).rejects.toThrow(expectedError);
};

const simulated = new SimulatedAssessmentGateway();
const http = new HttpAssessmentGateway(
  createManagedAxiosInstance({ baseURL: "http://localhost:1234" }),
);

const assessmentGateways: AssessmentGateway[] = [simulated, http];

const failedAssessment: AssessmentDto = {
  conventionId: failedId,
  status: "ABANDONED",
  establishmentFeedback: "",
};
const jwt = "UNKNOWN";

assessmentGateways.forEach((assessmentGateway) => {
  describe(`${assessmentGateway.constructor.name} - manual`, () => {
    it("createAssessment - Failure", async () => {
      await expectPromiseToFailWithError(
        firstValueFrom(
          assessmentGateway.createAssessment({
            assessment: failedAssessment,
            jwt,
          }),
        ),
        assessmentGateway.constructor.name === "HttpAssessmentGateway"
          ? new Error("Request failed with status code 401")
          : failedIdError,
      );
    });
  });
});
