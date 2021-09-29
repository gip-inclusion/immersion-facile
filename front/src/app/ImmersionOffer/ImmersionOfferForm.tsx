import { Form, Formik } from "formik";
import React, { useState } from "react";
import { BusinessContactList } from "src/app/ImmersionOffer/BusinessContactList";
import { BusinessSectorInput } from "src/app/ImmersionOffer/BusinessSectorInput";
import { ProfessionList } from "src/app/ImmersionOffer/ProfessionList";
import { routes } from "src/app/routes";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchCompanyInfoBySiret";
import { CheckboxGroup } from "src/components/form/CheckboxGroup";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { MarianneHeader } from "src/components/MarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  ContactMethod,
  ImmersionOfferDto,
  immersionOfferDtoSchema,
} from "src/shared/ImmersionOfferDto";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";

type ImmersionOfferFormProps = {
  route: Route<typeof routes.immersionOffer>;
};

const initialValues: ImmersionOfferDto = !ENV.dev
  ? {
      id: uuidV4(),
      siret: "1234567890123",
      businessName: "My buisiness name",
      businessAddress: "My businessAddress:",
      businessSectorCode: "F",
      professions: [{ romeCodeMetier: "A10000" }],
      businessContacts: [
        {
          firstName: "John",
          lastName: "Doe",
          job: "super job",
          phone: "0D2837",
          email: "joe@mail.com",
          professions: [],
        },
      ],
      preferredContactMethods: ["EMAIL"],
    }
  : {
      id: uuidV4(),
      siret: "",
      businessName: "",
      businessAddress: "",
      businessSectorCode: "0",
      professions: [],
      businessContacts: [],
      preferredContactMethods: [],
    };

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod;
}> = [
  {
    value: "EMAIL",
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: "PHONE",
    label:
      "Par téléphone (seuls les candidats idetifiés auront accès au numéro de téléphone)",
  },
  {
    value: "IN_PERSON",
    label: "Se présenter en personne à votre établissement",
  },
];

const SiretRelatedInputs = () => {
  const { companyInfo } = useSiretFetcher();
  useSiretRelatedField("businessName", companyInfo);
  useSiretRelatedField("address", companyInfo);

  return (
    <>
      <TextInput
        label="Indiquez le SIRET de la structure d'accueil *"
        name="siret"
        placeholder="362 521 879 00034"
      />
      <TextInput
        label="Vérifiez le nom (raison sociale) de votre établissement *"
        name="businessName"
      />
      <TextInput
        label="Vérifiez l'adresse de votre établissement"
        name="address"
      />
    </>
  );
};

export const ImmersionOfferForm = ({ route }: ImmersionOfferFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <>
      <MarianneHeader />
      <div
        className="fr-grid-row fr-grid-row--center fr-grid-row--gutters"
        style={{ marginTop: "25px" }}
      >
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={immersionOfferDtoSchema}
          onSubmit={async (data) => {
            // TODO: post data: something like :
            // await immersionOfferGateway.addImmersionOffer(data)
            setIsSuccess(true);
            console.log("submitted: ", data);
          }}
        >
          {({ isSubmitting, submitCount, errors, values }) => (
            <div style={{ margin: "5px", maxWidth: "600px" }}>
              <Form>
                Votre établissement
                <SiretRelatedInputs />
                <BusinessSectorInput />
                <ProfessionList
                  name="professions"
                  title="Métiers de l'entreprise *"
                />
                <BusinessContactList />
                <CheckboxGroup
                  name="preferredContactMethods"
                  label="Comment souhaitez-vous que les candidats vous contactent ? *"
                  options={preferredContactMethodOptions}
                />
                {submitCount !== 0 && Object.values(errors).length > 0 && (
                  <div style={{ color: "red" }}>
                    Veuillez corriger les champs erronés :
                    <ul>
                      {Object.values(errors).map((err) =>
                        typeof err === "string" && err !== "Obligatoire" ? (
                          <li key={err}>{err}</li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                )}
                <button
                  className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                >
                  Enregistrer mes informations
                </button>
                <br />
                <br />
                {isSuccess && <SuccessMessage title="Succès de l'envoi" />}
              </Form>
            </div>
          )}
        </Formik>
      </div>
    </>
  );
};
