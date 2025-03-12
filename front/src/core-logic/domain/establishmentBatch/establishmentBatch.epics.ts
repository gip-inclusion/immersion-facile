import { filter, map, switchMap } from "rxjs";
import {
  type AbsoluteUrl,
  type CSVBoolean,
  type FormEstablishmentDto,
  type FormEstablishmentSource,
  csvBooleanToBoolean,
  defaultMaxContactsPerMonth,
  establishmentAppellationsFromCSVToDto,
  establishmentCSVRowSchema,
  establishmentCopyEmailsFromCSVToDto,
  formEstablishmentSchema,
  isCSVCellEmptyString,
  noContactPerMonth,
} from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";
import {
  type FormEstablishmentDtoWithErrors,
  establishmentBatchSlice,
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
      adminGateway
        .addEstablishmentBatch$(
          action.payload.formEstablishmentBatch,
          getAdminToken(state$.value),
        )
        .pipe(
          map((batchResponse) =>
            establishmentBatchSlice.actions.addEstablishmentBatchSucceeded({
              establishmentBatchReport: batchResponse,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
          catchEpicError((error) =>
            establishmentBatchSlice.actions.addEstablishmentBatchErrored({
              errorMessage: error.message,
              feedbackTopic: action.payload.feedbackTopic,
            }),
          ),
        ),
    ),
  );

export const candidateEstablishmentMapper = (
  csvRow: unknown,
): FormEstablishmentDtoWithErrors => {
  let errors: z.ZodIssue[] = [];
  let mappedEstablishment: FormEstablishmentDto | null = null;
  try {
    const establishmentRow = establishmentCSVRowSchema.parse(csvRow);
    mappedEstablishment = {
      businessAddresses: [
        {
          id: uuidV4(),
          rawAddress: establishmentRow.businessAddress,
        },
      ],
      businessName: establishmentRow.businessName,
      siret: establishmentRow.siret,
      businessNameCustomized: establishmentRow.businessNameCustomized,
      additionalInformation: establishmentRow.additionalInformation,
      naf: {
        code: establishmentRow.naf_code,
        nomenclature: "NAFRev2",
      },
      website: establishmentRow.website as AbsoluteUrl | "",
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
      maxContactsPerMonth: calculateMaxContactsPerMonth(
        establishmentRow.isSearchable,
      ),
      searchableBy: {
        jobSeekers: csvBooleanToBoolean(
          establishmentRow.searchableByJobSeekers,
        ),
        students: csvBooleanToBoolean(establishmentRow.searchableByStudents),
      },
    };

    formEstablishmentSchema.parse(mappedEstablishment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors = error.issues;
    }
  }
  return { formEstablishment: mappedEstablishment, zodErrors: errors };
};

const calculateMaxContactsPerMonth = (isSearchable?: CSVBoolean) => {
  if (isSearchable === undefined) return defaultMaxContactsPerMonth;
  return csvBooleanToBoolean(isSearchable)
    ? defaultMaxContactsPerMonth
    : noContactPerMonth;
};

export const establishmentBatchEpics = [
  addEstablishmentBatchEpic,
  candidateEstablishmentParseEpic,
];
