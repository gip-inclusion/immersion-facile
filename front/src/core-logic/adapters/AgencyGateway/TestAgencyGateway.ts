/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { Observable, of, Subject } from "rxjs";
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
  listCciAgencies(_departmentCode: DepartmentCode): Promise<AgencyOption[]> {
    throw new Error("Method not implemented.");
  }
  public agencies$ = new Subject<AgencyOption[]>();
  public fetchedAgency$ = new Subject<AgencyDto | undefined>();
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

  getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
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

  async listAgenciesByDepartmentCode(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies);
  }

  async listPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propEq("kind", "pole-emploi"));
  }

  async listNonPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propNotEq("kind", "pole-emploi"));
  }

  async listAgenciesNeedingReview(): Promise<AgencyDto[]> {
    return values(this._agencies).filter(propEq("status", "needsReview"));
  }

  async validateAgency(_: AdminToken, agencyId: AgencyId): Promise<void> {
    this._agencies[agencyId].status = "active";
  }

  async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies[withAgencyId.id];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.id}.`);
  }
}
