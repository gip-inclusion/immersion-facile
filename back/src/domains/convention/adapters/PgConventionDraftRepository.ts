import { sql } from "kysely";
import type {
  AgencyKind,
  ConventionDraftDto,
  ConventionDraftId,
  DateString,
  DepartmentCode,
  EstablishmentTutor,
  ScheduleDto,
  Signatories,
} from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type { ConventionDraftRepository } from "../ports/ConventionDraftRepository";

export class PgConventionDraftRepository implements ConventionDraftRepository {
  constructor(private transaction: KyselyDb) {}

  public async getById(
    id: ConventionDraftId,
  ): Promise<ConventionDraftDto | undefined> {
    const row = await this.transaction
      .selectFrom("convention_drafts")
      .leftJoin(
        "public_appellations_data",
        "public_appellations_data.ogr_appellation",
        "convention_drafts.immersion_appellation",
      )
      .leftJoin(
        "public_romes_data",
        "public_romes_data.code_rome",
        "public_appellations_data.code_rome",
      )
      .selectAll("convention_drafts")
      .select([
        "public_appellations_data.ogr_appellation",
        "public_appellations_data.libelle_appellation_long",
        "public_appellations_data.code_rome",
        "public_romes_data.libelle_rome",
      ])
      .where("convention_drafts.id", "=", id)
      .executeTakeFirst();

    if (!row) return undefined;

    return {
      id: row.id,
      agencyId: row.agency_id ?? undefined,
      agencyKind: (row.agency_kind as AgencyKind) ?? undefined,
      agencyDepartment: (row.agency_department as DepartmentCode) ?? undefined,
      dateStart: row.date_start?.toISOString() ?? undefined,
      dateEnd: row.date_end?.toISOString() ?? undefined,
      siret: row.siret ?? undefined,
      businessName: row.business_name ?? undefined,
      schedule: (row.schedule as ScheduleDto) ?? undefined,
      individualProtection: row.individual_protection ?? undefined,
      individualProtectionDescription:
        row.individual_protection_description ?? undefined,
      sanitaryPrevention: row.sanitary_prevention ?? undefined,
      sanitaryPreventionDescription:
        row.sanitary_prevention_description ?? undefined,
      immersionAddress: row.immersion_address ?? undefined,
      immersionObjective: row.immersion_objective ?? undefined,
      immersionAppellation: row.ogr_appellation
        ? {
            appellationCode: String(row.ogr_appellation),
            appellationLabel: row.libelle_appellation_long ?? "",
            romeCode: row.code_rome ?? "",
            romeLabel: row.libelle_rome ?? "",
          }
        : undefined,
      immersionActivities: row.immersion_activities ?? undefined,
      immersionSkills: row.immersion_skills ?? undefined,
      workConditions: row.work_conditions ?? undefined,
      internshipKind: row.internship_kind,
      businessAdvantages: row.business_advantages ?? undefined,
      acquisitionCampaign: row.acquisition_campaign ?? undefined,
      acquisitionKeyword: row.acquisition_keyword ?? undefined,
      establishmentNumberEmployeesRange:
        row.establishment_number_employees ?? undefined,
      agencyReferent:
        row.agency_referent_first_name || row.agency_referent_last_name
          ? {
              firstname: row.agency_referent_first_name ?? undefined,
              lastname: row.agency_referent_last_name ?? undefined,
            }
          : undefined,
      fromPeConnectedUser: row.ft_connect_id ? true : undefined,
      establishmentTutor:
        (row.establishment_tutor as EstablishmentTutor) ?? undefined,
      signatories: (row.signatories as Signatories) ?? undefined,
    };
  }

  public async save(
    conventionDraft: ConventionDraftDto,
    now: DateString,
  ): Promise<void> {
    await this.transaction
      .insertInto("convention_drafts")
      .values({
        id: conventionDraft.id,
        agency_id: conventionDraft.agencyId ?? null,
        agency_kind: conventionDraft.agencyKind ?? null,
        agency_department: conventionDraft.agencyDepartment ?? null,
        date_start: conventionDraft.dateStart ?? null,
        date_end: conventionDraft.dateEnd ?? null,
        siret: conventionDraft.siret ?? null,
        business_name: conventionDraft.businessName ?? null,
        schedule: conventionDraft.schedule
          ? sql`${JSON.stringify(conventionDraft.schedule)}`
          : null,
        individual_protection: conventionDraft.individualProtection ?? null,
        individual_protection_description:
          conventionDraft.individualProtectionDescription ?? null,
        sanitary_prevention: conventionDraft.sanitaryPrevention ?? null,
        sanitary_prevention_description:
          conventionDraft.sanitaryPreventionDescription ?? null,
        immersion_address: conventionDraft.immersionAddress ?? null,
        immersion_objective: conventionDraft.immersionObjective ?? null,
        immersion_appellation:
          sql`${conventionDraft.immersionAppellation?.appellationCode}` ?? null,
        immersion_activities: conventionDraft.immersionActivities ?? null,
        immersion_skills: conventionDraft.immersionSkills ?? null,
        work_conditions: conventionDraft.workConditions ?? null,
        internship_kind: conventionDraft.internshipKind ?? null,
        business_advantages: conventionDraft.businessAdvantages ?? null,
        acquisition_campaign: conventionDraft.acquisitionCampaign ?? null,
        acquisition_keyword: conventionDraft.acquisitionKeyword ?? null,
        establishment_number_employees:
          conventionDraft.establishmentNumberEmployeesRange ?? null,
        agency_referent_first_name:
          conventionDraft.agencyReferent?.firstname ?? null,
        agency_referent_last_name:
          conventionDraft.agencyReferent?.lastname ?? null,
        ft_connect_id: conventionDraft.fromPeConnectedUser ? "true" : null,
        establishment_tutor: conventionDraft.establishmentTutor
          ? sql`${JSON.stringify(conventionDraft.establishmentTutor)}`
          : null,
        signatories: conventionDraft.signatories
          ? sql`${JSON.stringify(conventionDraft.signatories)}`
          : null,
        updated_at: now ?? sql`now()`,
      })
      .execute();
  }
}
