/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { from, Observable, of, Subject } from "rxjs";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  BackOfficeJwt,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  propEq,
  propNotEq,
  toAgencyPublicDisplayDto,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const MISSION_LOCAL_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("test-agency-1-front")
  .withName("Test Agency 1 (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 1",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("www.questionnaireMissionLocale.com")
  .withKind("mission-locale")
  .withStatus("active")
  .build();

export const PE_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("PE-test-agency-2-front")
  .withName("Test Agency 2 PE (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 2",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("www.PE.com")
  .withKind("pole-emploi")
  .withSignature("Mon agence PE")
  .withStatus("active")
  .build();

const CCI_ACTIVE = new AgencyDtoBuilder()
  .withId("CCI-test-agency")
  .withName("Test Agency CCI")
  .withAddress({
    streetNumberAndAddress: "CCI",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withKind("cci")
  .withSignature("CCI Agency")
  .withStatus("active")
  .build();

export const AGENCY_NEEDING_REVIEW_1 = new AgencyDtoBuilder()
  .withId("PE-test-agency-needs-review-1-front")
  .withName("Test Agency Needs review 1 (front)")
  .withStatus("needsReview")
  .build();

export const AGENCY_NEEDING_REVIEW_2 = new AgencyDtoBuilder()
  .withId("PE-test-agency-needs-review-2-front")
  .withName("Test Agency Needs review 2 (front)")
  .withStatus("needsReview")
  .build();

export class InMemoryAgencyGateway implements AgencyGateway {
  public agencyInfo$ = new Subject<AgencyPublicDisplayDto>();

  #agencies: Record<string, AgencyDto> = {
    [MISSION_LOCAL_AGENCY_ACTIVE.id]: MISSION_LOCAL_AGENCY_ACTIVE,
    [PE_AGENCY_ACTIVE.id]: PE_AGENCY_ACTIVE,
    [AGENCY_NEEDING_REVIEW_1.id]: AGENCY_NEEDING_REVIEW_1,
    [AGENCY_NEEDING_REVIEW_2.id]: AGENCY_NEEDING_REVIEW_2,
    [CCI_ACTIVE.id]: CCI_ACTIVE,
  };

  public async addAgency(createAgencyDto: CreateAgencyDto) {
    this.#agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    _adminToken: BackOfficeJwt,
  ): Observable<AgencyDto> {
    return of(this.#agencies[agencyId]);
  }

  public async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this.#agencies[withAgencyId.agencyId];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.agencyId}.`);
  }

  public getAgencyPublicInfoById$(
    agencyId: WithAgencyId,
  ): Observable<AgencyPublicDisplayDto> {
    return from(this.getAgencyPublicInfoById(agencyId));
  }

  public async getFilteredAgencies(
    filter: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies)
      .filter((agency) => filter.status?.includes(agency.status) ?? true)
      .map((agency) => ({
        id: agency.id,
        name: agency.name,
        kind: agency.kind,
      }));
  }

  public getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  public listAgenciesByFilter$(
    _filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return of(values(this.#agencies));
  }

  public listAgenciesNeedingReview$(
    _adminToken: BackOfficeJwt,
  ): Observable<AgencyOption[]> {
    return of(
      values(this.#agencies)
        .filter((agency) => agency.status === "needsReview")
        .map((agency) => ({
          id: agency.id,
          name: agency.name,
          kind: agency.kind,
        })),
    );
  }

  public async listImmersionAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propNotEq("kind", "cci"));
  }

  public async listImmersionOnlyPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propEq("kind", "pole-emploi"));
  }

  public async listImmersionWithoutPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies)
      .filter(propNotEq("kind", "cci"))
      .filter(propNotEq("kind", "pole-emploi"));
  }

  public async listMiniStageAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this.#agencies).filter(propEq("kind", "cci"));
  }

  public updateAgency$(): Observable<void> {
    return of(undefined);
  }

  public validateOrRejectAgency$(
    adminToken: BackOfficeJwt,
    agencyId: AgencyId,
  ): Observable<void> {
    return from(this.#validateOrRejectAgency(adminToken, agencyId));
  }

  async #validateOrRejectAgency(
    _: BackOfficeJwt,
    agencyId: AgencyId,
  ): Promise<void> {
    this.#agencies[agencyId].status = "active";
  }
}
