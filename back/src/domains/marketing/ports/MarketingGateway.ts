import {
  DateTimeIsoString,
  DepartmentCode,
  EstablishmentSearchableByValue,
  NumberEmployeesRange,
  SiretDto,
} from "shared";
import { MarketingContact } from "../entities/MarketingContact";

export type MarketingEstablishment = {
  contact: MarketingContact;
  conventions: {
    firstConventionValidationDate?: DateTimeIsoString; //ENT_DATE_PREM_CONVENTION
    lastCoventionValidationDate?: DateTimeIsoString; //ENT_DATE_VALIDATION_DERNIERE_CONVENTION
    endDateOfLastConvention?: DateTimeIsoString; //ENT_DATE_FIN_DERNIERE_CONVENTION
    numberOfConventions: number; //ENT_NB_CONVENTION
  };
  departmentCode: DepartmentCode; //ENT_CODE_DEPARTEMENT
  hasIcAccount: boolean; //COMPTE_IC
  isCommited?: boolean; //ENT_LES_ENTREPRISES_SENGAGENT
  isRegistered: boolean; //ENT_REFERENCE_SITE
  maxContactsPerWeek: number; //ENT_MAX_CONTACT_PER_WEEK
  nafCode: string; //ENT_CODE_NAF
  nextAvailabilityDate?: DateTimeIsoString; //ENT_DATE_DISPO
  numberEmployeesRange?: NumberEmployeesRange; //ENT_EFFECTIF
  numberOfDiscussionsAnswered: number; //ENT_NOMBRE_REPONSES_MER
  numberOfDiscussionsReceived: number; //ENT_NOMBRE_MER_RECUES
  searchableBy: MarketingEstablishmentSearchableBy; //ENT_TYPE_PUBLIC_ACCUEILLIS
  siret: SiretDto;
};

export interface MarketingGateway {
  save(marketing: MarketingEstablishment): Promise<void>;
}

type MarketingEstablishmentSearchableBy =
  | EstablishmentSearchableByValue
  | "all";
