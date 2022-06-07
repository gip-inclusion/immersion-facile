import axios, { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { immersionAssessmentRoute } from "shared/src/routes";
import {
  AssessmentAndJwt,
  ImmersionAssessmentGateway,
} from "src/core-logic/ports/ImmersionAssessmentGateway";

const prefix = "api";

export class HttpImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  private axiosInstance: AxiosInstance;

  constructor(baseURL = `/${prefix}`) {
    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  createAssessment({ jwt, assessment }: AssessmentAndJwt): Observable<void> {
    return from(
      this.axiosInstance
        .post<void>(`/auth/${immersionAssessmentRoute}`, assessment, {
          headers: { Authorization: jwt },
        })
        .then(({ data }) => data),
    );
  }
}
