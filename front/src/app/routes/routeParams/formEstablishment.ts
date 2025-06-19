import {
  type AbsoluteUrl,
  type AppellationAndRomeDto,
  type ContactMode,
  defaultMaxContactsPerMonth,
  type Email,
  type FormEstablishmentDto,
  type FormEstablishmentSource,
  type FormEstablishmentUserRight,
} from "shared";
import type { AcquisitionParams } from "src/app/routes/routes";
import { param, type ValueSerializer } from "type-route";
import { v4 as uuidV4 } from "uuid";

export type FormEstablishmentParamsInUrl = Partial<{
  [K in FormEstablishmentKeysInUrl]: (typeof formEstablishmentParamsInUrl)[K]["~internal"]["valueSerializer"] extends ValueSerializer<
    infer T
  >
    ? T
    : never;
}>;

const formEstablishmentAddressArraySerializer: ValueSerializer<string[]> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (stringsArray) => JSON.stringify(stringsArray),
};

const appellationsDtoSerializer: ValueSerializer<AppellationAndRomeDto[]> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (appellationsDto) => JSON.stringify(appellationsDto),
};

const copyEmailsSerializer: ValueSerializer<Email[]> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (emails: Email[]) => JSON.stringify(emails),
};

const establishmentUserRightsSerializer: ValueSerializer<
  FormEstablishmentUserRight[]
> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (userRights: FormEstablishmentUserRight[]) =>
    JSON.stringify(userRights),
};

export const formEstablishmentParamsInUrl = {
  uRights: param.query.optional.ofType(establishmentUserRightsSerializer),
  source: param.query.optional.string,
  siret: param.query.optional.string,
  bName: param.query.optional.string,
  bNameCustomized: param.query.optional.string,
  bAddresses: param.query.optional.ofType(
    formEstablishmentAddressArraySerializer,
  ),
  isEngagedEnterprise: param.query.optional.boolean,
  fitForDisabledWorkers: param.query.optional.boolean,
  maxContactsPerMonth: param.query.optional.number,
  nafCode: param.query.optional.string,
  nafNomenclature: param.query.optional.string,
  bcLastName: param.query.optional.string,
  bcFirstName: param.query.optional.string,
  bcJob: param.query.optional.string,
  bcPhone: param.query.optional.string,
  bcEmail: param.query.optional.string,
  bcContactMode: param.query.optional.string,
  website: param.query.optional.string,
  additionalInformation: param.query.optional.string,
  appellations: param.query.optional.ofType(appellationsDtoSerializer),
  bcCopyEmails: param.query.optional.ofType(copyEmailsSerializer),
  sByJobSeekers: param.query.optional.boolean,
  sByStudents: param.query.optional.boolean,
};

export type FormEstablishmentKeysInUrl =
  keyof typeof formEstablishmentParamsInUrl;

export const formEstablishmentQueryParamsToFormEstablishmentDto = (
  params: FormEstablishmentParamsInUrl,
): FormEstablishmentDto => ({
  source: (params.source ?? "immersion-facile") as FormEstablishmentSource,
  siret: params.siret ?? "",
  businessName: params.bName ?? "",
  businessNameCustomized: params.bNameCustomized,
  businessAddresses:
    params.bAddresses?.map((rawAddress) => ({
      id: uuidV4(),
      rawAddress,
    })) ?? [],
  isEngagedEnterprise: Boolean(params.isEngagedEnterprise),
  fitForDisabledWorkers: Boolean(params.fitForDisabledWorkers),
  maxContactsPerMonth: params.maxContactsPerMonth ?? defaultMaxContactsPerMonth,
  naf: {
    code: params.nafCode ?? "",
    nomenclature: params.nafNomenclature ?? "",
  },
  contactMode: params.bcContactMode as ContactMode,
  userRights: params.uRights ?? [],
  website: params.website as AbsoluteUrl | "",
  additionalInformation: params.additionalInformation,
  appellations: params.appellations ?? [],
  searchableBy: {
    jobSeekers: params.sByJobSeekers ?? true,
    students: params.sByStudents ?? true,
  },
});

export const formEstablishmentDtoToFormEstablishmentWithAcquisitionQueryParams =
  (
    params: FormEstablishmentDto & AcquisitionParams,
  ): FormEstablishmentParamsInUrl & AcquisitionParams => {
    return {
      source: params.source,
      siret: params.siret,
      bName: params.businessName,
      bNameCustomized: params.businessNameCustomized,
      bAddresses: params.businessAddresses.map(({ rawAddress }) => rawAddress),
      isEngagedEnterprise: params.isEngagedEnterprise,
      fitForDisabledWorkers: params.fitForDisabledWorkers,
      maxContactsPerMonth:
        params.maxContactsPerMonth ?? defaultMaxContactsPerMonth,
      nafCode: params.naf?.code ?? "",
      nafNomenclature: params.naf?.nomenclature ?? "",
      uRights: params.userRights,
      bcContactMode: params.contactMode ?? "",
      website: params.website,
      additionalInformation: params.additionalInformation,
      appellations: params.appellations,
      ...(params.mtm_campaign
        ? {
            mtm_campaign: params.mtm_campaign,
          }
        : {}),
      ...(params.mtm_kwd
        ? {
            mtm_kwd: params.mtm_kwd,
          }
        : {}),
    };
  };
