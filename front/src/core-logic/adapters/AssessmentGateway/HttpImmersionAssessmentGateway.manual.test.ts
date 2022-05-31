import { firstValueFrom } from "rxjs";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { ImmersionAssessmentGateway } from "src/core-logic/ports/ImmersionAssessmentGateway";
import { HttpImmersionAssessmentGateway } from "./HttpImmersionAssessmentGateway";
import {
  failedId,
  failedIdError,
  SimulateImmersionAssessmentGateway,
} from "./SimulateImmersionAssessmentGateway";

/*

******** ADR ***************
2022/05/31 - Do not resolve HTTP gateway success automated testing since generate valid JWT on backend takes time 

*/

const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  expectedError: Error,
) => {
  await expect(promise).rejects.toThrow(expectedError);
};

const simulated = new SimulateImmersionAssessmentGateway();
const http = new HttpImmersionAssessmentGateway("http://localhost:1234");

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
const jwt = "toto";

immersionAssessmentGateways.forEach((assessmentGateway) => {
  describe(`${assessmentGateway.constructor.name} - manual`, () => {
    it("createAssessment - Success", async () => {
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
