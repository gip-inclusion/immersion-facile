import { type Observable, Subject } from "rxjs";
import type {
  AbsoluteUrl,
  AgencyId,
  DiscussionReadDto,
  DiscussionRejected,
  Exchange,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import type {
  FetchDiscussionRequestedPayload,
  SendMessageRequestedPayload,
} from "src/core-logic/domain/discussion/discussion.slice";
import type { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  public discussion$ = new Subject<DiscussionReadDto | undefined>();

  public sendMessageResponse$ = new Subject<Exchange>();

  // for test purpose
  public currentUser$ = new Subject<InclusionConnectedUser>();

  public getLogoutUrlResponse$ = new Subject<AbsoluteUrl>();

  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  public registerAgenciesToCurrentUserResponse$ = new Subject<undefined>();

  public updateDiscussionStatusResponse$ = new Subject<void>();

  public getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return this.currentUser$;
  }

  public getLogoutUrl$() {
    return this.getLogoutUrlResponse$;
  }

  public getDiscussionById$(
    _payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined> {
    return this.discussion$;
  }

  public sendMessage$(
    _payload: SendMessageRequestedPayload,
  ): Observable<Exchange> {
    return this.sendMessageResponse$;
  }

  public markPartnersErroredConventionAsHandled$(
    _params: MarkPartnersErroredConventionAsHandledRequest,
    _jwt: string,
  ): Observable<void> {
    return this.markPartnersErroredConventionAsHandledResult$;
  }

  public registerAgenciesToCurrentUser$(
    _agencyIds: AgencyId[],
    _token: string,
  ): Observable<void> {
    return this.registerAgenciesToCurrentUserResponse$;
  }

  public updateDiscussionStatus$(
    _payload: {
      jwt: string;
      discussionId: string;
    } & DiscussionRejected,
  ): Observable<void> {
    return this.updateDiscussionStatusResponse$;
  }
}
