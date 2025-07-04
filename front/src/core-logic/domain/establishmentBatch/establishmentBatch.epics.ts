import { uniq } from "ramda";
import { filter, map, switchMap } from "rxjs";
import {
  type AbsoluteUrl,
  type CSVBoolean,
  csvBooleanToBoolean,
  defaultMaxContactsPerMonth,
  type EstablishmentCSVRow,
  type EstablishmentRole,
  establishmentAppellationsFromCSVToDto,
  establishmentCSVRowSchema,
  type FormEstablishmentDto,
  type FormEstablishmentSource,
  type FormEstablishmentUserRight,
  formEstablishmentSchema,
  keys,
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
  establishmentBatchSlice,
  type FormEstablishmentDtoWithErrors,
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
      userRights: makeUserRightsFromCSV(establishmentRow),
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
      contactMode: establishmentRow.contactMode,
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

const makeUserRightsFromCSV = (
  csvRow: EstablishmentCSVRow,
): FormEstablishmentUserRight[] => {
  const otherThanAdminRightsKeys = keys(csvRow).filter(
    (csvRowKey) =>
      csvRowKey.includes("right" as keyof EstablishmentCSVRow) &&
      !csvRowKey.includes("1"),
  );

  const otherThanAdminUserRights = uniq(
    otherThanAdminRightsKeys.map((key) => key.split("_")[0]),
  ).reduce<FormEstablishmentUserRight[]>((acc, current) => {
    const role = csvRow[`${current}_role` as keyof EstablishmentCSVRow] as
      | EstablishmentRole
      | undefined;
    const job = csvRow[`${current}_job` as keyof EstablishmentCSVRow] satisfies
      | string
      | undefined;
    const phone = csvRow[`${current}_phone` as keyof EstablishmentCSVRow];
    const email = csvRow[`${current}_email` as keyof EstablishmentCSVRow];
    return [
      ...acc,
      ...(role && phone && job && email
        ? ([
            {
              role,
              job,
              phone,
              email,
              shouldReceiveDiscussionNotifications: true,
            },
          ] as FormEstablishmentUserRight[])
        : []),
    ];
  }, []);

  return [
    {
      role: "establishment-admin",
      email: csvRow.right1_email,
      job: csvRow.right1_job,
      phone: csvRow.right1_phone,
      shouldReceiveDiscussionNotifications: true,
    },
    ...otherThanAdminUserRights,
  ];
};
