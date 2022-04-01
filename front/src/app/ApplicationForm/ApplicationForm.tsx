import { addDays, format, startOfToday } from "date-fns";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { ApplicationFormFields } from "src/app/ApplicationForm/ApplicationFormFields";
import { immersionApplicationGateway } from "src/app/dependencies";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { routes } from "src/app/routes";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import { Layout } from "src/components/Layout";
import { Title } from "src/components/Title";
import { ENV } from "src/environmentVariables";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { reasonableSchedule } from "src/shared/ScheduleSchema";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";
import { SubmitFeedback, SuccessFeedbackKind } from "./SubmitFeedback";
import { immersionApplicationSchema } from "../../shared/ImmersionApplication/immersionApplication.schema";
import { loginPeConnect } from "../../shared/routes";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

type ApplicationFormRoute = Route<typeof routes.immersionApplication>;

interface ApplicationFormProps {
  route: ApplicationFormRoute;
}

const isImmersionApplicationFrozen = (
  immersionApplication: Partial<ImmersionApplicationDto>,
): boolean =>
  !immersionApplication.status || immersionApplication.status !== "DRAFT";

const { dev } = ENV;

const createInitialApplication = (
  route: ApplicationFormRoute,
): Partial<ImmersionApplicationDto> => {
  const emptyForm: Partial<ImmersionApplicationDto> = {
    id: uuidV4(),
    status: "DRAFT",
    dateSubmission: toDateString(startOfToday()),

    // Participant
    email: route.params.email ?? "",
    firstName: route.params.firstName ?? "",
    lastName: route.params.lastName ?? "",
    phone: route.params.phone ?? "",
    postalCode: route.params.postalCode ?? "",
    dateStart:
      route.params.dateStart ?? toDateString(addDays(startOfToday(), 2)),
    dateEnd: route.params.dateEnd ?? toDateString(addDays(startOfToday(), 3)),
    peExternalId: route.params.peExternalId ?? undefined,

    // Enterprise
    siret: route.params.siret ?? "",
    businessName: route.params.businessName ?? "",
    mentor: route.params.mentor ?? "",
    mentorPhone: route.params.mentorPhone ?? "",
    mentorEmail: route.params.mentorEmail ?? "",
    schedule: route.params.schedule ?? reasonableSchedule,
    immersionAddress: route.params.immersionAddress ?? "",
    agencyId: route.params.agencyId ?? undefined,
    workConditions: route.params.workConditions ?? "",

    // Covid
    individualProtection: route.params.individualProtection ?? undefined,
    sanitaryPrevention: route.params.sanitaryPrevention ?? undefined,
    sanitaryPreventionDescription:
      route.params.sanitaryPreventionDescription ?? "",

    // Immersion
    immersionObjective: route.params.immersionObjective ?? "",
    immersionAppellation: route.params.immersionAppellation,
    immersionActivities: route.params.immersionActivities ?? "",
    immersionSkills: route.params.immersionSkills ?? "",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,
  };
  if (!dev) return emptyForm;

  return {
    ...emptyForm,

    // Participant
    email: emptyForm.email || "sylvanie@monemail.fr",
    firstName: emptyForm.firstName || "Sylvanie",
    lastName: emptyForm.lastName || "Durand",
    phone: emptyForm.phone || "0612345678",
    postalCode: emptyForm.postalCode || "75001",
    peExternalId: emptyForm.peExternalId || undefined,

    // Enterprise
    siret: emptyForm.siret || "1234567890123",
    businessName: emptyForm.businessName || "Futuroscope",
    mentor: emptyForm.mentor || "Le Mentor du futur",
    mentorPhone: emptyForm.mentorPhone || "0101100110",
    mentorEmail: emptyForm.mentorEmail || "mentor@supermentor.fr",
    immersionAddress:
      emptyForm.immersionAddress ||
      "Societe Du Parc Du Futuroscope PARC DU FUTUROSCOPE 86130 JAUNAY-MARIGNY",
    agencyId: emptyForm.agencyId || "test-agency-1-front",

    // Covid
    individualProtection: emptyForm.individualProtection ?? true,
    sanitaryPrevention: emptyForm.sanitaryPrevention ?? true,
    sanitaryPreventionDescription:
      emptyForm.sanitaryPreventionDescription || "Aucunes",

    // Immersion
    immersionObjective: emptyForm.immersionObjective || "",
    immersionAppellation: emptyForm.immersionAppellation || {
      romeLabel: "Boulanger / Boulangère",
      appellationLabel: "Boulangerie",
      romeCode: "D1502",
      appellationCode: "12278",
    },
    immersionActivities: emptyForm.immersionActivities || "Superviser",
    immersionSkills: emptyForm.immersionSkills || "Attention au détail",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,
  };
};

