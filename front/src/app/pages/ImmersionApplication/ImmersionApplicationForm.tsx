import { startOfToday } from "date-fns";
import { Formik } from "formik";
import { keys } from "ramda";
import React, { useEffect, useState } from "react";
import {
  SubmitFeedback,
  SuccessFeedbackKind,
} from "src/app/components/SubmitFeedback";
import { immersionApplicationGateway } from "src/app/config/dependencies";
import {
  createOrUpdateImmersionApplication,
  isImmersionApplicationFrozen,
  undefinedIfEmptyString,
} from "src/app/pages/ImmersionApplication/immersionApplicationHelpers";
import { ImmersionApplicationPresentation } from "src/app/pages/ImmersionApplication/ImmersionApplicationPage";
import { PeConnect } from "src/app/pages/ImmersionApplication/PeConnect";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "src/shared/ImmersionApplication/immersionApplication.schema";
import { toDateString } from "src/shared/utils/date";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Title } from "src/uiComponents/Title";
import { ApplicationFormFields } from "./ApplicationFormFields";

type ImmersionApplicationFormProps = {
  properties: ImmersionApplicationPresentation;
  routeParams?: { jwt?: string; demandeId?: string };
};

export const ImmersionApplicationForm = ({
  properties,
  routeParams = {},
}: ImmersionApplicationFormProps) => {
  const [initialValues, setInitialValues] = useState(properties);
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  useEffect(() => {
    if (!("demandeId" in routeParams) && !("jwt" in routeParams)) return;
    if (!("jwt" in routeParams) || routeParams.jwt === undefined) {
      return;
    }
    immersionApplicationGateway
      .getMagicLink(routeParams.jwt)
      .then((response) => {
        if (response.status === "DRAFT") {
          response.dateSubmission = toDateString(startOfToday());
        }
        setInitialValues(response);
      })
      .catch((e) => {
        console.log("fetch error", e);
        setSubmitFeedback(e);
      });
  }, []);

  const isFrozen = isImmersionApplicationFrozen(initialValues);

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
          validationSchema={toFormikValidationSchema(
            immersionApplicationSchema,
          )}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const immersionApplicationParsed: ImmersionApplicationDto =
                immersionApplicationSchema.parse(values);
              const immersionApplication: ImmersionApplicationDto = {
                ...immersionApplicationParsed,
                workConditions: undefinedIfEmptyString(
                  immersionApplicationParsed.workConditions,
                ),
              };

              await createOrUpdateImmersionApplication(
                routeParams,
                immersionApplication,
              );
              setInitialValues(immersionApplication);
              setSubmitFeedback("justSubmitted");
            } catch (e: any) {
              console.log(e);
              setSubmitFeedback(e);
            }
            setSubmitting(false);
          }}
        >
          {(props) => (
            <div>
              {keys(props.errors).length !== 0 && console.log(props.errors)}
              <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                <ApplicationFormFields isFrozen={isFrozen} />
                <SubmitFeedback submitFeedback={submitFeedback} />
              </form>
            </div>
          )}
        </Formik>
      </div>
    </div>
  );
};
