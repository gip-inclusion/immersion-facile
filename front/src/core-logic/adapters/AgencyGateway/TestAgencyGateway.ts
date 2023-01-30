/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { from, Observable, Subject } from "rxjs";
import {
  AdminToken,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  propEq,
  propNotEq,
  toAgencyPublicDisplayDto,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  public agencies$ = new Subject<AgencyOption[]>();
  public fetchedAgency$ = new Subject<AgencyDto | undefined>();
  public customAgencyId$ = new Subject<AgencyId | undefined>();

  public updateAgencyResponse$ = new Subject<undefined>();

  public updateAgency$(
    _agencyDto: AgencyDto,
    _adminToken: AdminToken,
  ): Observable<void> {
    return this.updateAgencyResponse$;
  }

  listAgenciesByFilter$(
    _filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return this.agencies$;
  }

  getAgencyAdminById$(
    _agencyId: AgencyId,
    _adminToken: AdminToken,
  ): Observable<AgencyDto | undefined> {
    return this.fetchedAgency$;
  }

  getImmersionFacileAgencyId$(): Observable<AgencyId | undefined> {
    return this.customAgencyId$;
  }

  private _agencies: Record<string, AgencyDto> = {};

  async addAgency(createAgencyDto: CreateAgencyDto) {
    this._agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  async listImmersionAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies);
  }

  async listImmersionOnlyPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propEq("kind", "pole-emploi"));
  }

  async listImmersionWithoutPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propNotEq("kind", "pole-emploi"));
  }

  async listMiniStageAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propNotEq("kind", "cci"));
  }

  listAgenciesNeedingReview$(
    _adminToken: AdminToken,
  ): Observable<AgencyOption[]> {
    return this.agencies$;
  }

  async listAgenciesNeedingReview(): Promise<AgencyDto[]> {
    return values(this._agencies).filter(propEq("status", "needsReview"));
  }

  async validateOrRejectAgency(
    _: AdminToken,
    agencyId: AgencyId,
  ): Promise<void> {
    this._agencies[agencyId].status = "active";
  }

  validateOrRejectAgency$(_: AdminToken, agencyId: AgencyId): Observable<void> {
    return from(this.validateOrRejectAgency(_, agencyId));
  }

  async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies[withAgencyId.id];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.id}.`);
  }
}