const currentJWT = (route: ApplicationFormRoute) => {
  if (!("jwt" in route.params)) {
    return "";
  }
  return route.params.jwt ?? "";
};

const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

export const ApplicationForm = ({ route }: ApplicationFormProps) => {
  const [initialValues, setInitialValues] = useState(
    createInitialApplication(route),
  );
  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  useEffect(() => {
    if (!("demandeId" in route.params) && !("jwt" in route.params)) return;
    if (!("jwt" in route.params) || route.params.jwt === undefined) {
      return;
    }
    immersionApplicationGateway
      .getML(route.params.jwt)
      .then((response) => {
        if (response.status === "DRAFT") {
          response.dateSubmission = toDateString(startOfToday());
        }
        setInitialValues(response);
      })
      .catch((e) => {
        console.log(e);
        setSubmitFeedback(e);
      });
  }, []);

  const isFrozen = isImmersionApplicationFrozen(initialValues);

  return (
    <Layout>
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
            agence/mission locale/espace solidarité apparaît dans la liste. Si
            ce n'est pas le cas, contactez votre conseiller. Il établira la
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

          <PeConnectButton />

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
                const shouldUpdateExistingImmersionApplication =
                  currentJWT(route).length > 0;
                if (shouldUpdateExistingImmersionApplication) {
                  await immersionApplicationGateway.updateML(
                    immersionApplication,
                    currentJWT(route),
                  );
                } else {
                  await immersionApplicationGateway.add(immersionApplication);
                }
                setInitialValues(immersionApplication);
                setSubmitFeedback("justSubmitted");
              } catch (e: any) {
                console.log(e);
                setSubmitFeedback(e);
              }
              setSubmitting(false);
            }}
          >
            {(props) => {
              return (
                <div>
                  {console.log(props.errors)}
                  <form
                    onReset={props.handleReset}
                    onSubmit={props.handleSubmit}
                  >
                    <ApplicationFormFields isFrozen={isFrozen} />
                    <SubmitFeedback submitFeedback={submitFeedback} />
                  </form>
                </div>
              );
            }}
          </Formik>
        </div>
      </div>
    </Layout>
  );
};

const PeConnectButton = () => {
  const featureFlags = useFeatureFlagsContext();

  if (!featureFlags.enablePeConnectApi) return null;
  return (
    <>
      <div className="fr-text">
        <p>
          <b>
            (Optionnel) Vous connecter avec votre identifiant Pôle emploi pour
            accélérer le traitement de votre demande de convention.
          </b>
        </p>
      </div>

      <div className="pe-connect flex justify-center">
        <a
          href={`/api/${loginPeConnect}`}
          className="button-pe-connect"
          title=""
        >
          <img
            className="icon-pe-connect"
            src="/pe-connect-barre-nav-b.svg"
            alt=""
            width="300"
            height="75"
          />
          <img
            className="icon-pe-connect-hover"
            src="/pe-connect-barre-nav-b-o.svg"
            alt=""
            width="300"
            height="75"
          />
        </a>
      </div>
    </>
  );
};
