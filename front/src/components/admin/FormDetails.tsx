import React, { Component } from "react";
import { Accordion } from "./Accordion";
import { TextCell } from "./TextCell";
import { FormAccordionProps } from "./FormAccordion";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { prettyPrintSchedule } from "src/shared/ScheduleUtils";

type KeyedFormData = { title: string; key: keyof ImmersionApplicationDto };
type TextFormData = { title: string; text: string };
type BoolFormData = { title: string; value: boolean };

export const FormDetails = ({ data }: FormAccordionProps) => {
  const candidateFields: Array<BoolFormData | KeyedFormData> = [
    { title: "Mail de démandeur", key: "email" },
    { title: "Nom", key: "lastName" },
    { title: "Prénom", key: "firstName" },
    { title: "Numero de téléphone", key: "phone" },
    { title: "Signé", value: data.beneficiaryAccepted },
  ];

  let scheduleText = data.legacySchedule
    ? data.legacySchedule.description
    : prettyPrintSchedule(data.schedule);

  const immersionFields: Array<KeyedFormData | TextFormData | BoolFormData> = [
    { title: "Date de soumission", key: "dateSubmission" },
    { title: "Début", key: "dateStart" },
    { title: "Fin", key: "dateEnd" },
    { title: "Adresse d'immersion", key: "immersionAddress" },
    { title: "Metier observé", key: "immersionProfession" },
    { title: "Activités", key: "immersionActivities" },
    { title: "Objectif", key: "immersionObjective" },
    { title: "Horaires", text: scheduleText },
    { title: "Protection individuelle", value: data.individualProtection },
    data.sanitaryPrevention
      ? {
          title: "Mesures de prévention sanitaire",
          key: "sanitaryPreventionDescription",
        }
      : {
          title: "Mesures de prévention sanitaire",
          value: data.sanitaryPrevention,
        },
  ];

  const enterpriseFields: KeyedFormData[] = [
    { title: "Entreprise", key: "businessName" },
    { title: "Siret", key: "siret" },
  ];

  const mentorFields: Array<BoolFormData | KeyedFormData> = [
    { title: "Tuteur", key: "mentor" },
    { title: "Numero de téléphone du tuteur", key: "mentorPhone" },
    { title: "Mail de tuteur", key: "mentorEmail" },
    { title: "Signé", value: data.enterpriseAccepted },
  ];

  const allFields = [
    { listTitle: "Candidate", fields: candidateFields },
    { listTitle: "Immersion", fields: immersionFields },
    { listTitle: "Entreprise", fields: enterpriseFields },
    { listTitle: "Tuteur", fields: mentorFields },
  ];

  return (
    <div className="static-application-container">
      {allFields.map(({ listTitle, fields }, index) => {
        return (
          <Accordion title={listTitle} key={listTitle}>
            {fields.map((formData) => {
              if ("key" in formData) {
                return (
                  <TextCell
                    title={formData.title}
                    contents={JSON.stringify(data[formData.key])}
                    key={formData.title}
                  />
                );
              } else if ("value" in formData) {
                return (
                  <TextCell
                    title={formData.title}
                    contents={formData.value ? "✅" : "❌"}
                    key={formData.title}
                  />
                );
              } else {
                return (
                  <TextCell
                    title={formData.title}
                    contents={formData.text}
                    key={formData.title}
                  />
                );
              }
            })}
          </Accordion>
        );
      })}
    </div>
  );
};
