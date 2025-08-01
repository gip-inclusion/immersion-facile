import { from, type Observable } from "rxjs";
import {
  type AssessmentDto,
  type ConventionId,
  type ConventionMagicLinkRoutes,
  type ConventionSupportedJwt,
  errors,
  type LegacyAssessmentDto,
  type WithConventionId,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
  throwTooManyRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type {
  AssessmentAndJwt,
  AssessmentGateway,
} from "src/core-logic/ports/AssessmentGateway";
import { match, P } from "ts-pattern";

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
  }: {
    conventionId: ConventionId;
    jwt: string;
  }): Observable<AssessmentDto | LegacyAssessmentDto> {
    return from(
      this.httpClient
        .getAssessmentByConventionId({
          headers: { authorization: jwt },
          urlParams: { conventionId },
        })
        .then((response) => {
          return match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 404, body: { message: P.not(P.nullish) } }, () => {
              throw errors.assessment.notFound(conventionId);
            })
            .with({ status: P.union(400, 401, 403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow);
        }),
    );
  }

  public sendAssessmentLink$(
    params: WithConventionId,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .sendAssessmentLink({
          headers: { authorization: jwt },
          body: params,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 429 }, throwTooManyRequestWithExplicitMessage)
            .with({ status: P.union(403, 401, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
