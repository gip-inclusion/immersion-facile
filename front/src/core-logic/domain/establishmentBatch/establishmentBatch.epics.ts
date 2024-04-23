import { filter, map, switchMap } from "rxjs";
import {
  CSVBoolean,
  FormEstablishmentDto,
  FormEstablishmentSource,
  csvBooleanToBoolean,
  defaultMaxContactsPerWeek,
  establishmentAppellationsFromCSVToDto,
  establishmentCSVRowSchema,
  establishmentCopyEmailsFromCSVToDto,
  formEstablishmentSchema,
  isCSVCellEmptyString,
  noContactPerWeek,
} from "shared";
import { getAdminToken } from "src/core-logic/domain/admin/admin.helpers";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";
import {
  FormEstablishmentDtoWithErrors,
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
      adminGateway.addEstablishmentBatch$(
        action.payload,
        getAdminToken(state$.value),
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
