import { AxiosError } from "axios";
import { addDays, format, startOfToday } from "date-fns";
import { FieldHookConfig, Formik, useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { demandeImmersionGateway } from "src/app/main";
import { BoolRadioGroup, RadioGroup } from "src/app/RadioGroup";
import { routes } from "src/app/routes";
import { BoolCheckboxGroup } from "src/components/form/CheckboxGroup";
import { DateInput } from "src/components/form/DateInput";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import {
  SchedulePicker,
  scheduleValidator,
} from "src/components/form/SchedulePicker/SchedulePicker";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { MarianneHeader } from "src/components/MarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  ApplicationSource,
  DemandeImmersionDto,
  demandeImmersionDtoSchema,
} from "src/shared/DemandeImmersionDto";
import { reasonableSchedule } from "src/shared/ScheduleSchema";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";

const fetchCompanyInfoBySiret = async (siret: string) => {
  const addressDictToString = (addressDict: any): string => {
    const addressOrder = [
      "numeroVoieEtablissement",
      "typeVoieEtablissement",
      "libelleVoieEtablissement",
      "codePostalEtablissement",
      "libelleCommuneEtablissement",
    ];

    let addressString = "";
    for (const field of addressOrder) {
      addressString += (addressDict[field] ?? "") + " ";
    }
    return addressString.trim();
  };

  return demandeImmersionGateway.getSiretInfo(siret).then((info: any) => {
    const establishment = info["etablissements"][0];
    const nom = establishment["uniteLegale"]["denominationUniteLegale"];
    const address = addressDictToString(establishment["adresseEtablissement"]);

    return { nom, address };
  });
};

interface SiretFields {
  siret: string;
  immersionAddress: string;
}

type SiretAutocompletedFieldProps = {
  disabled: boolean;
  setIsFetchingSiret: (state: boolean) => void;
} & FieldHookConfig<string>;

const SiretAutocompletedField = (props: SiretAutocompletedFieldProps) => {
  const {
    values: { siret },
    setFieldValue,
    setFieldError,
    touched,
  } = useFormikContext<SiretFields>();
  const [field, meta] = useField(props);

  React.useEffect(() => {
    let isCurrent: boolean = true;
    const sanitizedSiret = siret.replace(/\s/g, "");
    if (sanitizedSiret.length != 14) {
      return;
    }
    props.setIsFetchingSiret(true);
    fetchCompanyInfoBySiret(sanitizedSiret)
      .then((info: any) => {
        if (isCurrent) {
          setFieldValue(props.name, sanitizedSiret);
          setFieldValue("businessName", info.nom);
          if (!touched.immersionAddress) {
            setFieldValue("immersionAddress", info.address);
          }
        }
      })
      .catch((err: AxiosError) => {
        if (err.isAxiosError && err.code === "404") {
          setFieldError(props.name, "SIRET inconnu ou inactif");
        } else {
          setFieldError(props.name, err.message);
        }
      })
      .finally(() => props.setIsFetchingSiret(false));
    return () => {
      isCurrent = false;
    };
  }, [siret, setFieldValue, setFieldError, props.name]);

  return (
    <>
      <TextInput
        label="Indiquez le SIRET de la structure d'accueil *"
        name="siret"
        type="number"
        placeholder="362 521 879 00034"
        description="la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
        disabled={props.disabled}
      />
    </>
  );
};

const FrozenMessage = () => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
        Cette demande d'immersion n'est pas modifiable.
      </p>
      <p>
        Cette demande d'immersion a été validé par vôtre conseiller et il n'est
        plus possible de la modifier.
      </p>
    </div>
    <br />
  </>
);

type ApplicationFormRoute = Route<
  | typeof routes.demandeImmersion
  | typeof routes.boulogneSurMer
  | typeof routes.narbonne
>;

interface ApplicationFormProps {
  route: ApplicationFormRoute;
}

const isDemandeImmersionFrozen = (
  demandeImmersion: DemandeImmersionDto
): boolean => !demandeImmersion.status || demandeImmersion.status !== "DRAFT";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

const { featureFlags, dev } = ENV;

