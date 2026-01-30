import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  type Beneficiary,
  hasBeneficiaryCurrentEmployer,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isFtConnectIdentity,
} from "shared";
import type { ConventionFormMode } from "src/app/components/forms/convention/ConventionFormWrapper";
import type { FederatedIdentityWithUser } from "src/core-logic/domain/auth/auth.slice";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import type { CreateConventionPresentationInitialValues } from "../../../../../../shared/src/convention/conventionPresentation.dto";

export type EmailValidationErrorsState = Partial<
  Record<
    | "Bénéficiaire"
    | "Responsable d'entreprise"
    | "Tuteur de l'entreprise"
    | "Représentant légal du bénéficiaire"
    | "Employeur actuel du bénéficiaire",
    ReactNode
  >
>;
export type SetEmailValidationErrorsState = Dispatch<
  SetStateAction<EmailValidationErrorsState>
>;

export const makeInitialBenefiaryForm = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
  federatedIdentityWithUser: FederatedIdentityWithUser | null,
): Beneficiary<"immersion" | "mini-stage-cci"> => {
  const { federatedIdentity, ...beneficiaryOtherProperties } = beneficiary;
  const peConnectIdentity =
    federatedIdentityWithUser && isFtConnectIdentity(federatedIdentityWithUser)
      ? federatedIdentityWithUser
      : undefined;
  const federatedIdentityValue = federatedIdentity ?? peConnectIdentity;

  return {
    ...beneficiaryOtherProperties,
    federatedIdentity: federatedIdentityValue,
  };
};

export const useWaitForReduxFormUiReadyBeforeInitialisation = (
  initialValues: CreateConventionPresentationInitialValues,
  mode: ConventionFormMode,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(
        isBeneficiaryMinor({
          beneficiaryRepresentative:
            initialValues.signatories.beneficiaryRepresentative,
          beneficiaryBirthdate: initialValues.signatories.beneficiary.birthdate,
          conventionDateStart: initialValues.dateStart,
        }),
      ),
    );
    dispatch(
      conventionSlice.actions.isCurrentEmployerChanged(
        hasBeneficiaryCurrentEmployer(initialValues),
      ),
    );
    if (mode !== "edit") {
      dispatch(
        conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
          isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
        ),
      );
    }
    setReduxFormUiReady(true);
  }, [dispatch, initialValues, mode]);

  return reduxFormUiReady;
};
