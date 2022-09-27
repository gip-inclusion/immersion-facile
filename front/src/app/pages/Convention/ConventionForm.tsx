import { startOfToday } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Notification, Title } from "react-design-system/immersionFacile";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionWithoutExternalIdSchema } from "shared/src/convention/convention.schema";
import { toDateString } from "shared/src/utils/date";
import {
  ConventionSubmitFeedback,
  SuccessFeedbackKindConvention,
} from "src/app/components/ConventionSubmitFeedback";
import { conventionGateway } from "src/app/config/dependencies";
import {
  createOrUpdateConvention,
  isConventionFrozen,
  undefinedIfEmptyString,
} from "src/app/pages/Convention/conventionHelpers";
import { ConventionPresentation } from "src/app/pages/Convention/ConventionPage";
import { useConventionTexts } from "src/app/pages/Convention/texts/textSetup";
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
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKindConvention | Error | null
  >(null);

  useEffect(() => {
    if (!("demandeId" in routeParams) && !("jwt" in routeParams)) return;
    if (!("jwt" in routeParams) || routeParams.jwt === undefined) {
      return;
    }
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
        <div className="fr-text">{t.welcome}</div>
        <Notification
          type="info"
          title="Attention, le formulaire de demande de convention n'est pas encore déployé partout en France."
        >
          Si votre conseiller emploi ou votre structure d'accompagnement
          apparaît, vous pouvez l'utiliser.
          <br />
          Si ce n'est pas le cas, contactez directement votre conseiller pour
          établir une convention papier.
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
              setSubmitFeedback("justSubmitted");
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
                <ConventionSubmitFeedback
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
