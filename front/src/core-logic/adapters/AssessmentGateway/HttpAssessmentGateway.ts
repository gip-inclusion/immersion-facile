import { Observable, from } from "rxjs";
import {
  AssessmentDto,
  ConventionId,
  ConventionMagicLinkRoutes,
  messageAndIssuesToString,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";
import { P, match } from "ts-pattern";

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
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getAssessment$({
    conventionId,
    jwt,
  }: { conventionId: ConventionId; jwt: string }): Observable<AssessmentDto> {
    return from(
      this.httpClient
        .getAssessment({
          headers: { authorization: jwt },
          urlParams: { conventionId },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 404 }, () => {
              const errorMessage = messageAndIssuesToString({
                message: "Le bilan a déjà été rempli",
              });
              throw new Error(errorMessage);
            })
            .with({ status: P.union(400, 401, 403) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
