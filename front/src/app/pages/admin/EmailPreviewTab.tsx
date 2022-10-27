import React, { useEffect, useState } from "react";
import { generateHtmlFromTemplate, templateByName } from "html-templates";
import { keys } from "ramda";
import { DsfrTitle, ImmersionTextField } from "react-design-system";

type TemplateByName = typeof templateByName;
type TemplateName = keyof TemplateByName;

export const EmailPreviewTab = () => {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateName>(
    "AGENCY_WAS_ACTIVATED",
  );

  const defaultEmailVariableForTemplate =
    defaultEmailValueByEmailKind[currentTemplate];
  const [emailVariables, setEmailVariables] = useState(
    defaultEmailVariableForTemplate,
  );

  useEffect(() => {
    setEmailVariables(defaultEmailVariableForTemplate);
  }, [currentTemplate]);

  const fakeContent = generateHtmlFromTemplate(
    currentTemplate,
    emailVariables,
    {
      skipHead: true,
    },
  );
  //console.log(fakeContent.htmlContent);
  return (
    <div className="admin-tab__email-preview">
      <DsfrTitle level={5} text="Aperçu de template email" />
      <div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <aside className="fr-col-12 fr-col-lg-4">
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="selectTemplateName">
                Liste de templates email :
              </label>
              <select
                className="fr-select"
                id="selectTemplateName"
                name="templateName"
                onChange={(event) =>
                  setCurrentTemplate(event.currentTarget.value as TemplateName)
                }
              >
                {keys(templateByName).map((templateName) => (
                  <option key={templateName} value={templateName}>
                    {templateByName[templateName].niceName}
                  </option>
                ))}
              </select>
            </div>

            <h6>Métadonnées</h6>
            <ul className="fr-badge-group">
              <li>
                <span className="fr-badge fr-badge--green-menthe">Sujet</span>
              </li>
              <li>{fakeContent.subject}</li>
            </ul>
            {fakeContent.tags && fakeContent.tags.length > -1 && (
              <ul className="fr-badge-group fr-mt-2w">
                <li>
                  <span className="fr-badge fr-badge--blue-ecume">Tags</span>
                </li>
                <li>{fakeContent.tags.join(", ")}</li>
              </ul>
            )}

            <h6 className="fr-mt-4w">Données de prévisualisation</h6>
            <ul className="fr-badge-group">
              {Object.keys(emailVariables)
                .sort()
                .map((variableName) => {
                  const variableValue: any =
                    emailVariables[variableName as keyof typeof emailVariables];
                  return (
                    <li key={variableName}>
                      {["string", "number", "undefined"].includes(
                        typeof variableValue,
                      ) ? (
                        <ImmersionTextField
                          label={variableName}
                          name={variableName}
                          value={variableValue ?? ""}
                          className={"fr-mb-2w"}
                          onChange={(e) =>
                            setEmailVariables({
                              ...emailVariables,
                              [variableName]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="fr-input-group fr-mb-2w">
                          <label className="fr-label">{variableName}</label>
                          <pre className={"fr-text--xs fr-m-auto"}>
                            <code>
                              {JSON.stringify(variableValue, null, 2)}
                            </code>
                          </pre>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </aside>
          <section className="fr-col-12 fr-col-lg-8">
            <div
              className="admin-tab__email-preview-wrapper"
              dangerouslySetInnerHTML={{ __html: fakeContent.htmlContent }}
            ></div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const defaultEmailValueByEmailKind: {
  [K in TemplateName]: Parameters<TemplateByName[K]["createEmailVariables"]>[0];
} = {
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    demandeId: "DEMANDE_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    demandeId: "DEMANDE_ID",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    demandeId: "DEMANDE_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    agencyName: "AGENCY_NAME",
    magicLink: "MAGIC_LINK",
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    totalHours: 0,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    emergencyContact: undefined,
    emergencyContactPhone: undefined,
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    beneficiaryRepresentativeName: "BENEFICIARY_REPRESENTATIVE_NAME",
    scheduleText: ["HOUR1", "HOUR2"],
    businessName: "BUSINESS_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    immersionAppellationLabel: "IMMERSION_APPELLATION_LABEL",
    immersionActivities: "IMMERSION_ACTIVITIES",
    immersionSkills: "IMMERSION_SKILLS",
    sanitaryPrevention: "SANITARY_PREVENTION",
    individualProtection: "INDIVIDUAL_PROTECTION",
    questionnaireUrl: "QUESTIONNAIRE_URL",
    signature: "SIGNATURE",
    workConditions: undefined,
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    rejectionReason: "REJECTION_REASON",
    businessName: "BUSINESS_NAME",
    signature: "SIGNATURE",
    immersionProfession: "IMMERSION_PROFESSION",
    agency: "AGENCY",
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    reason: "REASON",
    businessName: "BUSINESS_NAME",
    signature: "SIGNATURE",
    immersionAppellation: {
      appellationCode: "A1111",
      appellationLabel: "MON LABEL APPELATION",
      romeCode: "R1111",
      romeLabel: "MON LABEL ROME",
    },
    agency: "AGENCY",
    magicLink: "MAGIC_LINK",
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    possibleRoleAction: "POSSIBLE_ROLE_ACTION",
  },
  MAGIC_LINK_RENEWAL: {
    magicLink: "MAGIC_LINK",
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    magicLink: "MAGIC_LINK",
    existingSignatureName: "EXISTING_SIGNATURE_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    immersionProfession: "IMMERSION_PROFESSION",
    businessName: "BUSINESS_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    beneficiaryName: "BENEFICIARY_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    beneficiaryRepresentativeName: undefined,
    signatoryName: "SIGNATORY_NAME",
    magicLink: "MAGIC_LINK",
    businessName: "BUSINESS_NAME",
  },
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    jobLabel: "JOB_LABEL",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
    potentialBeneficiaryEmail: "POTENTIAL_BENEFICIARY_EMAIL",
    message: "MESSAGE",
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    contactPhone: "CONTACT_PHONE",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    businessAddress: "BUSINESS_ADDRESS",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    additionalDetails: "ADDITIONAL_DETAILS",
    conventionFormUrl: "CONVENTION_FORM_URL",
  },
  AGENCY_WAS_ACTIVATED: {
    agencyName: "AGENCY_NAME",
    agencyLogoUrl: undefined,
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: "EDIT_FRONT_URL",
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    editFrontUrl: "EDIT_FRONT_URL",
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    businessName: "BUSINESS_NAME",
  },
  CREATE_IMMERSION_ASSESSMENT: {
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    immersionAssessmentCreationLink: "IMMERSION_ASSESSMENT_CREATION_LINK",
  },
  FULL_PREVIEW_EMAIL: {
    beneficiaryName: "BENEFICIARY_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    beneficiaryRepresentativeName: undefined,
    signatoryName: "SIGNATORY_NAME",
    magicLink: "MAGIC_LINK",
    businessName: "BUSINESS_NAME",
  },
};
