import { Observable, Subject } from "rxjs";
import {
  ApiConsumer,
  ApiConsumerJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetUsersFilters,
  InclusionConnectJwt,
  InclusionConnectedUser,
  NotificationsByKind,
  RejectIcUserRoleForAgencyParams,
  RemoveAgencyUserParams,
  SetFeatureFlagParam,
  UserInList,
  UserParamsForAgency,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  public apiConsumers$ = new Subject<ApiConsumer[]>();

  public dashboardUrl$ = new Subject<DashboardUrlAndName>();

  public establishmentBatchResponse$ = new Subject<EstablishmentBatchReport>();

  public getAgencyUsersToReviewResponse$ = new Subject<
    InclusionConnectedUser[]
  >();

  public getAllApiConsumers$ = (_adminToken: InclusionConnectJwt) =>
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

  public createUserForAgencyResponse$ = new Subject<InclusionConnectedUser>();

  public listUsersResponse$ = new Subject<UserInList[]>();

  public updateFeatureFlags$ = (
    params: SetFeatureFlagParam,
    _adminToken: InclusionConnectJwt,
  ) => {
    this.setFeatureFlagLastCalledWith = params;
    return this.setFeatureFlagResponse$;
  };

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: InclusionConnectJwt,
  ): Observable<EstablishmentBatchReport> {
    return this.establishmentBatchResponse$;
  }

  public createUserForAgency$(
    _params: UserParamsForAgency,
    _token: string,
  ): Observable<InclusionConnectedUser> {
    return this.createUserForAgencyResponse$;
  }

  public getDashboardUrl$(): Observable<DashboardUrlAndName> {
    return this.dashboardUrl$;
  }

  public getInclusionConnectedUsersToReview$(): Observable<
    InclusionConnectedUser[]
  > {
    return this.getAgencyUsersToReviewResponse$;
  }

  public getLastNotifications$(
    _token: InclusionConnectJwt,
  ): Observable<NotificationsByKind> {
    return this.lastNotifications$;
  }

  public rejectUserForAgency$(
    _params: RejectIcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return this.rejectUserToAgencyResponse$;
  }

  public saveApiConsumer$(
    _apiConsumer: ApiConsumer,
    _adminToken: InclusionConnectJwt,
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
    _params: RemoveAgencyUserParams,
    _token: string,
  ): Observable<void> {
    return this.removeUserFromAgencyResponse$;
  }

  public listUsers$(
    _params: GetUsersFilters,
    _token: string,
  ): Observable<UserInList[]> {
    return this.listUsersResponse$;
  }
}
