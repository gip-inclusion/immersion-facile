import { filter, map, switchMap } from "rxjs";
import { z } from "zod";

import {
  CSVBoolean,
  csvBooleanToBoolean,
  defaultMaxContactsPerWeek,
  establishmentAppellationsFromCSVToDto,
  establishmentCopyEmailsFromCSVToDto,
  EstablishmentCSVRow,
  FormEstablishmentDto,
  formEstablishmentSchema,
  FormEstablishmentSource,
  isCSVCellEmptyString,
  noContactPerWeek,
} from "shared";

import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

import {
  establishmentBatchSlice,
  FormEstablishmentDtoWithErrors,
} from "./establishmentBatch.slice";

type EstablishmentBatchAction = ActionOfSlice<typeof establishmentBatchSlice>;

const candidateEstablishmentParseEpic: AppEpic<EstablishmentBatchAction> = (
  action$,
) =>
  action$.pipe(
    filter(
      establishmentBatchSlice.actions.candidateEstablishmentBatchProvided.match,
    ),
    map((action) => action.payload.map(candidateEstablishmentMapper)),
    map(establishmentBatchSlice.actions.candidateEstablishmentBatchParsed),
  );

const addEstablishmentBatchEpic: AppEpic<EstablishmentBatchAction> = (
  action$,
  state$,
  { adminGateway },
) =>
  action$.pipe(
    filter(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested.match,
    ),
    switchMap((action) =>
      adminGateway.addEstablishmentBatch$(
        action.payload,
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map((batchResponse) =>
      establishmentBatchSlice.actions.addEstablishmentBatchSucceeded(
        batchResponse,
      ),
    ),
    catchEpicError((error) =>
      establishmentBatchSlice.actions.addEstablishmentBatchErrored(
        error.message,
      ),
    ),
  );

export const candidateEstablishmentMapper = (
  establishmentRow: EstablishmentCSVRow,
): FormEstablishmentDtoWithErrors => {
  let errors: z.ZodIssue[] = [];
  const mappedEstablishment: FormEstablishmentDto = {
    businessAddress: establishmentRow.businessAddress,
    businessName: establishmentRow.businessName,
    siret: establishmentRow.siret,
    businessNameCustomized: establishmentRow.businessNameCustomized,
    additionalInformation: establishmentRow.additionalInformation,
    naf: {
      code: establishmentRow.naf_code,
      nomenclature: "NAFRev2",
    },
    website: establishmentRow.website,
    source: "immersion-facile" as FormEstablishmentSource,
    appellations: establishmentAppellationsFromCSVToDto(
      establishmentRow.appellations_code,
    ),
    businessContact: {
      contactMethod: establishmentRow.businessContact_contactMethod,
      copyEmails: isCSVCellEmptyString(
        establishmentRow.businessContact_copyEmails,
      )
        ? []
        : establishmentCopyEmailsFromCSVToDto(
            establishmentRow.businessContact_copyEmails,
          ),
      email: establishmentRow.businessContact_email,
      firstName: establishmentRow.businessContact_firstName,
      job: establishmentRow.businessContact_job,
      lastName: establishmentRow.businessContact_lastName,
      phone: establishmentRow.businessContact_phone,
    },
    fitForDisabledWorkers: establishmentRow.fitForDisabledWorkers
      ? csvBooleanToBoolean(establishmentRow.fitForDisabledWorkers)
      : false,
    isEngagedEnterprise: csvBooleanToBoolean(
      establishmentRow.isEngagedEnterprise,
    ),
    maxContactsPerWeek: calculateMaxContactsPerWeek(
      establishmentRow.isSearchable,
    ),
  };
  try {
    formEstablishmentSchema.parse(mappedEstablishment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors = error.issues;
    }
  }
  return { ...mappedEstablishment, zodErrors: errors };
};

const calculateMaxContactsPerWeek = (isSearchable?: CSVBoolean) => {
  if (isSearchable === undefined) return defaultMaxContactsPerWeek;
  return csvBooleanToBoolean(isSearchable)
    ? defaultMaxContactsPerWeek
    : noContactPerWeek;
};

export const establishmentBatchEpics = [
  addEstablishmentBatchEpic,
  candidateEstablishmentParseEpic,
];
