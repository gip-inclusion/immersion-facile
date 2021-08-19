import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { Formik, Form, useField, FormikState, FieldHookConfig, Field, FormikHelpers, FormikValues } from "formik";
import * as Yup from "yup";
import { formulaireGateway } from "src/app/main";
import { FormulaireDto, formulaireDtoSchema } from "src/shared/FormulaireDto"

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
          <input className={`fr-input${meta.touched && meta.error ? ' fr-input--error' : ''}`}
            {...field}
            type="date"
          />
        </div>
        {meta.touched && meta.error && <p id="text-input-email-error-desc-error" className="fr-error-text">
          {meta.error}
        </p>}
      </div>
    </>
  )

}

type MyTextInputProps = { label: string, placeholder: string | null, description: string | null } & FieldHookConfig<string>;

const MyTextInput = (props: MyTextInputProps) => {
  const [field, meta] = useField(props);
  return (
    <>
      <div className={`fr-input-group${meta.touched && meta.error ? ' fr-input-group--error' : ''}`}>
        <label className="fr-label" htmlFor={props.id || props.name}>
          {props.label}
        </label>
        {props.description && <span className="fr-hint-text" id="select-hint-desc-hint">{props.description}</span>}
        <input {...field}
          className={`fr-input${meta.touched && meta.error ? ' fr-input--error' : ''}`}
          placeholder={props.placeholder || ""}
          aria-describedby="text-input-error-desc-error"
        />
        {meta.touched && meta.error && <p id="text-input-email-error-desc-error" className="fr-error-text">
          {meta.error}
        </p>}
      </div>
    </>
  );
};

type MyCheckboxGroupProps = { label: string, values: Array<string> } & FieldHookConfig<string>;

const MyCheckboxGroup = (props: MyCheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;
  return (
    <>

      <div className="fr-form-group">
        <fieldset className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={"checkboxes-error-legend" + isError ? " checkboxes-error-desc-error" : ""}
          role="group">
          <legend className="fr-fieldset__legend fr-text--regular" id='checkboxes-error-legend'>
            {props.label}
          </legend>
          <div className="fr-fieldset__content">
            {props.values.map((value) =>
              <div className="fr-checkbox-group" key={value}>
                <Field type="checkbox" {...field} name={props.name} value={value} id={value} />
                <label className="fr-label" htmlFor={value}>{value}</label>
              </div>
            )}
          </div>
          {isError && <p id="checkboxes-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>}
        </fieldset>
      </div>
    </>
  );
}

type MyBoolRadioProps = { label: string, formikHelpers: FormikHelpers<any> & FormikState<any>, hideNoOption: boolean, description: string, descriptionLink: string } & FieldHookConfig<string>;

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
          aria-labelledby={isError ? "radio-error-legend radio-error-desc-error" : ""}
          role="group">

          <legend className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
          >
            {props.label}
          </legend>
          {props.description && <span className="fr-hint-text" id="select-hint-desc-hint"><a href={props.descriptionLink} target="_blank">{props.description}</a></span>}
          <div className="fr-fieldset__content">
            <div className="fr-radio-group" key={htmlName + props.name + "_oui"}>
              <input {...field} type="radio" id={htmlName} {...field}
                checked={props.formikHelpers.values[props.name]}
              />
              <label className="fr-label" htmlFor={htmlName + "oui"}
                onClick={() => props.formikHelpers.setFieldValue(props.name, true)}
              >oui </label>
            </div>
            {!props.hideNoOption && <div className="fr-radio-group" key={htmlName + props.name + "_non"}>
              <input {...field} type="radio" id={htmlName} {...field}
                checked={!props.formikHelpers.values[props.name]}
              />
              <label className="fr-label" htmlFor={htmlName + "non"}
                onClick={() => props.formikHelpers.setFieldValue(props.name, false)}
              >non</label>
            </div>}
          </div>
          {isError && <p id="radio-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>}
        </fieldset>
      </div>
    </>);
}

