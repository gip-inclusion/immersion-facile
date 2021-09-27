import { useField } from "formik";
import React from "react";
import { ProfessionList } from "src/app/ImmersionOffer/ProfessionList";
import { TextInput } from "src/components/form/TextInput";
import {
  BusinessContactDto,
  ImmersionOfferDto,
} from "src/shared/ImmersionOfferDto";

const emptyContact: BusinessContactDto = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  job: "",
  professions: [],
};

export const BusinessContactList = () => {
  const name: keyof ImmersionOfferDto = "businessContacts";
  const [field, _, { setValue }] = useField<BusinessContactDto[]>({ name });

  return (
    <>
      {field.value.map((_, index) => (
        <BusinessContact index={index} key={index} />
      ))}
      <button
        type="button"
        onClick={() => setValue([...field.value, emptyContact])}
      >
        Ajouter un référent
      </button>
    </>
  );
};

type BusinessContactProps = {
  index: number;
};

const BusinessContact = ({ index }: BusinessContactProps) => {
  const parentFieldName: keyof ImmersionOfferDto = "businessContacts";
  const makeName = (name: keyof BusinessContactDto) =>
    `${parentFieldName}[${index}].${name}`;

  return (
    <div>
      <h4>Référent :</h4>
      <TextInput label="Nom du référent" name={makeName("lastName")} />
      <TextInput label="Prénom du référent" name={makeName("firstName")} />
      <TextInput label="Fonction du référent" name={makeName("job")} />
      <TextInput
        label="Son numéro de téléphone (ne sera pas communiqué directement)"
        name={makeName("phone")}
      />
      <TextInput label="Son email" name={makeName("email")} />
      <ProfessionList
        title="Responsable des métiers suivants :"
        name={makeName("professions")}
      />
    </div>
  );
};
