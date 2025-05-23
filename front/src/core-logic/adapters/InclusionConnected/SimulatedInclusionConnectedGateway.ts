import { type Observable, Subject, delay, of, throwError } from "rxjs";
import {
  type AbsoluteUrl,
  type AgencyId,
  DiscussionBuilder,
  type DiscussionReadDto,
  type DiscussionRejected,
  type InclusionConnectedUser,
  type MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import type {
  FetchDiscussionRequestedPayload,
  SendMessageRequestedPayload,
} from "src/core-logic/domain/discussion/discussion.slice";
import type { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

const simulatedUserConnected: InclusionConnectedUser = {
  email: "fake@user.com",
  firstName: "Fake",
  lastName: "User",
  id: "fake-user-id",
  agencyRights: [],
  dashboards: { agencies: {}, establishments: {} },
  proConnect: {
    externalId: "fake-user-external-id",
    siret: "00000000000000",
  },
  createdAt: new Date().toISOString(),
  isBackofficeAdmin: true,
};

export const nonExisitingAgencyId: AgencyId = "not-found-agency-id";

export class SimulatedInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  constructor(private simulatedLatency = 0) {}

  getDiscussionById$(
    _payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined> {
    return of(new DiscussionBuilder().buildRead()).pipe(
      delay(this.simulatedLatency),
    );
  }

  public getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return of(simulatedUserConnected);
  }

  public getLogoutUrl$(): Observable<AbsoluteUrl> {
    return of("http://fake-logout.com");
  }

  public markPartnersErroredConventionAsHandled$(
    _params: MarkPartnersErroredConventionAsHandledRequest,
    _jwt: string,
  ): Observable<void> {
    return this.markPartnersErroredConventionAsHandledResult$;
  }

  public registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    _token: string,
  ): Observable<void> {
    const agencyIdInError = agencyIds.findIndex(
      (id) => id === nonExisitingAgencyId,
    );
    return agencyIdInError > 0
      ? throwError(
          new Error(`Agency Id ${agencyIds[agencyIdInError]} not found`),
        )
      : of(undefined).pipe(delay(this.simulatedLatency));
  }

  public updateDiscussionStatus$(
    _payload: {
      jwt: string;
      discussionId: string;
    } & DiscussionRejected,
  ): Observable<void> {
    return of(undefined).pipe(delay(this.simulatedLatency));
  }

  public sendMessage$(_payload: SendMessageRequestedPayload): Observable<void> {
    return of(undefined).pipe(delay(this.simulatedLatency));
  }
}
