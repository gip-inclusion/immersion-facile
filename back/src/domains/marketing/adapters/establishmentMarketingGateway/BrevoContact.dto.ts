import { DateString, Email } from "shared";

export type CreateContactBody = {
  email?: string;
  ext_id?: string;
  attributes?: Partial<CreateContactAttributes>;
  emailBlacklisted?: boolean;
  smsBlacklisted?: boolean;
  listIds?: number[];
} & (
  | { updateEnabled: false }
  | { updateEnabled: true; smtpBlacklistSender?: string[] }
);

export type CreateContactAttributes = Partial<{
  EMAIL: string | BrevoDeleteAttribute;
  ENT_CODE_DEPARTEMENT: string | BrevoDeleteAttribute;
  ENT_CODE_NAF: string | BrevoDeleteAttribute;
  ENT_COMPTE_IC: boolean | BrevoDeleteAttribute;
  ENT_DATE_DISPO: DateString | BrevoDeleteAttribute;
  ENT_DATE_FIN_DERNIERE_CONVENTION: DateString | BrevoDeleteAttribute;
  ENT_DATE_PREM_CONVENTION: DateString | BrevoDeleteAttribute;
  ENT_DATE_VALIDATION_DERNIERE_CONVENTION: DateString | BrevoDeleteAttribute;
  ENT_EFFECTIF: string | BrevoDeleteAttribute;
  ENT_LES_ENTREPRISES_SENGAGENT: boolean | BrevoDeleteAttribute;
  ENT_MAX_CONTACTS_PER_MONTH: number | BrevoDeleteAttribute;
  ENT_NB_CONVENTION: number | BrevoDeleteAttribute;
  ENT_NOMBRE_MER_RECUES: number | BrevoDeleteAttribute;
  ENT_NOMBRE_REPONSES_MER: number | BrevoDeleteAttribute;
  ENT_REFERENCE_SITE: boolean | BrevoDeleteAttribute;
  ENT_ROMES: string | BrevoDeleteAttribute;
  ENT_SIRET: string | BrevoDeleteAttribute;
  ENT_TYPE_PUBLIC_ACCUEILLIS: TypePublic | BrevoDeleteAttribute;
  NOM: string | BrevoDeleteAttribute;
  PRENOM: string | BrevoDeleteAttribute;
}>;

export type GetContactInfoResponseBody = {
  email: string;
  id: number;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  createdAt: string;
  modifiedAt: string;
  listIds: number[];
  attributes: GetContactInfoAttributes;
  //statistics: unknown;  typing detail excluded - not used
};

export type GetContactInfoAttributes = Partial<{
  EMAIL: string;
  ENT_CODE_DEPARTEMENT: string;
  ENT_CODE_NAF: string;
  ENT_COMPTE_IC: boolean;
  ENT_DATE_DISPO: DateString;
  ENT_DATE_FIN_DERNIERE_CONVENTION: DateString;
  ENT_DATE_PREM_CONVENTION: DateString;
  ENT_DATE_VALIDATION_DERNIERE_CONVENTION: DateString;
  ENT_EFFECTIF: string;
  ENT_LES_ENTREPRISES_SENGAGENT: boolean;
  ENT_MAX_CONTACTS_PER_MONTH: number;
  ENT_NB_CONVENTION: number;
  ENT_NOMBRE_MER_RECUES: number;
  ENT_NOMBRE_REPONSES_MER: number;
  ENT_REFERENCE_SITE: boolean;
  ENT_ROMES: string;
  ENT_SIRET: string;
  ENT_TYPE_PUBLIC_ACCUEILLIS: TypePublic;
  NOM: string;
  PRENOM: string;
}>;

export const typesPublic = ["1", "2", "3"] as const;
export type TypePublic = (typeof typesPublic)[number];
type BrevoDeleteAttribute = "";

export type DeleteContactFromListRequestBodyModeEmail = {
  emails: Email[];
};
export type DeleteContactFromListModeEmailResponseBody = {
  contacts: {
    success: Email[];
    failure: Email[];
  };
};
