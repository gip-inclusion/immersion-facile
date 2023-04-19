import { Observable, Subject } from "rxjs";
import {
  AbsoluteUrl,
  AgencyDto,
  AgencyId,
  AgencyRole,
  AuthenticatedUser,
  AuthenticatedUserId,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<BackOfficeJwt> {
    return this.token$;
  }

  public getDashboardUrl$(): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }
  updateAgencyRoleForUser$(
    _agencyId: AgencyId,
    _role: AgencyRole,
    _userId: AuthenticatedUserId,
    _token: string,
  ): Observable<void> {
    return this.updateAgencyRoleForUserResponse$;
  }
  getAgencyUsersToReview$(): Observable<AuthenticatedUser[]> {
    return this.getAgencyUsersToReviewResponse$;
  }
  getAgenciesToReviewForUser$(
    _userId: AuthenticatedUserId,
    _token: string,
  ): Observable<AgencyDto[]> {
    return this.getAgenciesToReviewForUserResponse$;
  }

  public getAgencyUsersToReviewResponse$ = new Subject<AuthenticatedUser[]>();
  public updateAgencyRoleForUserResponse$ = new Subject<undefined>();
  public getAgenciesToReviewForUserResponse$ = new Subject<AgencyDto[]>();
  public token$ = new Subject<string>();
  public dashboardUrl$ = new Subject<AbsoluteUrl>();
  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();
}
