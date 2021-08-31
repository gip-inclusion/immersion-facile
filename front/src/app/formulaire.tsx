import React, { Component } from "react";
import { Formik, useFormikContext, useField, FieldHookConfig } from "formik";
import { formulaireGateway } from "src/app/main";
import { BoolRadioGroup, RadioGroup } from "src/app/radioGroup";
import { routes } from "src/app/routes";
import { DateInput } from "src/components/DateInput";
import { ErrorMessage } from "src/components/ErrorMessage";
import { SuccessMessage } from "src/components/SuccessMessage";
import { TextInput } from "src/components/TextInput";
import {
  FormulaireDto,
  formulaireDtoSchema,
  FormulaireStatus,
} from "src/shared/FormulaireDto";
import { addDays, format, startOfToday } from "date-fns";
import { AxiosError } from "axios";
import { Route } from "type-route";
import { MarianneHeader } from "./Components/Header";
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

type SiretAutocompletedFieldProps = {
  disabled: boolean;
} & FieldHookConfig<string>;
const SiretAutocompletedField = (props: SiretAutocompletedFieldProps) => {
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
      <p className="fr-alert__title">Ce formulaire n'est pas modifiable.</p>
      <p>
        Ce formulaire a été validé par vôtre conseiller et il n'est plus
        possible de le modifier.
      </p>
    </div>
    <br />
  </>
);

interface FormulaireProps {
  route: Route<typeof routes.demandeImmersion>;
}

interface FormulaireState {
  initialValues: FormulaireDto;
  formLink: string | null;
  submitError: Error | null;
  isFrozen: boolean;
}

export class Formulaire extends Component<FormulaireProps, FormulaireState> {
  createInitialValues(): FormulaireDto {
    return {
      id: uuidV4(),
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

      this.setState({
        initialValues: response,
        isFrozen: Formulaire.isFrozen(response),
      });
    } catch (e) {
      console.log(e);
      this.state = { ...this.state, submitError: e, formLink: null };
    }
  }

  private static isFrozen(formulaire: FormulaireDto): boolean {
    return formulaire.status !== FormulaireStatus.DRAFT;
  }

  private static toDateString(date: Date): string {
    return format(date, "yyyy-MM-dd");
  }

  componentDidMount() {
    this.loadValuesForCurrentID();
  }

