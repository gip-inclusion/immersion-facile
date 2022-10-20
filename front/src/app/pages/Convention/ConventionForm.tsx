import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Notification, Title } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  conventionWithoutExternalIdSchema,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/ConventionFeedbackNotification";
import {
  ConventionPresentation,
  isConventionFrozen,
  undefinedIfEmptyString,
} from "src/app/pages/Convention/conventionHelpers";
import { useConventionTexts } from "src/app/pages/Convention/texts/textSetup";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";

const useClearConventionSubmitFeedbackOnUnmount = () => {
  const dispatch = useDispatch();
  useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFeedbackTriggered());
    },
    [],
  );
};

const useWaitForReduxFormUiReadyBeforeFormikInitialisation = (
  initialValues: ConventionPresentation,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(isBeneficiaryMinor(initialValues)),
    );
    dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
      ),
    );
    setReduxFormUiReady(true);
  }, []);

  return reduxFormUiReady;
};

type ConventionFormProps = {
  properties: ConventionPresentation;
  routeParams?: { jwt?: string; demandeId?: string };
};

export const ConventionForm = ({
  properties,
  routeParams = {},
}: ConventionFormProps) => {
  const federatedIdentity = useAppSelector(authSelectors.connectedWith);
  const [initialValues] = useState<ConventionPresentation>({
    ...properties,
    signatories: {
      ...properties.signatories,
      beneficiary: {
        ...properties.signatories.beneficiary,
        federatedIdentity:
          properties.signatories.beneficiary.federatedIdentity ??
          federatedIdentity ??
          undefined,
      },
    },
  });

  useExistingSiret(initialValues.siret);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!("demandeId" in routeParams) && !("jwt" in routeParams)) return;
    if (!("jwt" in routeParams) || routeParams.jwt === undefined) return;
    dispatch(conventionSlice.actions.jwtProvided(routeParams.jwt));
    dispatch(conventionSlice.actions.fetchConventionRequested(routeParams.jwt));
  }, []);

  const reduxFormUiReady =
    useWaitForReduxFormUiReadyBeforeFormikInitialisation(initialValues);

  useClearConventionSubmitFeedbackOnUnmount();

  const t = useConventionTexts(initialValues.internshipKind);

  const isFrozen = isConventionFrozen(initialValues);

  if (!reduxFormUiReady) return null;

  return (
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-7 fr-px-2w">
        <div className="flex justify-center">
          <Title red>{t.conventionTitle}</Title>
        </div>
        <p className="fr-text">{t.welcome}</p>
        <Notification type="info" title="">
          Vérifiez que votre structure d’accompagnement est disponible dans la
          liste ci-dessous.{" "}
          <strong>Si ce n’est pas le cas, contactez votre conseiller.</strong>
        </Notification>

        <Formik
          enableReinitialize={true}
          initialValues={fetchedConvention ?? initialValues}
          validationSchema={toFormikValidationSchema(
            conventionWithoutExternalIdSchema,
          )}
          onSubmit={(values) => {
            const conventionToSave = {
              ...values,
              workConditions: undefinedIfEmptyString(values.workConditions),
            } as ConventionDto;
            dispatch(
              conventionSlice.actions.saveConventionRequested(conventionToSave),
            );
          }}
        >
          {(props) => (
            <div>
              <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                <ConventionFormFields isFrozen={isFrozen} />
                <ConventionFeedbackNotification
                  submitFeedback={submitFeedback}
                  signatories={props.values.signatories}
                />
              </form>
            </div>
          )}
        </Formik>
      </div>
    </div>
  );
};
