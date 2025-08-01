import { type Observable, Subject } from "rxjs";
import type {
  ApiConsumer,
  ApiConsumerJwt,
  ConnectedUser,
  ConnectedUserJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetUsersFilters,
  NotificationsByKind,
  RejectConnectedUserRoleForAgencyParams,
  SetFeatureFlagParam,
  UserParamsForAgency,
  UserWithNumberOfAgencies,
  WithAgencyIdAndUserId,
} from "shared";
import type { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  public apiConsumers$ = new Subject<ApiConsumer[]>();

  public dashboardUrl$ = new Subject<DashboardUrlAndName>();

  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();

  public getAgencyUsersToReviewResponse$ = new Subject<ConnectedUser[]>();

  public getAllApiConsumers$ = (_adminToken: ConnectedUserJwt) =>
    this.apiConsumers$;

  public lastNotifications$ = new Subject<NotificationsByKind>();

  public rejectUserToAgencyResponse$ = new Subject<void>();

  public saveApiConsumersResponse$ = new Subject<ApiConsumerJwt>();

  public setFeatureFlagLastCalledWith: SetFeatureFlagParam | undefined =
    undefined;

  public setFeatureFlagResponse$ = new Subject<void>();

  public token$ = new Subject<string>();

  public updateAgencyRoleForUserResponse$ = new Subject<undefined>();

  public removeUserFromAgencyResponse$ = new Subject<undefined>();

  public createUserForAgencyResponse$ = new Subject<ConnectedUser>();

  public listUsersResponse$ = new Subject<UserWithNumberOfAgencies[]>();

  public getIcUserResponse$ = new Subject<ConnectedUser>();

  public updateFeatureFlags$ = (
    params: SetFeatureFlagParam,
    _adminToken: ConnectedUserJwt,
  ) => {
    this.setFeatureFlagLastCalledWith = params;
    return this.setFeatureFlagResponse$;
  };

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: ConnectedUserJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }

  public createUserForAgency$(
    _params: UserParamsForAgency,
    _token: string,
  ): Observable<ConnectedUser> {
    return this.createUserForAgencyResponse$;
  }

  public getDashboardUrl$(): Observable<DashboardUrlAndName> {
    return this.dashboardUrl$;
  }

  public getConnectedUsersToReview$(): Observable<ConnectedUser[]> {
    return this.getAgencyUsersToReviewResponse$;
  }

  public getLastNotifications$(
    _token: ConnectedUserJwt,
  ): Observable<NotificationsByKind> {
    return this.lastNotifications$;
  }

  public rejectUserForAgency$(
    _params: RejectConnectedUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.rejectUserToAgencyResponse$;
  }

  public saveApiConsumer$(
    _apiConsumer: ApiConsumer,
    _adminToken: ConnectedUserJwt,
  ): Observable<ApiConsumerJwt> {
    return this.saveApiConsumersResponse$;
  }

  public updateUserRoleForAgency$(
    _params: UserParamsForAgency,
    _token: string,
  ): Observable<void> {
    return this.updateAgencyRoleForUserResponse$;
  }

  public removeUserFromAgency$(
    _params: WithAgencyIdAndUserId,
    _token: string,
  ): Observable<void> {
    return this.removeUserFromAgencyResponse$;
  }

  public listUsers$(
    _params: GetUsersFilters,
    _token: string,
  ): Observable<UserWithNumberOfAgencies[]> {
    return this.listUsersResponse$;
  }

  public getIcUser$(
    _params: { userId: string },
    _token: string,
  ): Observable<ConnectedUser> {
    return this.getIcUserResponse$;
  }
}
