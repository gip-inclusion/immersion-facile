import { param, ValueSerializer } from "type-route";
import {
  AppellationAndRomeDto,
  ContactMethod,
  defaultMaxContactsPerWeek,
  Email,
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "shared";

type NewType = typeof formEstablishmentParamsInUrl;

export type FormEstablishmentParamsInUrl = Partial<{
  [K in FormEstablishmentKeysInUrl]: NewType[K]["~internal"]["valueSerializer"] extends ValueSerializer<
    infer T
  >
    ? T
    : never;
}>;

const appellationsDtoSerializer: ValueSerializer<AppellationAndRomeDto[]> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (appellationDto) => JSON.stringify(appellationDto),
};

const copyEmailsSerializer: ValueSerializer<Email[]> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (emails: Email[]) => JSON.stringify(emails),
};

export const formEstablishmentParamsInUrl = {
  source: param.query.optional.string,
  siret: param.query.optional.string,
  bName: param.query.optional.string,
  bNameCustomized: param.query.optional.string,
  bAddress: param.query.optional.string,
  isEngagedEnterprise: param.query.optional.boolean,
  fitForDisabledWorkers: param.query.optional.boolean,
  maxContactsPerWeek: param.query.optional.number,
  nafCode: param.query.optional.string,
  nafNomenclature: param.query.optional.string,
  bcLastName: param.query.optional.string,
  bcFirstName: param.query.optional.string,
  bcJob: param.query.optional.string,
  bcPhone: param.query.optional.string,
  bcEmail: param.query.optional.string,
  bcContactMethod: param.query.optional.string,
  website: param.query.optional.string,
  additionalInformation: param.query.optional.string,
  appellations: param.query.optional.ofType(appellationsDtoSerializer),
  bcCopyEmails: param.query.optional.ofType(copyEmailsSerializer),
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
  businessAddress: params.bAddress ?? "",
  isEngagedEnterprise: Boolean(params.isEngagedEnterprise),
  fitForDisabledWorkers: Boolean(params.fitForDisabledWorkers),
  maxContactsPerWeek: params.maxContactsPerWeek ?? defaultMaxContactsPerWeek,
  naf: {
    code: params.nafCode ?? "",
    nomenclature: params.nafNomenclature ?? "",
  },
  businessContact: {
    lastName: params.bcLastName ?? "",
    firstName: params.bcFirstName ?? "",
    job: params.bcJob ?? "",
    phone: params.bcPhone ?? "",
    email: params.bcEmail ?? "",
    contactMethod: params.bcContactMethod as ContactMethod,
    copyEmails: params.bcCopyEmails ?? [],
  },
  website: params.website,
  additionalInformation: params.additionalInformation,
  appellations: params.appellations ?? [],
});

export const formEstablishmentDtoToFormEstablishmentQueryParams = (
  formEstablishmentDto: FormEstablishmentDto,
): FormEstablishmentParamsInUrl => ({
  source: formEstablishmentDto.source,
  siret: formEstablishmentDto.siret,
  bName: formEstablishmentDto.businessName,
  bNameCustomized: formEstablishmentDto.businessNameCustomized,
  bAddress: formEstablishmentDto.businessAddress,
  isEngagedEnterprise: formEstablishmentDto.isEngagedEnterprise,
  fitForDisabledWorkers: formEstablishmentDto.fitForDisabledWorkers,
  maxContactsPerWeek:
    formEstablishmentDto.maxContactsPerWeek ?? defaultMaxContactsPerWeek,
  nafCode: formEstablishmentDto.naf?.code ?? "",
  nafNomenclature: formEstablishmentDto.naf?.nomenclature ?? "",
  bcLastName: formEstablishmentDto.businessContact.lastName,
  bcFirstName: formEstablishmentDto.businessContact.firstName,
  bcJob: formEstablishmentDto.businessContact.job,
  bcPhone: formEstablishmentDto.businessContact.phone,
  bcEmail: formEstablishmentDto.businessContact.email,
  bcContactMethod: formEstablishmentDto.businessContact.contactMethod ?? "",
  website: formEstablishmentDto.website,
  additionalInformation: formEstablishmentDto.additionalInformation,
  appellations: formEstablishmentDto.appellations,
  bcCopyEmails: formEstablishmentDto.businessContact.copyEmails,
});

export const defaultFormEstablishmentParams = {
  source: "immersion-facile",
  siret: "",
  bName: "",
  bAddress: "",
  maxContactsPerWeek: 0,
  bcLastName: "",
  bcFirstName: "",
  bcJob: "",
  bcPhone: "",
  bcEmail: "",
  bcContactMethod: "",
  appellations: [],
  bcCopyEmails: [],
};
