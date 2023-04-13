import { firstValueFrom } from "rxjs";

import { createManagedAxiosInstance, ImmersionAssessmentDto } from "shared";

import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";

import { HttpImmersionAssessmentGateway } from "./HttpImmersionAssessmentGateway";
import {
  failedId,
  failedIdError,
  SimulatedImmersionAssessmentGateway,
} from "./SimulatedImmersionAssessmentGateway";

const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  expectedError: Error,
) => {
  await expect(promise).rejects.toThrow(expectedError);
};

const simulated = new SimulatedImmersionAssessmentGateway();
const http = new HttpImmersionAssessmentGateway(
  createManagedAxiosInstance({ baseURL: "http://localhost:1234" }),
);

const immersionAssessmentGateways: ImmersionAssessmentGateway[] = [
  simulated,
  http,
];

const successImmersionAssessment: ImmersionAssessmentDto = {
  conventionId: "0000000",
  status: "ABANDONED",
  establishmentFeedback: "",
};
const failedImmersionAssessment: ImmersionAssessmentDto = {
  conventionId: failedId,
  status: "ABANDONED",
  establishmentFeedback: "",
};
const jwt = "UNKNOWN";

immersionAssessmentGateways.forEach((assessmentGateway) => {
  describe(`${assessmentGateway.constructor.name} - manual`, () => {
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("createAssessment - Success", async () => {
      const response = await firstValueFrom(
        assessmentGateway.createAssessment({
          assessment: successImmersionAssessment,
          jwt,
        }),
      );
      expect(response).toBeUndefined();
    });

    it("createAssessment - Failure", async () => {
      await expectPromiseToFailWithError(
        firstValueFrom(
          assessmentGateway.createAssessment({
            assessment: failedImmersionAssessment,
            jwt,
          }),
        ),
        assessmentGateway.constructor.name === "HttpImmersionAssessmentGateway"
          ? new Error("Request failed with status code 401")
          : failedIdError,
      );
    });
  });
});