const getApplicationSourceForRoute = (
  route: ApplicationFormRoute
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
  route: ApplicationFormRoute
): DemandeImmersionDto => {
  const emptyForm: DemandeImmersionDto = {
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
    individualProtection: false,
    sanitaryPrevention: false,
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
    firstName: "Sylanie",
    lastName: "Durand",
    phone: "0612345678",

    // Enterprise
    siret: "12345678912345",
    businessName: "Ma petite entreprise ne connait pas la crise",
    mentor: "The Mentor",
    mentorPhone: "0687654321",
    mentorEmail: "mentor@supermentor.fr",
    immersionAddress: "Quelque Part",

    // Covid
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

interface SuccessProps {
  message: string;
  link: string | undefined;
}

const createSuccessProps = (link: string | undefined): SuccessProps => ({
  message: link
    ? "Succès d'envoi. Vous pouvez acceder votre demande grâce un lien suivante :"
    : `Merci d'avoir complété ce formulaire. Il va être transmis à votre conseiller
      référent. Il vous informera par mail de la validation ou non de l'immersion.
      Le tuteur qui vous encadrera pendant cette période recevra aussi la réponse.
      Attention, ne démarrez jamais une immersion tant que vous n'avez pas reçu de
      validation ! Bonne journée !`,
  link,
});

export const ApplicationForm = ({ route }: ApplicationFormProps) => {
  const [initialValues, setInitialValues] = useState(
    createInitialApplication(route)
  );
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [successProps, setSuccessProps] = useState<SuccessProps | null>(null);
  const [isFetchingSiret, setIsFetchingSiret] = useState<boolean>(false);

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
        setSuccessProps(null);
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
            validationSchema={demandeImmersionDtoSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                let application = await demandeImmersionDtoSchema.validate(
                  values
                );

                let currentId = route.params.demandeId;
                if (!featureFlags.enableViewableApplications) {
                  application = {
                    ...application,
                    status: "FINALIZED",
                  };
                }

                const upsertedId = currentId
                  ? await demandeImmersionGateway.update(application)
                  : await demandeImmersionGateway.add(application);

                setInitialValues(application);

                let newUrl: string | undefined = undefined;
                if (featureFlags.enableViewableApplications) {
                  const queryParams = new URLSearchParams(
                    window.location.search
                  );
                  queryParams.set("demandeId", upsertedId);
                  history.replaceState(
                    null,
                    document.title,
                    "?" + queryParams.toString()
                  );
                  newUrl = window.location.href;
                }
                setSuccessProps(createSuccessProps(newUrl));
                setSubmitError(null);
              } catch (e: any) {
                console.log(e);
                setSubmitError(e);
                setSuccessProps(null);
              }
              setSubmitting(false);
            }}
          >
            {(props) => (
              <div>
                <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                  {isFrozen && featureFlags.enableViewableApplications && (
                    <FrozenMessage />
                  )}

                  <TextInput
                    label="Email *"
                    name="email"
                    type="email"
                    placeholder="nom@exemple.com"
                    description="cela nous permet de vous transmettre la validation de la convention"
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Votre nom *"
                    name="firstName"
                    type="text"
                    placeholder=""
                    description=""
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Votre prénom *"
                    name="lastName"
                    type="text"
                    placeholder=""
                    description=""
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Votre numéro de téléphone"
                    name="phone"
                    type="tel"
                    placeholder="0606060607"
                    description="pour qu’on puisse vous contacter à propos de l’immersion"
                    disabled={isFrozen}
                  />

                  <DateInput
                    label="Date de debut de l'immersion *"
                    name="dateStart"
                    type="date"
                    disabled={isFrozen}
                  />

                  <DateInput
                    label="Date de fin de l'immersion *"
                    name="dateEnd"
                    type="date"
                    disabled={isFrozen}
                  />

                  <h4>
                    <br />
                    Les questions suivantes doivent être complétées avec la
                    personne qui vous accueillera pendant votre immersion
                  </h4>

                  <SiretAutocompletedField
                    name="siret"
                    disabled={isFrozen}
                    setIsFetchingSiret={setIsFetchingSiret}
                  />

                  <TextInput
                    label="Indiquez le nom (raison sociale) de l'établissement d'accueil *"
                    name="businessName"
                    type="text"
                    placeholder=""
                    description=""
                    disabled={isFrozen || isFetchingSiret}
                  />

                  <TextInput
                    label="Indiquez le prénom, nom et fonction du tuteur *"
                    name="mentor"
                    type="text"
                    placeholder=""
                    description="Ex : Alain Prost, pilote automobile"
                    disabled={isFrozen || isFetchingSiret}
                  />

                  <TextInput
                    label="Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil *"
                    name="mentorPhone"
                    type="tel"
                    placeholder="0606060707"
                    description="pour qu’on puisse le contacter à propos de l’immersion"
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Indiquez l'e-mail du tuteur *"
                    name="mentorEmail"
                    type="email"
                    placeholder="nom@exemple.com"
                    description="pour envoyer la validation de la convention"
                    disabled={isFrozen}
                  />

                  <SchedulePicker
                    name="schedule"
                    validate={scheduleValidator}
                    setFieldValue={(x) => {
                      props.setFieldValue("schedule", x);
                    }}
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Adresse du lieu où se fera l'immersion"
                    name="immersionAddress"
                    type="text"
                    placeholder=""
                    description=""
                    disabled={isFrozen || isFetchingSiret}
                  />

                  <BoolRadioGroup
                    name="individualProtection"
                    label="Un équipement de protection individuelle est-il fourni pour l’immersion ? *"
                    hideNoOption={false}
                    disabled={isFrozen}
                  />

                  <BoolRadioGroup
                    name="sanitaryPrevention"
                    label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
                    hideNoOption={false}
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Si oui, précisez-les"
                    name="sanitaryPreventionDescription"
                    type="text"
                    placeholder=""
                    description="Ex : fourniture de gel, de masques"
                    disabled={isFrozen}
                  />

                  <RadioGroup
                    name="immersionObjective"
                    label="Objectif  de la période de mise en situation en milieu professionnel"
                    values={[
                      "Confirmer un projet professionnel",
                      "Découvrir un métier ou un secteur d'activité",
                      "Initier une démarche de recrutement",
                    ]}
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Intitulé du poste / métier observé pendant l'immersion *"
                    name="immersionProfession"
                    type="text"
                    placeholder=""
                    description="Ex : employé libre service, web développeur, boulanger …"
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Activités observées / pratiquées pendant l'immersion *"
                    name="immersionActivities"
                    type="text"
                    placeholder=""
                    description="Ex : mise en rayon, accueil et aide à la clientèle"
                    disabled={isFrozen}
                  />

                  <TextInput
                    label="Compétences/aptitudes observées / évaluées pendant l'immersion"
                    name="immersionSkills"
                    type="text"
                    placeholder=""
                    description="Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe"
                    disabled={isFrozen}
                  />

                  <p />

                  <BoolCheckboxGroup
                    name="beneficiaryAccepted"
                    label={
                      "Je (bénéficiaire de l'immersion) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
                    }
                    formikHelpers={props}
                    description="Avant de répondre, consultez ces dispositions ici"
                    descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                    disabled={isFrozen}
                  />

                  <BoolCheckboxGroup
                    name="enterpriseAccepted"
                    label={
                      "Je (représentant de la structure d'accueil ) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
                    }
                    formikHelpers={props}
                    description="Avant de répondre, consultez ces dispositions ici"
                    descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                    disabled={isFrozen}
                  />

                  <p />

                  {props.submitCount !== 0 && props.errors && (
                    <div style={{ color: "red" }}>
                      Veuillez corriger les champs erronés
                    </div>
                  )}

                  {submitError && (
                    <ErrorMessage
                      title="Erreur de serveur"
                      message={submitError.message}
                    />
                  )}

                  {successProps && (
                    <SuccessMessage
                      link={successProps.link}
                      title="Succès de l'envoi"
                      text={successProps.message}
                    />
                  )}

                  <p />

                  {!isFrozen && (
                    <button
                      className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                      type="submit"
                      disabled={props.isSubmitting || isFrozen}
                    >
                      {props.isSubmitting
                        ? "Éxecution"
                        : featureFlags.enableViewableApplications
                        ? "Sauvegarder"
                        : "Envoyer la demande"}
                    </button>
                  )}
                </form>
              </div>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};
