import { useField } from "formik";
import React from "react";
import { ProfessionList } from "src/app/ImmersionOffer/ProfessionList";
import { ButtonAdd } from "src/components/ButtonAdd";
import { DeleteButton } from "src/components/DeleteButton";
import { TextInput } from "src/components/form/TextInput";
import {
  BusinessContactDto,
  ImmersionOfferDto,
} from "src/shared/ImmersionOfferDto";
import { removeAtIndex } from "../../../../back/src/shared/utils";

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

  const onDelete = (index: number) => {
    setValue(removeAtIndex(field.value, index));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {field.value.map((_, index) => (
        <BusinessContact index={index} key={index} onDelete={onDelete} />
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
  onDelete: (indexToDelete: number) => void;
};

const BusinessContact = ({ index, onDelete }: BusinessContactProps) => {
  const parentFieldName: keyof ImmersionOfferDto = "businessContacts";
  const makeName = (name: keyof BusinessContactDto) =>
    `${parentFieldName}[${index}].${name}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", padding: "10px" }}>
        <DeleteButton onClick={() => onDelete(index)} />
        <h4 style={{ margin: 0 }}>Détails du référent :</h4>
      </div>
      <TextInput label="Nom du référent *" name={makeName("lastName")} />
      <TextInput label="Prénom du référent *" name={makeName("firstName")} />
      <TextInput label="Fonction du référent *" name={makeName("job")} />
      <TextInput
        label="Son numéro de téléphone (ne sera pas communiqué directement) *"
        name={makeName("phone")}
      />
      <TextInput label="Son email *" name={makeName("email")} />
      <label>Responsable des métiers suivants :</label>
      <ProfessionList name={makeName("professions")} />
    </div>
  );
};
