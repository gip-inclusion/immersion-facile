import {
  DemandeImmersionId,
  FormulaireDto,
  formulaireDtoSchema,
  FormulaireStatusUtil
} from "../../../shared/FormulaireDto";

type FormulaireProps = {
  id: DemandeImmersionId;
  status: string;
  email: string;
  phone: string | undefined;
  firstName: string;
  lastName: string;
  dateSubmission: string;
  dateStart: string;
  dateEnd: string;
  businessName: string;
  siret: string;
  mentor: string;
  mentorPhone: string;
  mentorEmail: string;
  workdays: string[];
  workHours: string;
  immersionAddress: string | undefined;
  individualProtection: boolean | undefined;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription: string | undefined;
  immersionObjective: string;
  immersionProfession: string;
  immersionActivities: string;
  immersionSkills: string | undefined;
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
};

export class FormulaireEntity {
  public readonly id: DemandeImmersionId;
  public readonly status: string;
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly phone: string | undefined;
  public readonly dateSubmission: string;
  public readonly dateStart: string;
  public readonly dateEnd: string;
  public readonly businessName: string;
  public readonly siret: string;
  public readonly mentor: string;
  public readonly mentorPhone: string;
  public readonly mentorEmail: string;
  public readonly workdays: string[];
  public readonly workHours: string;
  public readonly immersionAddress: string | undefined;
  public readonly individualProtection: boolean;
  public readonly sanitaryPrevention: boolean;
  public readonly sanitaryPreventionDescription: string | undefined;
  public readonly immersionObjective: string;
  public readonly immersionProfession: string;
  public readonly immersionActivities: string;
  public readonly immersionSkills: string | undefined;
  public readonly beneficiaryAccepted: boolean;
  public readonly enterpriseAccepted: boolean;

  private constructor({
    id,
    status,
    email,
    phone,
    firstName,
    lastName,
    dateSubmission,
    dateStart,
    dateEnd,
    businessName,
    siret,
    mentor,
    mentorPhone,
    mentorEmail,
    workdays,
    workHours,
    immersionAddress,
    individualProtection,
    sanitaryPrevention,
    sanitaryPreventionDescription,
    immersionObjective,
    immersionProfession,
    immersionActivities,
    immersionSkills,
    beneficiaryAccepted,
    enterpriseAccepted,
  }: FormulaireProps) {
    this.id = id;
    this.status = status;
    this.email = email;
    this.phone = phone;
    this.firstName = firstName;
    this.lastName = lastName;
    this.dateSubmission = dateSubmission;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
    this.businessName = businessName;
    this.siret = siret;
    this.mentor = mentor;
    this.mentorPhone = mentorPhone;
    this.mentorEmail = mentorEmail;
    this.workdays = workdays;
    this.workHours = workHours;
    this.immersionAddress = immersionAddress;
    this.individualProtection = individualProtection ?? true;
    this.sanitaryPrevention = sanitaryPrevention;
    this.sanitaryPreventionDescription = sanitaryPreventionDescription;
    this.immersionObjective = immersionObjective;
    this.immersionProfession = immersionProfession;
    this.immersionActivities = immersionActivities;
    this.immersionSkills = immersionSkills;
    this.beneficiaryAccepted = beneficiaryAccepted;
    this.enterpriseAccepted = enterpriseAccepted;
  }

  public static create(dto: FormulaireDto) {
    formulaireDtoSchema.validateSync(dto);
    return new FormulaireEntity({
      id: dto.id,
      status: dto.status,
      email: dto.email,
      phone: dto.phone ?? undefined,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateSubmission: dto.dateSubmission,
      dateStart: dto.dateStart,
      dateEnd: dto.dateEnd,
      businessName: dto.businessName,
      siret: dto.siret,
      mentor: dto.mentor,
      mentorPhone: dto.mentorPhone,
      mentorEmail: dto.mentorEmail,
      workdays: dto.workdays ?? [],
      workHours: dto.workHours,
      immersionAddress: dto.immersionAddress ?? undefined,
      individualProtection: dto.individualProtection,
      sanitaryPrevention: dto.sanitaryPrevention,
      sanitaryPreventionDescription:
        dto.sanitaryPreventionDescription ?? undefined,
      immersionObjective: dto.immersionObjective ?? "",
      immersionProfession: dto.immersionProfession,
      immersionActivities: dto.immersionActivities,
      immersionSkills: dto.immersionSkills ?? undefined,
      beneficiaryAccepted: dto.beneficiaryAccepted,
      enterpriseAccepted: dto.enterpriseAccepted,
    });
  }
}

export const formulaireEntityToDto = (
  entity: FormulaireEntity
): FormulaireDto => {
  return {
    id: entity.id,
    status: FormulaireStatusUtil.fromString(entity.status),
    email: entity.email,
    phone: entity.phone,
    firstName: entity.firstName,
    lastName: entity.lastName,
    dateSubmission: entity.dateSubmission,
    dateStart: entity.dateStart,
    dateEnd: entity.dateEnd,
    businessName: entity.businessName,
    siret: entity.siret,
    mentor: entity.mentor,
    mentorPhone: entity.mentorPhone,
    mentorEmail: entity.mentorEmail,
    workdays: entity.workdays,
    workHours: entity.workHours,
    immersionAddress: entity.immersionAddress,
    individualProtection: entity.individualProtection,
    sanitaryPrevention: entity.sanitaryPrevention,
    sanitaryPreventionDescription: entity.sanitaryPreventionDescription,
    immersionObjective: entity.immersionObjective,
    immersionProfession: entity.immersionProfession,
    immersionActivities: entity.immersionActivities,
    immersionSkills: entity.immersionSkills,
    beneficiaryAccepted: entity.beneficiaryAccepted,
    enterpriseAccepted: entity.enterpriseAccepted,
  } as FormulaireDto;
};
