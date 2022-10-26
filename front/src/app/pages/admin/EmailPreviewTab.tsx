import React, { useState } from "react";
import { generateHtmlFromTemplate, templateByName } from "html-templates";
import { keys } from "ramda";
import { EmailVariables } from "shared";
import { DsfrTitle } from "react-design-system";

type TemplateName = keyof typeof templateByName;

export const EmailPreviewTab = () => {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateName>(
    "AGENCY_WAS_ACTIVATED",
  );
  const fakeContent = generateHtmlFromTemplate(
    currentTemplate,
    defaultValueByVariableName,
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

const defaultValueByVariableName: Record<EmailVariables, string> = {
  additionalDetails: "ADDITIONAL_DETAILS",
  advisorFirstName: "ADVISOR_FIRST_NAME",
  advisorLastName: "ADVISOR_LAST_NAME",
  agency: "AGENCY",
  agencyLogoUrl: "https://beta.gouv.fr/img/logo_twitter_image-2019.jpg",
  agencyName: "AGENCY_NAME",
  beneficiaryEmail: "BENEFICIARY_EMAIL",
  beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
  beneficiaryLastName: "BENEFICIARY_LAST_NAME",
  beneficiaryName: "BENEFICIARY_NAME",
  businessAddress: "BUSINESS_ADDRESS",
  businessName: "BUSINESS_NAME",
  signatoryName: "SIGNATORY_NAME",
  contactFirstName: "CONTACT_FIRSTNAME",
  contactLastName: "CONTACT_LASTNAME",
  contactPhone: "CONTACT_PHONE",
  conventionFormUrl: "APPLICATION_FORM_LINK",
  dateEnd: "DATE_END",
  dateStart: "DATE_START",
  demandeId: "DEMANDE_ID",
  editFrontUrl: "EDIT_FRONT_LINK",
  emergencyContact: "EMERGENCY_CONTACT",
  emergencyContactPhone: "EMERGENCY_CONTACT_PHONE",
  existingSignatureName: "EXISTING_SIGNATURE_NAME",
  firstName: "FIRST_NAME",
  immersionActivities: "IMMERSION_ACTIVITIES",
  immersionAddress: "IMMERSION_ADDRESS",
  immersionAppellation: "IMMERSION_PROFESSION",
  immersionAppellationLabel: "IMMERSION_PROFESSION",
  immersionAssessmentCreationLink: "IMMERSION_ASSESSMENT_CREATION_LINK",
  immersionProfession: "IMMERSION_PROFESSION",
  immersionSkills: "IMMERSION_SKILLS",
  individualProtection: "INDIVIDUAL_PROTECTION",
  jobLabel: "JOB_LABEL",
  lastName: "LAST_NAME",
  magicLink: "MAGIC_LINK",
  establishmentTutorName: "MENTOR_NAME",
  beneficiaryRepresentativeName: "LEGAL_REPRESENTATIVE_NAME",
  message: "MESSAGE",
  possibleRoleAction: "POSSIBLE_ROLE_ACTION",
  potentialBeneficiaryEmail: "POTENTIAL_BENEFICIARY_EMAIL",
  potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRSTNAME",
  potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LASTNAME",
  questionnaireUrl: "QUESTIONNAIRE_URL",
  reason: "REASON",
  rejectionReason: "REASON",
  sanitaryPrevention: "SANITARY_PREVENTION_DESCRIPTION",
  scheduleText: "SCHEDULE_LINES",
  signature: "SIGNATURE",
  totalHours: "TOTAL_HOURS",
  workConditions: "WORK_CONDITIONS",
  establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
};
