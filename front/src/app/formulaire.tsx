import React, { Component, useDebugValue, useEffect } from "react";
import {
  Formik,
  useFormikContext,
  useField,
  FormikState,
  FieldHookConfig,
  Field,
  FormikHelpers,
} from "formik";
import { formulaireGateway } from "src/app/main";
import {
  FormulaireDto,
  formulaireDtoSchema,
  FormulaireStatus,
} from "src/shared/FormulaireDto";
import { addDays, format, startOfToday } from "date-fns";
import { AxiosError } from "axios";
import { MarianneHeader } from "./Components/Header";

type MyDateInputProps = { label: string } & FieldHookConfig<string>;

const MyDateInput = (props: MyDateInputProps) => {
  const [field, meta] = useField(props);
  return (
    <>
      <div className="fr-input-group${meta.touched && meta.error ? ' fr-input-group--error' : ''}">
        <label className="fr-label" htmlFor="text-input-calendar">
          {props.label}
        </label>
        <div className="fr-input-wrap fr-fi-calendar-line">
          <input
            className={`fr-input${
              meta.touched && meta.error ? " fr-input--error" : ""
            }`}
            {...field}
            value={field.value}
            type="date"
          />
        </div>
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};

type MyTextInputProps = {
  label: string;
  placeholder: string | null;
  description: string | null;
} & FieldHookConfig<string>;

const MyTextInput = (props: MyTextInputProps) => {
  const [field, meta] = useField(props);
  return (
    <>
      <div
        className={`fr-input-group${
          meta.touched && meta.error ? " fr-input-group--error" : ""
        }`}
      >
        <label className="fr-label" htmlFor={props.id || props.name}>
          {props.label}
        </label>
        {props.description && (
          <span className="fr-hint-text" id="select-hint-desc-hint">
            {props.description}
          </span>
        )}
        <input
          {...field}
          className={`fr-input${
            meta.touched && meta.error ? " fr-input--error" : ""
          }`}
          placeholder={props.placeholder || ""}
          aria-describedby="text-input-error-desc-error"
        />
        {meta.touched && meta.error && (
          <p id="text-input-email-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>
        )}
      </div>
    </>
  );
};

type MyBoolCheckboxGroupProps = {
  label: string;
  formikHelpers: FormikHelpers<any> & FormikState<any>;
  description: string;
  descriptionLink: string;
} & FieldHookConfig<string>;
const MyBoolCheckboxGroup = (props: MyBoolCheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "checkBox-error" : "checkbox";

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + isError
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id="checkboxes-error-legend"
          >
            {props.label}
          </legend>
          {props.description && (
            <span className="fr-hint-text" id="select-hint-desc-hint">
              <a href={props.descriptionLink} target="_blank">
                {props.description}
              </a>
            </span>
          )}
          <div className="fr-fieldset__content">
            <div
              className="fr-checkbox-group"
              key={htmlName + props.name + "_oui"}
            >
              <input
                {...field}
                type="checkbox"
                id={htmlName}
                {...field}
                checked={props.formikHelpers.values[props.name]}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() => {
                  if (field.value)
                    props.formikHelpers.setFieldValue(props.name, false, true);
                  else
                    props.formikHelpers.setFieldValue(props.name, true, true);
                }}
              >
                oui
              </label>
            </div>
          </div>
          {isError && (
            <p id="checkboxes-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

type MyCheckboxGroupProps = {
  label: string;
  values: Array<string>;
} & FieldHookConfig<string>;

const MyCheckboxGroup = (props: MyCheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;
  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + isError
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id="checkboxes-error-legend"
          >
            {props.label}
          </legend>
          <div className="fr-fieldset__content">
            {props.values.map((value) => (
              <div className="fr-checkbox-group" key={value}>
                <Field
                  type="checkbox"
                  {...field}
                  name={props.name}
                  value={value}
                  id={value}
                />
                <label className="fr-label" htmlFor={value}>
                  {value}
                </label>
              </div>
            ))}
          </div>
          {isError && (
            <p id="checkboxes-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

type MyBoolRadioProps = {
  label: string;
  formikHelpers: FormikHelpers<any> & FormikState<any>;
  hideNoOption: boolean;
  description: string;
  descriptionLink: string;
} & FieldHookConfig<string>;

// Like MyRadioGroup, but backs a boolean value.
// Has default "oui/non" options.
const MyBoolRadioGroup = (props: MyBoolRadioProps) => {
  const [field, meta, helper] = useField(props);
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "radio" : "radio-error";

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            isError ? "radio-error-legend radio-error-desc-error" : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
          >
            {props.label}
          </legend>
          {props.description && (
            <span className="fr-hint-text" id="select-hint-desc-hint">
              <a href={props.descriptionLink} target="_blank">
                {props.description}
              </a>
            </span>
          )}
          <div className="fr-fieldset__content">
            <div
              className="fr-radio-group"
              key={htmlName + props.name + "_oui"}
            >
              <input
                {...field}
                type="radio"
                id={htmlName}
                {...field}
                checked={props.formikHelpers.values[props.name]}
              />
              <label
                className="fr-label"
                htmlFor={htmlName + "oui"}
                onClick={() =>
                  props.formikHelpers.setFieldValue(props.name, true)
                }
              >
                oui{" "}
              </label>
            </div>
            {!props.hideNoOption && (
              <div
                className="fr-radio-group"
                key={htmlName + props.name + "_non"}
              >
                <input
                  {...field}
                  type="radio"
                  id={htmlName}
                  {...field}
                  checked={!props.formikHelpers.values[props.name]}
                />
                <label
                  className="fr-label"
                  htmlFor={htmlName + "non"}
                  onClick={() =>
                    props.formikHelpers.setFieldValue(props.name, false)
                  }
                >
                  non
                </label>
              </div>
            )}
          </div>
          {isError && (
            <p id="radio-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

const MyRadioGroup = (props: MyCheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            isError ? "radio-error-legend radio-error-desc-error" : ""
          }
          role="group"
        >
          <legend
            className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
          >
            {props.label}
          </legend>
          <div className="fr-fieldset__content">
            {props.values.map((value) => {
              const htmlName = isError ? "radio" : "radio-error";
              return (
                <div
                  className="fr-radio-group"
                  key={htmlName + props.name + value}
                >
                  <input {...field} type="radio" id={htmlName + value} />
                  <label className="fr-label" htmlFor={htmlName + value}>
                    {value}
                  </label>
                </div>
              );
            })}
          </div>
          {isError && (
            <p id="radio-error-desc-error" className="fr-error-text">
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

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

  return formulaireGateway.getSiretInfo(siret).then((info: any) => {
    const establishment = info["etablissements"][0];
    const nom = establishment["uniteLegale"]["denominationUniteLegale"];
    const address = addressDictToString(establishment["adresseEtablissement"]);

    return { nom, address };
  });
};

interface SiretFields {
  siret: string;
}

const SiretAutocompletedField = (props: FieldHookConfig<string>) => {
  const {
    values: { siret },
    setFieldValue,
    setFieldError,
  } = useFormikContext<SiretFields>();
  const [field, meta] = useField(props);

  React.useEffect(() => {
    let isCurrent = true;
    let sanitizedSiret = siret.replace(/\s/g, "");
    if (sanitizedSiret.length == 14) {
      fetchCompanyInfoBySiret(sanitizedSiret)
        .then((info: any) => {
          if (!!isCurrent) {
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
        });
    }
    return () => {
      isCurrent = false;
    };
  }, [siret, setFieldValue, setFieldError, props.name]);

  return (
    <>
      <MyTextInput
        label="Indiquez le SIRET de la structure d'accueil *"
        name="siret"
        type="number"
        placeholder="362 521 879 00034"
        description="la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
      />
    </>
  );
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SuccessMessageProps {
  link: string;
}
export class SuccessMessage extends Component<SuccessMessageProps> {
  constructor(props: SuccessMessageProps) {
    super(props);
  }

  render() {
    return (
      <>
        <div role="alert" className="fr-alert fr-alert--success">
          <p className="fr-alert__title">Succès de l&#39;envoi</p>
          <p>
            Vous avez enregistré votre formulaire et vous pouvez le modifier
            avec le lien suivant:&nbsp;
            <a href={this.props.link}>{this.props.link}</a>
          </p>
        </div>
      </>
    );
  }
}

interface ErrorMessageProps {
  message: string;
  title: string;
}
export class ErrorMessage extends Component<ErrorMessageProps> {
  constructor(props: ErrorMessageProps) {
    super(props);
  }

  render() {
    return (
      <>
        <div role="alert" className="fr-alert fr-alert--error">
          <p className="fr-alert__title">{this.props.title}</p>
          <p>{this.props.message}</p>
        </div>
      </>
    );
  }
}

interface FormulaireProps {}
interface FormulaireState {
  initialValues: FormulaireDto;
  formLink: string | null;
  submitError: Error | null;
}
export class Formulaire extends Component<FormulaireProps, FormulaireState> {
  createInitialValues(): FormulaireDto {
    return {
      status: FormulaireStatus.DRAFT,

      // Participant
      email: "sylvanie@monemail.fr",
      firstName: "Sylanie",
      lastName: "Durand",
      phone: "0612345678",
      dateSubmission: Formulaire.toDateString(startOfToday()),
      dateStart: Formulaire.toDateString(addDays(startOfToday(), 2)),
      dateEnd: Formulaire.toDateString(addDays(startOfToday(), 3)),

      // Enterprise
      siret: "12345678912345",
      businessName: "Ma petite entreprise ne connait pas la crise", //< raison sociale
      mentor: "The Mentor",
      mentorPhone: "0687654321",
      mentorEmail: "mentor@supermentor.fr",
      workdays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
      workHours: "9h00-12h00, 14h00-18h00",
      immersionAddress: "Quelque Part",

      // Covid
      individualProtection: false,
      sanitaryPrevention: false,
      sanitaryPreventionDescription: "Aucunes",

      // Immersion
      immersionObjective: "Valider coaching d'équipe",
      immersionProfession: "Chef d'atelier", //< intitulé du poste
      immersionActivities: "Superviser",
      immersionSkills: "Attention au détail",

      // Signatures
      beneficiaryAccepted: false,
      enterpriseAccepted: false,
    };
  }

  getCurrentFormulaireId(): string | null {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("id");
  }

  async loadValuesForCurrentID() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = this.getCurrentFormulaireId();
    if (!id) {
      return;
    }
    try {
      let response = await formulaireGateway.get(id);

      if (response.status === FormulaireStatus.DRAFT) {
        response.dateSubmission = Formulaire.toDateString(startOfToday());
      }

      this.setState({ initialValues: response });
    } catch (e) {
      console.log(e);
      this.state = { ...this.state, submitError: e, formLink: null };
    }
  }

  private static toDateString(date: Date): string {
    return format(date, "yyyy-MM-dd");
  }

  componentDidMount() {
    this.loadValuesForCurrentID();
  }

  constructor(props: any) {
    super(props);
    this.state = {
      initialValues: this.createInitialValues(),
      formLink: null,
      submitError: null,
    };
  }

  render() {
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
                Ce formulaire vaut équivalence de la signature du CERFA 13912 *
                03
              </p>
            </div>

            <Formik
              enableReinitialize={true}
              initialValues={this.state.initialValues}
              validationSchema={formulaireDtoSchema}
              onSubmit={async (values, { setSubmitting }) => {
                console.log(values);

                try {
                  const formulaire = await formulaireDtoSchema.validate(values);

                  const currentId = this.getCurrentFormulaireId();
                  const upsertedId = currentId
                    ? await formulaireGateway.update(currentId, formulaire)
                    : await formulaireGateway.add(formulaire);

                  const queryParams = new URLSearchParams(
                    window.location.search
                  );
                  queryParams.set("id", upsertedId);
                  history.replaceState(
                    null,
                    document.title,
                    "?" + queryParams.toString()
                  );

                  const newURL = window.location.href;
                  this.state = {
                    ...this.state,
                    submitError: null,
                    formLink: newURL,
                  };
                } catch (e) {
                  console.log(e);
                  this.state = {
                    ...this.state,
                    submitError: e,
                    formLink: null,
                  };
                }
                setSubmitting(false);
              }}
            >
              {(props) => (
                <div>
                  <form
                    onReset={props.handleReset}
                    onSubmit={props.handleSubmit}
                  >
                    <MyTextInput
                      label="Email *"
                      name="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      description="cela nous permet de vous transmettre la validation de la convention"
                    />

                    <MyTextInput
                      label="Votre nom *"
                      name="firstName"
                      type="text"
                      placeholder=""
                      description=""
                    />

                    <MyTextInput
                      label="Votre prénom *"
                      name="lastName"
                      type="text"
                      placeholder=""
                      description=""
                    />

                    <MyTextInput
                      label="Votre numéro de téléphone"
                      name="phone"
                      type="tel"
                      placeholder="0606060607"
                      description="pour qu’on puisse vous contacter à propos de l’immersion"
                    />

                    <MyDateInput
                      label="Date de debut de l'immersion *"
                      name="dateStart"
                      type="date"
                    />

                    <MyDateInput
                      label="Date de fin de l'immersion *"
                      name="dateEnd"
                      type="date"
                    />

                    <h4>
                      <br />
                      Les questions suivantes doivent être complétées avec la
                      personne qui vous accueillera pendant votre immersion
                    </h4>

                    <SiretAutocompletedField name="siret" />

                    <MyTextInput
                      label="Indiquez le nom (raison sociale) de l'établissement d'accueil *"
                      name="businessName"
                      type="text"
                      placeholder=""
                      description=""
                    />

                    <MyTextInput
                      label="Indiquez le prénom, nom et fonction du tuteur *"
                      name="mentor"
                      type="text"
                      placeholder=""
                      description="Ex : Alain Prost, pilote automobile"
                    />

                    <MyTextInput
                      label="Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil *"
                      name="mentorPhone"
                      type="tel"
                      placeholder="0606060707"
                      description="pour qu’on puisse le contacter à propos de l’immersion"
                    />

                    <MyTextInput
                      label="Indiquez l'e-mail du tuteur *"
                      name="mentorEmail"
                      type="email"
                      placeholder="alain.prost@exemple.com"
                      description="pour envoyer la validation de la convention"
                    />

                    <MyCheckboxGroup
                      name="workdays"
                      label="Journées pendant lesquelles l'immersion va se dérouler *"
                      values={[
                        "lundi",
                        "mardi",
                        "mercredi",
                        "jeudi",
                        "vendredi",
                        "samedi",
                        "dimanche",
                      ]}
                    />

                    <MyTextInput
                      label="Indiquez les horaires de l'immersion *"
                      name="workHours"
                      type="text"
                      placeholder=""
                      description="Par ex, de 8h30 à 12h et de 13h à 16h.
                  Si les horaires sont différents en fonction des journée, précisez-le bien.
                  Par ex,  lundi, de 10h à 12h et de 13h30 à 17h,  les autres jours de la semaine,  de 8h30 à 12h00 et de 13h00 à 16h00.
                  Si il y a un jour férié ou non travaillé pendant l'immersion, le préciser aussi.  Par ex :  en dehors du  8 mai, jour férié."
                    />

                    <MyTextInput
                      label="Adresse du lieu où se fera l'immersion"
                      name="immersionAddress"
                      type="text"
                      placeholder=""
                      description=""
                    />

                    <MyBoolRadioGroup
                      name="individualProtection"
                      label="Un équipement de protection individuelle est-il fourni pour l’immersion ?"
                      formikHelpers={props}
                      hideNoOption={false}
                      description=""
                      descriptionLink=""
                    />

                    <MyBoolRadioGroup
                      name="sanitaryPrevention"
                      label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
                      formikHelpers={props}
                      hideNoOption={false}
                      description=""
                      descriptionLink=""
                    />

                    <MyTextInput
                      label="Si oui, précisez-les"
                      name="sanitaryPreventionDescription"
                      type="text"
                      placeholder=""
                      description="Ex : fourniture de gel, de masques"
                    />

                    <MyRadioGroup
                      name="immersionObjective"
                      label="Objectif  de la période de mise en situation en milieu professionnel"
                      values={[
                        "Confirmer un projet professionnel",
                        "Découvrir un métier ou un secteur d'activité",
                        "Initier une démarche de recrutement",
                      ]}
                    />

                    <MyTextInput
                      label="Intitulé du poste / métier observé pendant l'immersion *"
                      name="immersionProfession"
                      type="text"
                      placeholder=""
                      description="Ex : employé libre service, web développeur, boulanger …"
                    />

                    <MyTextInput
                      label="Activités observées / pratiquées pendant l'immersion *"
                      name="immersionActivities"
                      type="text"
                      placeholder=""
                      description="Ex : mise en rayon, accueil et aide à la clientèle"
                    />

                    <MyTextInput
                      label="Compétences/aptitudes observées / évaluées pendant l'immersion"
                      name="immersionSkills"
                      type="text"
                      placeholder=""
                      description="Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe"
                    />

                    <p />

                    <MyBoolCheckboxGroup
                      name="beneficiaryAccepted"
                      label={
                        "Je (bénéficiaire de l'immersion) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
                      }
                      formikHelpers={props}
                      description="Avant de répondre, consultez ces dispositions ici"
                      descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                    />

                    <MyBoolCheckboxGroup
                      name="enterpriseAccepted"
                      label={
                        "Je (représentant de la structure d'accueil ) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
                      }
                      formikHelpers={props}
                      description="Avant de répondre, consultez ces dispositions ici"
                      descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                    />

                    <p />

                    {!!this.state.submitError && (
                      <ErrorMessage
                        title="Erreur de serveur"
                        message={this.state.submitError.message}
                      />
                    )}

                    {!!this.state.formLink && (
                      <SuccessMessage link={this.state.formLink} />
                    )}

                    <p></p>

                    <button
                      className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                      type="submit"
                      disabled={props.isSubmitting}
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
  }
}
