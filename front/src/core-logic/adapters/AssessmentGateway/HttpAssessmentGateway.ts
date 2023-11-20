import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { assessmentRoute } from "shared";
import {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class HttpAssessmentGateway implements AssessmentGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public createAssessment({
    jwt,
    assessment,
  }: AssessmentAndJwt): Observable<void> {
    return from(
      this.httpClient
        .post<void>(`/auth/${assessmentRoute}`, assessment, {
          headers: { Authorization: jwt },
        })
        .then(({ data }) => data),
    );
  }
}
