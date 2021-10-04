import { useField } from "formik";
import React from "react";
import { DeleteButton } from "src/components/DeleteButton";
import { TextInput } from "src/components/form/TextInput";
import {
  BusinessContactDto,
  ImmersionOfferDto,
} from "src/shared/ImmersionOfferDto";
import { removeAtIndex } from "src/shared/utils";

const emptyContact: BusinessContactDto = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  job: "",
};

export const BusinessContactList = () => {
  const name: keyof ImmersionOfferDto = "businessContacts";
  const [field, _, { setValue }] = useField<BusinessContactDto[]>({ name });

  const businessContacts = field.value;

  // const onDelete = (index: number) => {
  //   setValue(removeAtIndex(businessContacts, index));
  // };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {businessContacts.map((_, index) => (
        <BusinessContact index={index} key={index} /* onDelete={onDelete} */ />
      ))}
    </div>
  );
};

type BusinessContactProps = {
  index: number;
  onDelete?: (indexToDelete: number) => void;
};

const BusinessContact = ({ index, onDelete }: BusinessContactProps) => {
  const parentFieldName: keyof ImmersionOfferDto = "businessContacts";
  const makeName = (name: keyof BusinessContactDto) =>
    `${parentFieldName}[${index}].${name}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", padding: "10px" }}>
        {typeof onDelete !== "undefined" && (
          <DeleteButton onClick={() => onDelete(index)} />
        )}
        <h4 style={{ margin: 0 }}>Détails du correspondant immersion :</h4>
        <p>Le correspondant reçoit les demandes et les traite</p>
      </div>
      <TextInput label="Nom du référent *" name={makeName("lastName")} />
      <TextInput label="Prénom du référent *" name={makeName("firstName")} />
      <TextInput label="Fonction du référent *" name={makeName("job")} />
      <TextInput
        label="Numéro de téléphone (ne sera pas communiqué directement) *"
        name={makeName("phone")}
      />
      <TextInput label="Email *" name={makeName("email")} />
    </div>
  );
};
