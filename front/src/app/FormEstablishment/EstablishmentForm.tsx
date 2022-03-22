import { Form, Formik, useField } from "formik";
import React, { useEffect, useState } from "react";
import { formEstablishmentGateway } from "src/app/dependencies";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { BusinessContactList } from "src/app/FormEstablishment/BusinessContactList";
import {
  fieldsToLabel,
  FieldsWithLabel,
} from "src/app/FormEstablishment/fieldsToLabels";
import { ProfessionList } from "src/app/FormEstablishment/ProfessionList";
import { RadioGroupForField } from "src/app/RadioGroup";
import { routes } from "src/app/routes";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchEstablishmentInfoBySiret";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { Button } from "src/components/Button";
import { BoolCheckboxGroup } from "src/components/form/CheckboxGroup";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { InfoMessage } from "src/components/form/InfoMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import { Layout } from "src/components/Layout";
import { ENV } from "src/environmentVariables";
import {
  ContactMethod,
  FormEstablishmentDto,
  formEstablishmentSchema,
  FormEstablishmentSource,
} from "src/shared/FormEstablishmentDto";
import { Route } from "type-route";
import { OmitFromExistingKeys } from "../../shared/utils";

type EstablishmentFormProps = {
  initialValues: FormEstablishmentDto;
  saveForm: (establishment: FormEstablishmentDto) => Promise<void>;
  children: React.ReactNode;
};

const getMandatoryLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field] + " *",
  name: field,
});

const getLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field],
  name: field,
});

