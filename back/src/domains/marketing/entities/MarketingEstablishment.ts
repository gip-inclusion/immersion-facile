import {
  DateTimeIsoString,
  DepartmentCode,
  Email,
  EstablishmentSearchableByValue,
  NumberEmployeesRange,
  SiretDto,
} from "shared";

type MarketingEstablishmentSearchableBy =
  | EstablishmentSearchableByValue
  | "all";

export type MarketingEstablishment = {
  siret: SiretDto;
  numberEmployeesRange?: NumberEmployeesRange; //ENT_EFFECTIF
  numberOfConventions: number; //ENT_NB_CONVENTION
  isRegistered: boolean; //ENT_REFERENCE_SITE
  lastCoventionValidationDate?: DateTimeIsoString; //ENT_DATE_VALIDATION_DERNIERE_CONVENTION
  endDateOfLastConvention: DateTimeIsoString; //ENT_DATE_FIN_DERNIERE_CONVENTION
  hasIcAccount: boolean; //COMPTE_IC
  numberOfDiscussionsReceived: number; //ENT_NOMBRE_MER_RECUES
  numberOfDiscussionsAnswered: number; //ENT_NOMBRE_REPONSES_MER
  searchableBy: MarketingEstablishmentSearchableBy; //ENT_TYPE_PUBLIC_ACCUEILLIS
  departmentCode: DepartmentCode; //ENT_CODE_DEPARTEMENT
  nafCode: string; //ENT_CODE_NAF
  isCommited?: boolean; //ENT_LES_ENTREPRISES_SENGAGENT
  maxContactsPerWeek: number; //ENT_MAX_CONTACT_PER_WEEK
  firstConventionValidationDate: DateTimeIsoString; //ENT_DATE_PREM_CONVENTION
  nextAvailabilityDate?: DateTimeIsoString; //ENT_DATE_DISPO
  contact: MarketingContact;
};

export type MarketingContact = {
  name: string; //PRENOM
  surname: string; //NOM
  email: Email; //EMAIL (dans le cas d'un establishment lead --> mail du rep légal de l'entreprise / cas entreprise référencée --> mail de contact de l'entreprise)
  createdAt: Date;
};

type MarketingEstablishmentContactEntity = {
  contactEmail: Email;
  siret: SiretDto;
  emailContactHistory: MarketingContact[];
};
