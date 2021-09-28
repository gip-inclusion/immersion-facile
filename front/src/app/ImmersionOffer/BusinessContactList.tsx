import { useField } from "formik";
import React from "react";
import { ProfessionList } from "src/app/ImmersionOffer/ProfessionList";
import { ButtonAdd } from "src/components/ButtonAdd";
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
    <div style={{ display: "flex", flexDirection: "column" }}>
      {field.value.map((_, index) => (
        <BusinessContact index={index} key={index} />
      ))}
      <ButtonAdd
        style={{ alignSelf: "center", margin: "30px auto" }}
        onClick={() => setValue([...field.value, emptyContact])}
      >
        Ajouter un référent
      </ButtonAdd>
    </div>
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
      <h4>Détails du référent :</h4>
      <TextInput label="Nom du référent" name={makeName("lastName")} />
      <TextInput label="Prénom du référent" name={makeName("firstName")} />
      <TextInput label="Fonction du référent" name={makeName("job")} />
      <TextInput
        label="Son numéro de téléphone (ne sera pas communiqué directement)"
        name={makeName("phone")}
      />
      <TextInput label="Son email" name={makeName("email")} />
      <label>Responsable des métiers suivants :</label>
      <ProfessionList name={makeName("professions")} />
    </div>
  );
};
