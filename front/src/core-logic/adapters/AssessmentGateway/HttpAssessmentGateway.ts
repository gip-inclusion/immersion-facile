import { from, Observable } from "rxjs";
import { match, P } from "ts-pattern";
import { ConventionMagicLinkRoutes } from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";

export class HttpAssessmentGateway implements AssessmentGateway {
  constructor(
    private readonly httpClient: HttpClient<ConventionMagicLinkRoutes>,
  ) {}

  public createAssessment$({
    jwt,
    assessment,
  }: AssessmentAndJwt): Observable<void> {
    return from(
      this.httpClient
        .createAssessment({
          headers: { authorization: jwt },
          body: assessment,
        })
        .then((response) =>
          match(response)
            .with({ status: 201 }, () => undefined)
            .with({ status: P.union(400, 401, 403) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
