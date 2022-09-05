import { startOfToday } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  SubmitFeedback,
  SuccessFeedbackKind,
} from "src/app/components/SubmitFeedback";
import { conventionGateway } from "src/app/config/dependencies";
import {
  createOrUpdateConvention,
  isConventionFrozen,
  undefinedIfEmptyString,
} from "src/app/pages/Convention/conventionHelpers";
import { ConventionPresentation } from "src/app/pages/Convention/ConventionPage";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionWithoutExternalIdSchema } from "shared/src/convention/convention.schema";
import { toDateString } from "shared/src/utils/date";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Title } from "react-design-system/immersionFacile";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";
import { Notification } from "react-design-system/immersionFacile";

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
    federatedIdentity:
      properties.federatedIdentity ?? federatedIdentity ?? undefined,
  });
  useExistingSiret(initialValues.siret);
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
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

  const isFrozen = isConventionFrozen(initialValues);

  return (
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-7 fr-px-2w">
        <div className="flex justify-center">
          <Title red>
            Formulaire pour conventionner une période de mise en situation
            professionnelle (PMSMP)
          </Title>
        </div>
        <div className="fr-text">
          Bravo ! <br />
          Vous avez trouvé une entreprise pour vous accueillir en immersion.{" "}
          <br />
          Avant tout, vous devez faire établir une convention pour cette
          immersion et c'est ici que ça se passe. <br />
          En quelques minutes, complétez ce formulaire avec l'entreprise qui
          vous accueillera. <br />
          <p className="fr-text--xs">
            Ce formulaire vise à recueillir les données nécessaires à
            l’établissement de la convention d’immersion professionnelle en
            conformité avec le cerfa 13912 * 04.
          </p>
        </div>
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
                <SubmitFeedback submitFeedback={submitFeedback} />
              </form>
            </div>
          )}
        </Formik>
      </div>
    </div>
  );
};
