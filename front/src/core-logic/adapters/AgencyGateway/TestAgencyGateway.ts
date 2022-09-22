/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { map, Observable, of, Subject } from "rxjs";
import { DepartmentCode } from "shared/src/address/address.dto";
import { AdminToken } from "shared/src/admin/admin.dto";
import { toAgencyPublicDisplayDto } from "shared/src/agency/agency";
import {
  AgencyDto,
  AgencyId,
  AgencyIdAndName,
  AgencyPublicDisplayDto,
  ConventionViewAgencyDto,
  CreateAgencyDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { propEq, propNotEq } from "shared/src/ramdaExtensions/propEq";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

export class TestAgencyGateway implements AgencyGateway {
  public agencies$ = new Subject<ConventionViewAgencyDto[]>();

  listAgencies$(
    departmentCode: DepartmentCode,
  ): Observable<ConventionViewAgencyDto[]> {
    return this.agencies$.pipe(
      map((agencies: ConventionViewAgencyDto[]) =>
        agencies.filter(
          (agency: ConventionViewAgencyDto) =>
            agency.address.departmentCode === departmentCode,
        ),
      ),
    );
  }

  getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  private _agencies: Record<string, AgencyDto> = {
    [MISSION_LOCAL_AGENCY_ACTIVE.id]: MISSION_LOCAL_AGENCY_ACTIVE,
    [PE_AGENCY_ACTIVE.id]: PE_AGENCY_ACTIVE,
    [AGENCY_3_NEEDING_REVIEW.id]: AGENCY_3_NEEDING_REVIEW,
    [AGENCY_4_NEEDING_REVIEW.id]: AGENCY_4_NEEDING_REVIEW,
  };

  async addAgency(createAgencyDto: CreateAgencyDto) {
    this._agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  async listAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    return values(this._agencies);
  }

  async listPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
    return values(this._agencies).filter(propEq("kind", "pole-emploi"));
  }

  async listNonPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyIdAndName[]> {
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

const PE_AGENCY_ACTIVE = new AgencyDtoBuilder()
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

const AGENCY_3_NEEDING_REVIEW = new AgencyDtoBuilder()
  .withId("PE-test-agency-3-front")
  .withName("Test Agency 3 (front)")
  .withStatus("needsReview")
  .build();

const AGENCY_4_NEEDING_REVIEW = new AgencyDtoBuilder()
  .withId("PE-test-agency-4-front")
  .withName("Test Agency 4 (front)")
  .withStatus("needsReview")
  .build();
