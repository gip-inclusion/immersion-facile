import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { editConventionWithFinalStatusSlice } from "src/core-logic/domain/convention/edit-convention-with-final-status/editConventionWithFinalStatus.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type EditConventionWithFinalStatusAction = ActionOfSlice<
  typeof editConventionWithFinalStatusSlice
>;

type EditConventionWithFinalStatusEpic = AppEpic<
  EditConventionWithFinalStatusAction | { type: "do-nothing" }
>;

const editConventionWithFinalStatusEpic: EditConventionWithFinalStatusEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      editConventionWithFinalStatusSlice.actions
        .editConventionWithFinalStatusRequested.match,
    ),
    switchMap((action) =>
      conventionGateway
        .editConventionWithFinalStatus$(
          {
            conventionId: action.payload.conventionId,
            updatedBeneficiaryBirthDate:
              action.payload.updatedBeneficiaryBirthDate,
            dateStart: action.payload.dateStart,
            internshipKind: action.payload.internshipKind,
            firstname: action.payload.firstname,
            lastname: action.payload.lastname,
          },
          action.payload.jwt,
        )
        .pipe(
          map(() =>
            editConventionWithFinalStatusSlice.actions.editConventionWithFinalStatusSucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error: Error) =>
            editConventionWithFinalStatusSlice.actions.editConventionWithFinalStatusFailed(
              {
                errorMessage: error.message,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

export const editConventionWithFinalStatusEpics = [
  editConventionWithFinalStatusEpic,
];
