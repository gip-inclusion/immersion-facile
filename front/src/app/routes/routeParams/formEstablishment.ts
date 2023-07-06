import { param } from "type-route";
import {
  AppellationAndRomeDto,
  ContactMethod,
  Email,
  FormEstablishmentDto,
  FormEstablishmentSource,
} from "shared";
import { appellationDtoSerializer } from "src/app/routes/routeParams/utils";

export const formEstablishmentParamsInUrl = {
  source: param.query.optional.string,
  siret: param.query.string,
  bName: param.query.string,
  bNameCustomized: param.query.optional.string,
  bAddress: param.query.string,
  isEngagedEnterprise: param.query.optional.boolean,
  fitForDisabledWorkers: param.query.optional.boolean,
  maxContactsPerWeek: param.query.number,
  nafCode: param.query.optional.string,
  nafNomenclature: param.query.optional.string,
  bcLastName: param.query.string,
  bcFirstName: param.query.string,
  bcJob: param.query.string,
  bcPhone: param.query.string,
  bcEmail: param.query.string,
  bcContactMethod: param.query.string,
  website: param.query.optional.string,
  additionalInformation: param.query.optional.string,
  appellations: param.query.array.ofType(appellationDtoSerializer),
  bcCopyEmails: param.query.array.string,
};

export type FormEstablishmentKeysInUrl =
  keyof typeof formEstablishmentParamsInUrl;

// const mapFormEstablishmentToQueryParam = (formEstablishment: FormEstablishmentDto): FormEstablishmentParamsInUrl:  => {
//
// }

const _formEstablishmentQueryParamsToFormEstablishmentDto = (
  params: Record<FormEstablishmentKeysInUrl, string>,
): FormEstablishmentDto => ({
  source: params.source as FormEstablishmentSource,
  siret: params.siret,
  businessName: params.bName,
  businessNameCustomized: params.bNameCustomized,
  businessAddress: params.bAddress,
  isEngagedEnterprise: Boolean(params.isEngagedEnterprise),
  fitForDisabledWorkers: Boolean(params.fitForDisabledWorkers),
  maxContactsPerWeek: parseInt(params.maxContactsPerWeek),
  naf: {
    code: params.nafCode,
    nomenclature: params.nafNomenclature,
  },
  businessContact: {
    lastName: params.bcLastName,
    firstName: params.bcFirstName,
    job: params.bcJob,
    phone: params.bcPhone,
    email: params.bcEmail,
    contactMethod: params.bcContactMethod as ContactMethod,
    copyEmails: JSON.parse(params.bcCopyEmails) as Email[],
  },
  website: params.website,
  additionalInformation: params.additionalInformation,
  appellations: JSON.parse(params.appellations) as AppellationAndRomeDto[],
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