  constructor(props: any) {
    super(props);
    const initialValues = this.createInitialValues();
    this.state = {
      initialValues,
      formLink: null,
      submitError: null,
      isFrozen: Formulaire.isFrozen(initialValues),
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
                    ? await formulaireGateway.update(formulaire)
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
                    {this.state.isFrozen && <FrozenMessage />}

                    <TextInput
                      label="Email *"
                      name="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      description="cela nous permet de vous transmettre la validation de la convention"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Votre nom *"
                      name="firstName"
                      type="text"
                      placeholder=""
                      description=""
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Votre prénom *"
                      name="lastName"
                      type="text"
                      placeholder=""
                      description=""
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Votre numéro de téléphone"
                      name="phone"
                      type="tel"
                      placeholder="0606060607"
                      description="pour qu’on puisse vous contacter à propos de l’immersion"
                      disabled={this.state.isFrozen}
                    />

                    <DateInput
                      label="Date de debut de l'immersion *"
                      name="dateStart"
                      type="date"
                      disabled={this.state.isFrozen}
                    />

                    <DateInput
                      label="Date de fin de l'immersion *"
                      name="dateEnd"
                      type="date"
                      disabled={this.state.isFrozen}
                    />

                    <h4>
                      <br />
                      Les questions suivantes doivent être complétées avec la
                      personne qui vous accueillera pendant votre immersion
                    </h4>

                    <SiretAutocompletedField
                      name="siret"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Indiquez le nom (raison sociale) de l'établissement d'accueil *"
                      name="businessName"
                      type="text"
                      placeholder=""
                      description=""
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Indiquez le prénom, nom et fonction du tuteur *"
                      name="mentor"
                      type="text"
                      placeholder=""
                      description="Ex : Alain Prost, pilote automobile"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil *"
                      name="mentorPhone"
                      type="tel"
                      placeholder="0606060707"
                      description="pour qu’on puisse le contacter à propos de l’immersion"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Indiquez l'e-mail du tuteur *"
                      name="mentorEmail"
                      type="email"
                      placeholder="alain.prost@exemple.com"
                      description="pour envoyer la validation de la convention"
                      disabled={this.state.isFrozen}
                    />

                    <CheckboxGroup
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
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Indiquez les horaires de l'immersion *"
                      name="workHours"
                      type="text"
                      placeholder=""
                      description="Par ex, de 8h30 à 12h et de 13h à 16h.
                  Si les horaires sont différents en fonction des journée, précisez-le bien.
                  Par ex,  lundi, de 10h à 12h et de 13h30 à 17h,  les autres jours de la semaine,  de 8h30 à 12h00 et de 13h00 à 16h00.
                  Si il y a un jour férié ou non travaillé pendant l'immersion, le préciser aussi.  Par ex :  en dehors du  8 mai, jour férié."
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Adresse du lieu où se fera l'immersion"
                      name="immersionAddress"
                      type="text"
                      placeholder=""
                      description=""
                      disabled={this.state.isFrozen}
                    />

                    <BoolRadioGroup
                      name="individualProtection"
                      label="Un équipement de protection individuelle est-il fourni pour l’immersion ?"
                      formikHelpers={props}
                      hideNoOption={false}
                      description=""
                      descriptionLink=""
                      disabled={this.state.isFrozen}
                    />

                    <BoolRadioGroup
                      name="sanitaryPrevention"
                      label="Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ? *"
                      formikHelpers={props}
                      hideNoOption={false}
                      description=""
                      descriptionLink=""
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Si oui, précisez-les"
                      name="sanitaryPreventionDescription"
                      type="text"
                      placeholder=""
                      description="Ex : fourniture de gel, de masques"
                      disabled={this.state.isFrozen}
                    />

                    <RadioGroup
                      name="immersionObjective"
                      label="Objectif  de la période de mise en situation en milieu professionnel"
                      values={[
                        "Confirmer un projet professionnel",
                        "Découvrir un métier ou un secteur d'activité",
                        "Initier une démarche de recrutement",
                      ]}
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Intitulé du poste / métier observé pendant l'immersion *"
                      name="immersionProfession"
                      type="text"
                      placeholder=""
                      description="Ex : employé libre service, web développeur, boulanger …"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Activités observées / pratiquées pendant l'immersion *"
                      name="immersionActivities"
                      type="text"
                      placeholder=""
                      description="Ex : mise en rayon, accueil et aide à la clientèle"
                      disabled={this.state.isFrozen}
                    />

                    <TextInput
                      label="Compétences/aptitudes observées / évaluées pendant l'immersion"
                      name="immersionSkills"
                      type="text"
                      placeholder=""
                      description="Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe"
                      disabled={this.state.isFrozen}
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
                      disabled={this.state.isFrozen}
                    />

                    <BoolCheckboxGroup
                      name="enterpriseAccepted"
                      label={
                        "Je (représentant de la structure d'accueil ) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *"
                      }
                      formikHelpers={props}
                      description="Avant de répondre, consultez ces dispositions ici"
                      descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
                      disabled={this.state.isFrozen}
                    />

                    <p />

                    {!!this.state.submitError && (
                      <ErrorMessage
                        title="Erreur de serveur"
                        message={this.state.submitError.message}
                      />
                    )}

                    {!!this.state.formLink && (
                      <SuccessMessage
                        link={this.state.formLink}
                        title="Succès de l'envoi"
                        text="Vous avez enregistré votre formulaire et vous pouvez le modifier avec le lien suivant:"
                      />
                    )}

                    <p />

                    <button
                      className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                      type="submit"
                      disabled={props.isSubmitting || this.state.isFrozen}
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
