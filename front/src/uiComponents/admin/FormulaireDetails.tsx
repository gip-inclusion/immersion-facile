import React from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { Accordion } from "react-design-system/immersionFacile";
import { ConventionFormAccordionProps as FormAccordeonProps } from "./ConventionFormAccordion";
import { TextCell } from "./TextCell";

type FieldForFormDetails = {
  title: string;
  key: keyof ConventionDto;
};

// TODO(stk): show schedule, individual protection, signature status, upload date
const candidateFields: FieldForFormDetails[] = [
  { title: "Mail de démandeur", key: "email" },
  { title: "Nom", key: "lastName" },
  { title: "Prénom", key: "firstName" },
  { title: "Numero de téléphone", key: "phone" },
];

const immersionFields: FieldForFormDetails[] = [
  { title: "Début", key: "dateStart" },
  { title: "Fin", key: "dateEnd" },
  { title: "Adresse d'immersion", key: "immersionAddress" },
  { title: "Activités", key: "immersionActivities" },
  { title: "Metier observé", key: "immersionAppellation" },
  { title: "Objectif", key: "immersionObjective" },
];

const enterpriseFields: FieldForFormDetails[] = [
  { title: "Entreprise", key: "businessName" },
  { title: "Siret", key: "siret" },
];

const mentorFields: FieldForFormDetails[] = [
  { title: "Tuteur", key: "mentor" },
  { title: "Numero de téléphone du tuteur", key: "mentorPhone" },
  { title: "Mail de tuteur", key: "mentorEmail" },
];

const allFields = [
  { listTitle: "Candidate", fields: candidateFields },
  { listTitle: "Immersion", fields: immersionFields },
  { listTitle: "Entreprise", fields: enterpriseFields },
  { listTitle: "Tuteur", fields: mentorFields },
];

export const FormDetails = ({ convention }: FormAccordeonProps) => (
  <div className="static-application-container">
    {allFields.map(({ listTitle, fields }) => (
      <Accordion title={listTitle} key={listTitle}>
        {fields.map(({ title, key }) => (
          <TextCell
            title={title}
            contents={JSON.stringify(convention[key])}
            key={key}
          />
        ))}
      </Accordion>
    ))}
  </div>
);
