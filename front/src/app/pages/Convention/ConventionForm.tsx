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
import { PeConnect } from "src/app/pages/Convention/PeConnect";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { toDateString } from "shared/src/utils/date";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Title } from "src/uiComponents/Title";
import { ConventionFormFields } from "./ConventionFormFields";

type ConventionFormProps = {
  properties: ConventionPresentation;
  routeParams?: { jwt?: string; demandeId?: string };
};

export const ConventionForm = ({
  properties,
  routeParams = {},
}: ConventionFormProps) => {
  const [initialValues, setInitialValues] = useState(properties);
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
      <div className="fr-col-lg-8 fr-p-2w">
        <div className="flex justify-center">
          <Title red>
            Formulaire pour conventionner une période de mise en situation
            professionnelle (PMSMP)
          </Title>
        </div>

        <div className="fr-text">
          <span className="font-bold">
            Attention, le formulaire de demande de convention est en cours de
            test dans quelques départements ou villes.
          </span>
          <br />
          Il ne peut être utilisé que si votre conseiller ou votre
          agence/mission locale/espace solidarité apparaît dans la liste. Si ce
          n'est pas le cas, contactez votre conseiller. Il établira la
          convention avec vous et l'entreprise qui va vous accueillir.
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
            Ce formulaire vaut équivalence du CERFA 13912 * 04
          </p>
        </div>

        <PeConnect />

        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(conventionSchema)}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const conventionParsed = conventionSchema.parse(values);
              const convention: ConventionDto = {
                ...conventionParsed,
                workConditions: undefinedIfEmptyString(
                  conventionParsed.workConditions,
                ),
              };

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
