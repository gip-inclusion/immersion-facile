import { startOfToday } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Notification, Title } from "react-design-system/immersionFacile";
import {
  ConventionDto,
  conventionWithoutExternalIdSchema,
  toDateString,
} from "shared";
import { ConventionSubmitFeedbackNotification } from "src/app/components/ConventionSubmitFeedbackNotification";
import { conventionGateway } from "src/app/config/dependencies";
import {
  ConventionPresentation,
  createOrUpdateConvention,
  isConventionFrozen,
  undefinedIfEmptyString,
} from "src/app/pages/Convention/conventionHelpers";
import { useConventionTexts } from "src/app/pages/Convention/texts/textSetup";
import { useConventionSubmitFeedback } from "src/app/pages/Convention/useConventionSubmitFeedback";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";

type ConventionFormProps = {
  properties: ConventionPresentation;
  routeParams?: { jwt?: string; demandeId?: string };
};

export const ConventionForm = ({
  properties,
  routeParams = {},
}: ConventionFormProps) => {
  const federatedIdentity = useAppSelector(authSelectors.connectedWith);
  const [initialValues, setInitialValues] = useState<ConventionPresentation>({
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
  const { submitFeedback, setSubmitFeedback } = useConventionSubmitFeedback();

  useEffect(() => {
    if (!("demandeId" in routeParams) && !("jwt" in routeParams)) return;
    if (!("jwt" in routeParams) || routeParams.jwt === undefined) return;
    conventionGateway
      .getMagicLink(routeParams.jwt)
      .then((response) => {
        if (response.status === "DRAFT") {
          response.dateSubmission = toDateString(startOfToday());
        }
        setInitialValues(response);
      })
      .catch((e) => {
        //eslint-disable-next-line no-console
        console.log("conventionGateway fetch error : ", e);
        setSubmitFeedback(e);
      });
  }, []);

  const t = useConventionTexts(initialValues.internshipKind);

  const isFrozen = isConventionFrozen(initialValues);

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
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(
            conventionWithoutExternalIdSchema,
          )}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const conventionParsed =
                conventionWithoutExternalIdSchema.parse(values);
              const convention = {
                ...conventionParsed,
                workConditions: undefinedIfEmptyString(
                  conventionParsed.workConditions,
                ),
              } as ConventionDto;

              await createOrUpdateConvention(routeParams, convention);
              setInitialValues(convention);
              setSubmitFeedback({ kind: "justSubmitted" });
            } catch (e: any) {
              //eslint-disable-next-line no-console
              console.log("onSubmit error", e);
              setSubmitFeedback(e);
            }
            setSubmitting(false);
          }}
        >
          {(props) => (
            <div>
              <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                <ConventionFormFields isFrozen={isFrozen} />
                <ConventionSubmitFeedbackNotification
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
