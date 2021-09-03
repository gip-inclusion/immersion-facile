import React, { useEffect, useState } from "react";
import { Formik, useFormikContext, useField, FieldHookConfig } from "formik";
import { demandeImmersionGateway } from "src/app/main";
import { BoolRadioGroup, RadioGroup } from "src/app/radioGroup";
import { routes } from "src/app/routes";
import { DateInput } from "src/components/form/DateInput";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import {
  DemandeImmersionDto,
  demandeImmersionDtoSchema,
} from "src/shared/DemandeImmersionDto";
import { addDays, format, startOfToday } from "date-fns";
import { AxiosError } from "axios";
import { Route } from "type-route";
import { MarianneHeader } from "src/components/MarianneHeader";
import { v4 as uuidV4 } from "uuid";
import {
  BoolCheckboxGroup,
  CheckboxGroup,
} from "src/components/form/CheckboxGroup";
import { SchedulePicker } from "src/components/form/SchedulePicker/SchedulePicker";
import { reasonableSchedule } from "src/shared/ScheduleSchema";

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
          setFieldValue("immersionAddress", info.address);
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

interface FormulaireProps {
  route: Route<typeof routes.demandeImmersion>;
}

const isDemandeImmersionFrozen = (
  demandeImmersion: DemandeImmersionDto
): boolean => demandeImmersion.status !== "DRAFT";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

const createInitialDemandeImmersion = (): DemandeImmersionDto => {
  return {
    id: uuidV4(),
    status: "DRAFT",
    // Participant
    email: "sylvanie@monemail.fr",
    firstName: "Sylanie",
    lastName: "Durand",
    phone: "0612345678",
    dateSubmission: toDateString(startOfToday()),
    dateStart: toDateString(addDays(startOfToday(), 2)),
    dateEnd: toDateString(addDays(startOfToday(), 3)),

    // Enterprise
    siret: "12345678912345",
    businessName: "Ma petite entreprise ne connait pas la crise",
    mentor: "The Mentor",
    mentorPhone: "0687654321",
    mentorEmail: "mentor@supermentor.fr",
    schedule: reasonableSchedule,
    immersionAddress: "Quelque Part",

    // Covid
    individualProtection: false,
    sanitaryPrevention: false,
    sanitaryPreventionDescription: "Aucunes",

    // Immersion
    immersionObjective: "Valider coaching d'équipe",
    immersionProfession: "Chef d'atelier",
    immersionActivities: "Superviser",
    immersionSkills: "Attention au détail",

    // Signatures
    beneficiaryAccepted: false,
    enterpriseAccepted: false,
  };
};

export const DemandeImmersionForm = ({ route }: FormulaireProps) => {
  const [initialValues, setInitialValues] = useState(
    createInitialDemandeImmersion()
  );
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [formLink, setFormLink] = useState<string | null>(null);
  const [isFetchingSiret, setIsFetchingSiret] = useState<boolean>(false);

  useEffect(() => {
    const { demandeId } = route.params;
    if (!demandeId) return;

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
        setFormLink(e);
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
              console.log(values);

              try {
                const demandeImmersion =
                  await demandeImmersionDtoSchema.validate(values);

                const currentId = route.params.demandeId;
                const upsertedId = currentId
                  ? await demandeImmersionGateway.update(demandeImmersion)
                  : await demandeImmersionGateway.add(demandeImmersion);

                const queryParams = new URLSearchParams(window.location.search);
                queryParams.set("demandeId", upsertedId);
                history.replaceState(
                  null,
                  document.title,
                  "?" + queryParams.toString()
                );

                const newURL = window.location.href;

                setSubmitError(null);
                setFormLink(newURL);
              } catch (e) {
                console.log(e);
                setSubmitError(e);
                setFormLink(null);
              }
              setSubmitting(false);
            }}
          >
            {(props) => (
              <div>
                <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
                  {isFrozen && <FrozenMessage />}

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
                    placeholder="alain.prost@exemple.com"
                    description="pour envoyer la validation de la convention"
                    disabled={isFrozen}
                  />

                  <SchedulePicker
                    name="schedule"
                    setFieldValue={(x) => {
                      props.setFieldValue("schedule", x);
                    }}
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
                    label="Un équipement de protection individuelle est-il fourni pour l’immersion ?"
                    formikHelpers={props}
                    hideNoOption={false}
                    description=""
                    descriptionLink=""
                    disabled={isFrozen}
                  />

                  <BoolRadioGroup
                    name="sanitaryPrevention"
                    label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
                    formikHelpers={props}
                    hideNoOption={false}
                    description=""
                    descriptionLink=""
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

                  {submitError && (
                    <ErrorMessage
                      title="Erreur de serveur"
                      message={submitError.message}
                    />
                  )}

                  {formLink && (
                    <SuccessMessage
                      link={formLink}
                      title="Succès de l'envoi"
                      text="Vous avez enregistré votre formulaire et vous pouvez le modifier avec le lien suivant:"
                    />
                  )}

                  <p />

                  <button
                    className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                    type="submit"
                    disabled={props.isSubmitting || isFrozen}
                  >
                    {props.isSubmitting ? "Éxecution" : "Sauvegarder"}
                  </button>
                </form>
              </div>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};
