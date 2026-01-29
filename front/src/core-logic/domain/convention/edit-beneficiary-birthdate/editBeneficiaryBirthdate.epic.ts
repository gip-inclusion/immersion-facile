import { filter } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { editBeneficiaryBirthdateSlice } from "src/core-logic/domain/convention/edit-beneficiary-birthdate/editBeneficiaryBirthdate.slice";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import type {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";

export type EditBeneficiaryBirthdateAction = ActionOfSlice<
  typeof editBeneficiaryBirthdateSlice
>;

type EditBeneficiaryBirthdateEpic = AppEpic<
  EditBeneficiaryBirthdateAction | { type: "do-nothing" }
>;

const editBeneficiaryBirthdateEpic: EditBeneficiaryBirthdateEpic = (
  action$,
  _,
  { conventionGateway },
) =>
  action$.pipe(
    filter(
      editBeneficiaryBirthdateSlice.actions.editBeneficiaryBirthdateRequested
        .match,
    ),
    switchMap((action) =>
      conventionGateway
        .editBeneficiaryBirthdate$(
          {
            conventionId: action.payload.conventionId,
            updatedBeneficiaryBirthDate:
              action.payload.updatedBeneficiaryBirthDate,
          },
          action.payload.jwt,
        )
        .pipe(
          map(() =>
            editBeneficiaryBirthdateSlice.actions.editBeneficiaryBirthdateSucceeded(
              action.payload,
            ),
          ),
          catchEpicError((error: Error) =>
            editBeneficiaryBirthdateSlice.actions.editBeneficiaryBirthdateFailed(
              {
                errorMessage: error.message,
                feedbackTopic: action.payload.feedbackTopic,
              },
            ),
          ),
        ),
    ),
  );

export const editBeneficiaryBirthdateEpics = [editBeneficiaryBirthdateEpic];