const EstablishmentForm = ({
  initialValues,
  saveForm,
  children,
}: EstablishmentFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  let errorMessage = submitError?.message;
  if (
    submitError &&
    "response" in submitError &&
    "data" in submitError["response"] &&
    "errors" in submitError["response"]["data"]
  ) {
    errorMessage = submitError["response"]["data"]["errors"];
  }

  return (
    <div
      className="fr-grid-row fr-grid-row--center fr-grid-row--gutters"
      style={{ marginTop: "25px" }}
    >
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(formEstablishmentSchema)}
        onSubmit={async (data, { setSubmitting }) => {
          try {
            setIsSuccess(false);
            setSubmitError(null);

            formEstablishmentSchema.parse(data);

            await saveForm(data);

            setIsSuccess(true);
            setSubmitError(null);
          } catch (e: any) {
            console.log(e);
            setIsSuccess(false);
            setSubmitError(e);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, submitCount, errors, values }) => (
          <div style={{ margin: "5px 12px", maxWidth: "600px" }}>
            <p>
              Bienvenue sur l'espace de référencement des entreprises
              volontaires pour l'accueil des immersions professionnelles.
            </p>

            <p className="mt-4">
              En référençant votre entreprise vous rejoignez la communauté{" "}
              <a
                href={"https://lesentreprises-sengagent.gouv.fr/"}
                target={"_blank"}
              >
                « Les entreprises s'engagent »
              </a>
              .
            </p>

            <p className="mt-4">
              Ce formulaire vous permet d'indiquer les métiers de votre
              établissement ouverts aux immersions. Si votre entreprise comprend
              plusieurs établissements, il convient de renseigner un formulaire
              pour chaque établissement (Siret différent).
            </p>
            <Form>
              <span className="py-6 block text-lg font-semibold">
                Votre établissement
              </span>
              {children}
              {/* <SiretRelatedInputs /> */}
              <p className="mt-4" />
              <BoolCheckboxGroup
                {...getLabelAndName("isEngagedEnterprise")}
                description=""
                descriptionLink=""
                disabled={false}
              />
              <ProfessionList
                name="professions"
                title={`${fieldsToLabel["professions"]} *`}
              />
              <BusinessContactList />
              <RadioGroupForField
                {...getMandatoryLabelAndName("preferredContactMethods")}
                options={preferredContactMethodOptions}
              />
              {submitCount !== 0 && Object.values(errors).length > 0 && (
                <div style={{ color: "red" }}>
                  {console.log(errors)}
                  Veuillez corriger les champs erronés :
                  <ul>
                    {(Object.keys(errors) as FieldsWithLabel[]).map((field) => {
                      const err = errors[field];
                      return typeof err === "string" ? (
                        <li key={field}>
                          {fieldsToLabel[field] || field}: {err}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              <br />
              {submitError && (
                <>
                  <ErrorMessage title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. ">
                    {errorMessage}
                  </ErrorMessage>
                  <br />
                </>
              )}
              {isSuccess && (
                <SuccessMessage title="Succès de l'envoi">
                  Succès. Nous avons bien enregistré les informations concernant
                  votre entreprise.
                </SuccessMessage>
              )}
              {!isSuccess && (
                <button
                  className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Enregistrer mes informations
                </button>
              )}
            </Form>
            <br />
            <br />
          </div>
        )}
      </Formik>
    </div>
  );
};

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");
  const { setValue: setAddressValue } = useField<string>(
    businessLabelAndName.name,
  )[2];
  return (
    <>
      <TextInput {...getMandatoryLabelAndName("siret")} disabled={true} />

      <TextInput {...getMandatoryLabelAndName("businessName")} />
      <TextInput {...getMandatoryLabelAndName("businessNameCustomized")} />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
      />
    </>
  );
};

const CreationSiretRelatedInputs = () => {
  const { siret, establishmentInfo, isFetchingSiret, siretAlreadyExists } =
    useSiretFetcher({ fetchSirenApiEvenAlreadyInDb: false, disabled: false });

  const [requestEmailToEditFormSucceed, setRequestEmailToEditFormSucceed] =
    useState(false);

  const [requestEmailToEditFormError, setRequestEmailToEditFormError] =
    useState<string | null>(null);

  useSiretRelatedField("businessName", establishmentInfo);
  useSiretRelatedField("businessAddress", establishmentInfo);
  useSiretRelatedField("naf", establishmentInfo);
  const featureFlags = useFeatureFlagsContext();

  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");

  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInput
        {...getMandatoryLabelAndName("siret")}
        placeholder="362 521 879 00034"
        disabled={isFetchingSiret}
      />
      {siretAlreadyExists && !requestEmailToEditFormSucceed && (
        <div>
          Cette entreprise a déjà été référencée.
          <Button
            disable={requestEmailToEditFormSucceed}
            onSubmit={() => {
              formEstablishmentGateway
                .requestEmailToEditForm(siret)
                .then(() => {
                  setRequestEmailToEditFormSucceed(true);
                })
                .catch((err) => {
                  setRequestEmailToEditFormError(err.response.data.errors);
                });
            }}
          >
            Demande de modification du formulaire de référencement
          </Button>
        </div>
      )}
      {requestEmailToEditFormSucceed && (
        <SuccessMessage title="Succès de la demande">
          Succès. Un mail a été envoyé au référent de cet établissement avec un
          lien permettant la mise à jour des informations.
        </SuccessMessage>
      )}
      {requestEmailToEditFormError && (
        <>
          <InfoMessage
            title="La demande de modification n'a pas aboutie."
            text={requestEmailToEditFormError}
          />
          <br />
        </>
      )}

      <TextInput
        {...getMandatoryLabelAndName("businessName")}
        disabled={!featureFlags.enableByPassInseeApi}
      />
      <TextInput
        {...getMandatoryLabelAndName("businessNameCustomized")}
        disabled={isFetchingSiret}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfo?.businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
        disabled={isFetchingSiret}
      />
    </>
  );
};

type EstablishmentCreationFormProps = {
  source: FormEstablishmentSource;
};

export const EstablishmentCreationForm = ({
  source,
}: EstablishmentCreationFormProps) => {
  const creationInitialValues = {
    ...creationInitialValuesWithoutSource,
    source,
  };
  return (
    <EstablishmentForm
      initialValues={creationInitialValues}
      saveForm={async (data) => {
        formEstablishmentGateway.addFormEstablishment(data);
      }}
    >
      <CreationSiretRelatedInputs />
    </EstablishmentForm>
  );
};

export const EstablishmentEditionForm = ({
  route,
}: {
  route: Route<typeof routes.editFormEstablishment>;
}) => {
  const [initialValues, setInitialValues] = useState<
    FormEstablishmentDto | undefined
  >();

  useEffect(() => {
    if (!route.params.jwt) return;
    formEstablishmentGateway
      .getFormEstablishmentFromJwt(route.params.jwt)
      .then(setInitialValues);
  }, [route.params.jwt]);

  if (!route.params.jwt) {
    return <p>Lien non valide</p>;
  }

  if (!initialValues) return <p>...</p>;
  return (
    <EstablishmentForm
      initialValues={initialValues}
      saveForm={(data) =>
        formEstablishmentGateway.updateFormEstablishment({
          ...data,
        })
      }
    >
      <EditionSiretRelatedInputs
        businessAddress={initialValues.businessAddress}
      />
    </EstablishmentForm>
  );
};

const creationInitialValuesWithoutSource: OmitFromExistingKeys<
  FormEstablishmentDto,
  "source"
> = !ENV.dev
  ? {
      siret: "",
      businessName: "",
      businessAddress: "",
      professions: [],
      businessContacts: [
        {
          firstName: "",
          lastName: "",
          job: "",
          phone: "",
          email: "",
        },
      ],
      preferredContactMethods: [],
    }
  : {
      siret: "1234567890123",
      businessName: "My business name, replaced by result from API",
      businessNameCustomized:
        "My Customized Business name, not replaced by API",
      businessAddress: "My business address, replaced by result from API",
      isEngagedEnterprise: true,
      professions: [
        {
          romeCodeAppellation: "11573",
          romeCodeMetier: "D1102",
          description: "Boulanger",
        },
        {
          description: "Boucher / Bouchère",
          romeCodeAppellation: "11564",
          romeCodeMetier: "D1101",
        },
      ],
      businessContacts: [
        {
          firstName: "John",
          lastName: "Doe",
          job: "super job",
          phone: "02837",
          email: "joe@mail.com",
        },
      ],
      preferredContactMethods: ["EMAIL"],
    };

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod[];
}> = [
  {
    value: ["EMAIL"],
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: ["PHONE"],
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: ["IN_PERSON"],
    label: "Se présenter en personne à votre établissement",
  },
];