const MyRadioGroup = (props: MyCheckboxGroupProps) => {
  const [field, meta] = useField(props);
  const isError = meta.touched && meta.error;

  return (
    <>
      <div className="fr-form-group">
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={isError ? "radio-error-legend radio-error-desc-error" : ""}
          role="group">

          <legend className="fr-fieldset__legend fr-text--regular"
            id={isError ? "radio-error-legend" : "radio-legend"}
          >
            {props.label}
          </legend>
          <div className="fr-fieldset__content">

            {props.values.map((value) => {
              const htmlName = isError ? "radio" : "radio-error";
              return (
                <div className="fr-radio-group" key={htmlName + props.name + value}>
                  <input {...field} type="radio" id={htmlName + value} />
                  <label className="fr-label" htmlFor={htmlName + value}>{value}
                  </label>
                </div>
              )
            })}
          </div>
          {isError && <p id="radio-error-desc-error" className="fr-error-text">
            {meta.error}
          </p>}
        </fieldset>
      </div>
    </>
  )
}


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let submitError: Error | null = null

export const Formulaire = () => {
  return (
    <>
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <p className="fr-logo">
                      République
                      <br />Française
                    </p>
                  </div>
                </div>
                <div className="fr-header__service">
                  <p className="fr-header__service-title">Immersion Facile</p>
                  <p className="fr-header__service-tagline">Faciliter la réalisation des immersion professionnelles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w">


          <h2>Formulaire pour conventionner une période de mise en situation professionnelle (PMSMP)</h2>
          <div className="fr-text">
            Bravo ! <br />
            Vous avez trouvé une entreprise pour vous accueillir en immersion. <br />
            Avant tout, vous devez faire établir une convention pour cette immersion et c'est ici que ça se passe. <br />
            En quelques minutes, complétez ce formulaire avec l'entreprise qui vous accueillera. <br />
            <p className="fr-text--xs">
              Ce formulaire vaut équivalence de la signature du CERFA 13912 * 03
            </p>
          </div>




          <Formik
            initialValues={{
              // Participant
              email: "jeffmac@google.com",
              firstName: "JF",
              lastName: "Macresy",
              phone: "0664404708",
              dateStart: Date(),
              dateEnd: Date(),

              // Enterprise
              siret: "12345678912345",
              businessName: "Ma petite entreprise ne connait pas la crise", //< raison sociale
              mentor: "The Mentor",
              mentorPhone: "0687010101",
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
            }}
            validationSchema={formulaireDtoSchema}
            onSubmit={async (values, { setSubmitting }) => {
              console.log(values);
              const formulaire = formulaireDtoSchema.validate(values);
              try { 
                const response = await formulaireGateway.add(await formulaire);
                alert(response.id); 
              } catch (e) {
                console.log(e)
                submitError = e;
              }
              setSubmitting(false);
            }}
          >
            {props => (
              <div>
                <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
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

                  <h4><br />Les questions suivantes doivent être complétées avec la personne qui vous accueillera pendant votre immersion</h4>

                  <MyTextInput
                    label="Indiquez le SIRET de la structure d'accueil *"
                    name="siret"
                    type="number"
                    placeholder="362 521 879 00034"
                    description="la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
                  />

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
                    values={["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]}
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
                    label="Adresse du lieu où se fera l'immersion (si différent de l’adresse de la structure d’accueil)"
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
                    values={["Confirmer un projet professionnel",
                      "Découvrir un métier ou un secteur d'activité",
                      "Initier une démarche de recrutement"
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

                  <MyBoolRadioGroup
                    name="beneficiaryAccepted"
                    label={"Je (bénéficiaire de l'immersion) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"}
                    formikHelpers={props}
                    hideNoOption={true}
                    description="Avant de répondre, consultez ces dispositions ici"
                    descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                  />

                  <MyBoolRadioGroup
                    name="enterpriseAccepted"
                    label={"Je (représentant de la structure d'accueil ) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"}
                    formikHelpers={props}
                    hideNoOption={true}
                    description="Avant de répondre, consultez ces dispositions ici"
                    descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                  />

                  <p />

                  <button className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                    type="submit"
                    disabled={props.isSubmitting}
                  >
                    {props.isSubmitting ? "Éxecution" : "Valider ce formulaire"}
                  </button>
                </form>

                {!!submitError && <div role="alert" className="fr-alert fr-alert--error">
                  <p className="fr-alert__title">Erreur de serveur</p>
                  <p>{submitError?.message}</p>
                </div>}
              </div>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};
