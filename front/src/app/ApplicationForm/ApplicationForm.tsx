import { addDays, format, startOfToday } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { ApplicationFormFields } from "src/app/ApplicationForm/ApplicationFormFields";
import {
  createSuccessInfos,
  SuccessInfos,
} from "src/app/ApplicationForm/createSuccessInfos";
import { demandeImmersionGateway } from "src/app/main";
import { routes } from "src/app/routes";
import { MarianneHeader } from "src/components/MarianneHeader";
import { ENV } from "src/environmentVariables";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";
import {
  ApplicationSource,
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "src/shared/ImmersionApplicationDto";
import { reasonableSchedule } from "src/shared/ScheduleSchema";
import { toFormikValidationSchema } from "src/components/form/zodValidate";

type ApplicationFormRoute = Route<
  | typeof routes.demandeImmersion
  | typeof routes.boulogneSurMer
  | typeof routes.narbonne
>;

interface ApplicationFormProps {
  route: ApplicationFormRoute;
}

const isDemandeImmersionFrozen = (
  demandeImmersion: Partial<ImmersionApplicationDto>,
): boolean => !demandeImmersion.status || demandeImmersion.status !== "DRAFT";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

const { featureFlags, dev } = ENV;

const getApplicationSourceForRoute = (
  route: ApplicationFormRoute,
): ApplicationSource => {
  switch (route.name) {
    case "boulogneSurMer":
      return "BOULOGNE_SUR_MER";
    case "narbonne":
      return "NARBONNE";
    default:
      return "GENERIC";
  }
};

const createInitialApplication = (
  route: ApplicationFormRoute,
): Partial<ImmersionApplicationDto> => {
  const emptyForm: Partial<ImmersionApplicationDto> = {
    id: uuidV4(),
    status: "DRAFT",
    source: getApplicationSourceForRoute(route),
    dateSubmission: toDateString(startOfToday()),

    // Participant
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateStart: toDateString(addDays(startOfToday(), 2)),
    dateEnd: toDateString(addDays(startOfToday(), 3)),

    // Enterprise
    siret: "",
    businessName: "",
    mentor: "",
    mentorPhone: "",
    mentorEmail: "",
    schedule: reasonableSchedule,
    immersionAddress: "",

    // Covid
    individualProtection: undefined,
    sanitaryPrevention: undefined,
    sanitaryPreventionDescription: "",

    // Immersion
    immersionObjective: "",
    immersionProfession: "",
    immersionActivities: "",
    immersionSkills: "",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,
  };
  if (!dev) return emptyForm;

  return {
    ...emptyForm,

    // Participant
    email: "sylvanie@monemail.fr",
    firstName: "Sylvanie",
    lastName: "Durand",
    phone: "0612345678",

    // Enterprise
    siret: "12345678901234",
    businessName: "",
    mentor: "The Mentor",
    mentorPhone: "0687654321",
    mentorEmail: "mentor@supermentor.fr",
    immersionAddress: "",

    // Covid
    individualProtection: true,
    sanitaryPrevention: true,
    sanitaryPreventionDescription: "Aucunes",

    // Immersion
    immersionObjective: "",
    immersionProfession: "Chef d'atelier",
    immersionActivities: "Superviser",
    immersionSkills: "Attention au détail",

    // Signatures
    beneficiaryAccepted: true,
    enterpriseAccepted: true,
  };
};

export const ApplicationForm = ({ route }: ApplicationFormProps) => {
  const [initialValues, setInitialValues] = useState(
    createInitialApplication(route),
  );
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [successInfos, setSuccessInfos] = useState<SuccessInfos | null>(null);

  useEffect(() => {
    const { demandeId } = route.params;
    if (!demandeId) return;

    if (!featureFlags.enableViewableApplications) {
      const newLocation = "//" + location.host + location.pathname;
      history.replaceState(null, document.title, newLocation);
      return;
    }

    demandeImmersionGateway
      .get(demandeId)
      .then((response) => {
        if (response.status === "DRAFT") {
          response.dateSubmission = toDateString(startOfToday());
        }
        setInitialValues(response);
      })
      .catch((e) => {
        console.log(e);
        setSubmitError(e);
        setSuccessInfos(null);
      });
  }, []);

  const isFrozen = isDemandeImmersionFrozen(initialValues);

  return (
    <>
      <MarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w">
          <h2>
            Formulaire pour conventionner une période de mise en situation
            professionnelle (PMSMP)
          </h2>
          <div className="fr-text">
            Bravo ! <br />
            Vous avez trouvé une entreprise pour vous accueillir en immersion.{" "}
            <br />
            Avant tout, vous devez faire établir une convention pour cette
            immersion et c'est ici que ça se passe. <br />
            En quelques minutes, complétez ce formulaire avec l'entreprise qui
            vous accueillera. <br />
            <p className="fr-text--xs">
              Ce formulaire vaut équivalence de la signature du CERFA 13912 * 03
            </p>
          </div>

          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(
              immersionApplicationSchema,
            )}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                let application = immersionApplicationSchema.parse(values);

                let currentId = route.params.demandeId;
                if (!featureFlags.enableViewableApplications) {
                  application = {
                    ...application,
                    status: "IN_REVIEW",
                  };
                }

                const upsertedId = currentId
                  ? await demandeImmersionGateway.update(application)
                  : await demandeImmersionGateway.add(application);

                setInitialValues(application);

                let newUrl: string | undefined = undefined;
                if (featureFlags.enableViewableApplications) {
                  const queryParams = new URLSearchParams(
                    window.location.search,
                  );
                  queryParams.set("demandeId", upsertedId);
                  history.replaceState(
                    null,
                    document.title,
                    "?" + queryParams.toString(),
                  );
                  newUrl = window.location.href;
                }
                setSuccessInfos(createSuccessInfos(newUrl));
                setSubmitError(null);
              } catch (e: any) {
                console.log(e);
                setSubmitError(e);
                setSuccessInfos(null);
              }
              setSubmitting(false);
            }}
          >
            {(props) => (
              <div>
                <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                  <ApplicationFormFields
                    isFrozen={isFrozen}
                    submitError={submitError}
                    successInfos={successInfos}
                  />
                </form>
              </div>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};
