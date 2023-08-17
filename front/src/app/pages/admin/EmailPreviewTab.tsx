import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { keys } from "ramda";
import { useStyles } from "tss-react/dsfr";
import {
  domElementIds,
  type EmailTemplatesByName,
  emailTemplatesByName,
  immersionFacileContactEmail,
  internshipKinds,
} from "shared";
import { ImmersionTextField } from "react-design-system";
import { configureGenerateHtmlFromTemplate } from "html-templates";
import {
  cciCustomHtmlFooter,
  cciCustomHtmlHeader,
} from "html-templates/src/components/email";

const defaultEmailPreviewUrl =
  "https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png";

type TemplateName = keyof EmailTemplatesByName;

export const EmailPreviewTab = () => {
  const { cx } = useStyles();

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

  const fakeContent = configureGenerateHtmlFromTemplate(
    emailTemplatesByName,
    { contactEmail: immersionFacileContactEmail },
    "internshipKind" in emailVariables &&
      emailVariables.internshipKind === "mini-stage-cci"
      ? {
          header: cciCustomHtmlHeader,
          footer: cciCustomHtmlFooter,
        }
      : { footer: undefined, header: undefined },
  )(currentTemplate, emailVariables, {
    skipHead: true,
  });

  return (
    <div className={cx("admin-tab__email-preview")}>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w")}>Aperçu de template email</h5>
      <div>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <aside className={fr.cx("fr-col-12", "fr-col-lg-4")}>
            <Select
              label="Liste de templates email :"
              placeholder="Veuillez sélectionner un template email"
              options={keys(emailTemplatesByName).map((templateName) => ({
                label: emailTemplatesByName[templateName].niceName,
                value: templateName,
              }))}
              nativeSelectProps={{
                id: domElementIds.admin.emailPreviewTab.emailTemplateNameSelect,
                name: "templateName",
                onChange: (event) =>
                  setCurrentTemplate(event.currentTarget.value),
              }}
            />

            <h6>Métadonnées</h6>
            <ul className={fr.cx("fr-badge-group")}>
              <li>
                <span className={fr.cx("fr-badge", "fr-badge--green-menthe")}>
                  Sujet
                </span>
              </li>
              <li>{fakeContent.subject}</li>
            </ul>
            {fakeContent.tags && fakeContent.tags.length > -1 && (
              <ul className={fr.cx("fr-badge-group", "fr-mt-2w")}>
                <li>
                  <span className={fr.cx("fr-badge", "fr-badge--blue-ecume")}>
                    Tags
                  </span>
                </li>
                <li>{fakeContent.tags.join(", ")}</li>
              </ul>
            )}

            <h6 className={fr.cx("fr-mt-4w")}>Données de prévisualisation</h6>
            <ul>
              {Object.keys(emailVariables)
                .sort()
                .map((variableName) => (
                  <li key={variableName}>
                    <EmailVariableField
                      variableName={variableName}
                      variableValue={
                        emailVariables[
                          variableName as keyof typeof emailVariables
                        ]
                      }
                      onChange={(value) =>
                        setEmailVariables({
                          ...emailVariables,
                          [variableName]: value,
                        })
                      }
                    />
                  </li>
                ))}
            </ul>
            <h6 className={fr.cx("fr-mt-4w")}>Pièces jointes</h6>
            {fakeContent.attachment ? (
              <ul>
                {fakeContent.attachment.map((att) => {
                  if ("url" in att) {
                    return (
                      <li key={att.url}>
                        <a target={"_blank"} href={att.url} rel="noreferrer">
                          {att.url}
                        </a>
                      </li>
                    );
                  }
                  return <li key={att.name}>{att.name}</li>;
                })}
              </ul>
            ) : (
              <p>Ce template de mail n'a pas de pièces jointes.</p>
            )}
          </aside>
          <section className={fr.cx("fr-col-12", "fr-col-lg-8")}>
            <div
              className={cx("admin-tab__email-preview-wrapper")}
              dangerouslySetInnerHTML={{ __html: fakeContent.htmlContent }}
            ></div>
          </section>
        </div>
      </div>
    </div>
  );
};

type EmailVariableFieldProps = {
  variableName: string;
  variableValue: any;
  onChange(value: any): void;
};
const EmailVariableField = ({
  variableName,
  variableValue,
  onChange,
}: EmailVariableFieldProps): JSX.Element => {
  if (variableName === "internshipKind")
    return (
      <Select
        label={variableName}
        options={internshipKinds.map((internshipKind) => ({
          label: internshipKind,
          value: internshipKind,
        }))}
        className={fr.cx("fr-mb-2w")}
        nativeSelectProps={{
          id: domElementIds.admin.emailPreviewTab.internshipKindSelect,
          name: variableName,
          onChange: (e) => onChange(e.target.value),
          value: variableValue,
        }}
      />
    );
  if (["string", "number", "undefined"].includes(typeof variableValue))
    return (
      <ImmersionTextField
        label={variableName}
        name={variableName}
        value={variableValue ?? ""}
        className={fr.cx("fr-mb-2w")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  return (
    <div className={fr.cx("fr-input-group", "fr-mb-2w")}>
      <label className={fr.cx("fr-label")}>{variableName}</label>
      <pre className={fr.cx("fr-text--xs", "fr-m-auto")}>
        <code>{JSON.stringify(variableValue, null, 2)}</code>
      </pre>
    </div>
  );
};

export const defaultEmailValueByEmailKind: {
  [K in TemplateName]: Parameters<
    EmailTemplatesByName[K]["createEmailVariables"]
  >[0];
} = {
  DISCUSSION_EXCHANGE: {
    subject: "SUBJECT",
    htmlContent:
      '<div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:57<br>Subject: Fwd: Hey !<br>To: &lt;<a href="mailto:tristan@reply-dev.immersion-facile.beta.gouv.fr">tristan@reply-dev.immersion-facile.beta.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><br><br><div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>De : <b class="gmail_sendername" dir="auto">Enguerran Weiss</b> <span dir="auto">&lt;<a href="mailto:enguerranweiss@gmail.com" target="_blank">enguerranweiss@gmail.com</a>&gt;</span><br>Date: mer. 28 juin 2023 à 09:55<br>Subject: Hey !<br>To: &lt;<a href="mailto:roger@reply-dev.immersion-facile.gouv.fr" target="_blank">roger@reply-dev.immersion-facile.gouv.fr</a>&gt;<br></div><br><br><div dir="ltr"><div><br clear="all"></div><div>Comment ça va ?</div><div><br></div><div><img src="cid:ii_ljff7lfo0" alt="IMG_20230617_151239.jpg" style="margin-right:0px" width="223" height="167"></div><div><br></div><div><br></div><div>A + !<br></div><div><br></div><div><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n</div><br clear="all"><br><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature" data-smartmail="gmail_signature"><div dir="ltr"><div><div dir="ltr"><span style="color:rgb(0,0,0);font-family:Times;font-size:medium"><img src="http://goodies.enguerranweiss.fr/id/sign_html-v2-bl.png"></span><p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:rgb(102,102,102)"></p><p style="font-family:Georgia,serif;font-size:11px;color:rgb(102,102,102)">+33(0)6 10 13 76 84 <br><a href="mailto:hello@enguerranweiss.fr" target="_blank">hello@enguerranweiss.fr</a><br><a href="http://www.enguerranweiss.fr" target="_blank">http://www.enguerranweiss.fr</a></p></div></div></div></div></div>\r\n',
  },
  SIGNATORY_FIRST_REMINDER: {
    actorFirstName: "ACTOR_FIRSTNAME",
    actorLastName: "ACTOR_LASTNAME",
    beneficiaryFirstName: "BENEFICIARY_FIRSTNAME",
    beneficiaryLastName: "BENEFICIARY_LASTNAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    signatoriesSummary: [
      `- ✔️  - A signé le 19/03/2023 - BENEFICIARY_FIRSTNAME BENEFICIARY_LASTNAME, bénéficiaire`,
      `- ❌ - N'a pas signé - BENEFICIARY_CURRENT_EMPLOYER_FIRSTNAME BENEFICIARY_CURRENT_EMPLOYER_FIRSTNAME, employeur actuel du bénéficiaire`,
      `- ❌ - N'a pas signé - ESTABLISHMENT_REPRESENTATIVE_FIRSTNAME ESTABLISHMENT_REPRESENTATIVE_FIRSTNAME, représentant l'entreprise BUSINESS_NAME`,
    ].join("\n"),
    magicLinkUrl: "http://----MAGICLINK----",
  },
  SIGNATORY_LAST_REMINDER: {
    actorFirstName: "ACTOR_FIRSTNAME",
    actorLastName: "ACTOR_LASTNAME",
    beneficiaryFirstName: "BENEFICIARY_FIRSTNAME",
    beneficiaryLastName: "BENEFICIARY_LASTNAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    signatoriesSummary: [
      `- ✔️  - A signé le 19/03/2023 - BENEFICIARY_FIRSTNAME BENEFICIARY_LASTNAME, bénéficiaire`,
      `- ❌ - N'a pas signé - BENEFICIARY_CURRENT_EMPLOYER_FIRSTNAME BENEFICIARY_CURRENT_EMPLOYER_FIRSTNAME, employeur actuel du bénéficiaire`,
      `- ❌ - N'a pas signé - ESTABLISHMENT_REPRESENTATIVE_FIRSTNAME ESTABLISHMENT_REPRESENTATIVE_FIRSTNAME, représentant l'entreprise BUSINESS_NAME`,
    ].join("\n"),
    magicLinkUrl: "http://----MAGICLINK----",
  },
  AGENCY_FIRST_REMINDER: {
    agencyMagicLinkUrl: "CONVENTION_VERIFICATION_LINK",
    agencyName: "AGENCY_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
  },
  AGENCY_LAST_REMINDER: {
    agencyMagicLinkUrl: "CONVENTION_VERIFICATION_LINK",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
  },
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    internshipKind: "immersion",
    conventionId: "CONVENTION_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    internshipKind: "immersion",
    conventionId: "CONVENTION_ID",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    internshipKind: "immersion",
    conventionId: "CONVENTION_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    agencyName: "AGENCY_NAME",
    magicLink: "http://MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
    warning: "WARNING",
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryBirthdate: "BENEFICIARY_BIRTHDATE",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    dateEnd: "DATE_END",
    dateStart: "DATE_START",
    emergencyContactInfos: "EMERGENCY_CONTACT_INFOS",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    immersionAppellationLabel: "IMMERSION_APPELLATION_LABEL",
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    conventionId: "CONVENTION_ID",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    conventionId: "CONVENTION_ID",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    agencyName: "AGENCY",
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    immersionProfession: "IMMERSION_PROFESSION",
    internshipKind: "immersion",
    rejectionReason: "REJECTION_REASON",
    signature: "SIGNATURE",
  },
  CANCELLED_CONVENTION_NOTIFICATION: {
    agencyName: "AGENCY",
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    immersionProfession: "IMMERSION_PROFESSION",
    internshipKind: "immersion",
    signature: "SIGNATURE",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    conventionId: "CONVENTION_ID",
    justification: "REASON",
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
    signature: "SIGNATURE",
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
    possibleRoleAction: "POSSIBLE_ROLE_ACTION",
  },
  MAGIC_LINK_RENEWAL: {
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    conventionId: "CONVENTION_ID",
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    existingSignatureName: "EXISTING_SIGNATURE_NAME",
    immersionProfession: "IMMERSION_PROFESSION",
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryName: "BENEFICIARY_NAME",
    beneficiaryRepresentativeName: undefined,
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    internshipKind: "immersion",
    conventionSignShortlink: "CONVENTION_SIGN_MAGIC_LINK",
    signatoryName: "SIGNATORY_NAME",
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    conventionSignShortlink: "http://www.google.fr",
    internshipKind: "immersion",
    justification: "REASON",
    signatoryFirstName: "SIGNATORY_FIRST_NAME",
    signatoryLastName: "SIGNATORY_LAST_NAME",
  },
  CONTACT_BY_EMAIL_REQUEST: {
    appellationLabel: "APPELLATION_LABEL",
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    immersionObjective: "Découvrir un métier ou un secteur d'activité",
    message: "MESSAGE",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
    potentialBeneficiaryPhone: "POTENTIAL_BENEFICIARY_PHONE",
    potentialBeneficiaryResumeLink: "POTENTIAL_BENEFICIARY_CV_OR_LINKEDIN",
    businessAddress: "BUSINESS_ADDRESS",
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
    internshipKind: "immersion",
    additionalDetails: "ADDITIONAL_DETAILS",
    conventionFormUrl: "CONVENTION_FORM_URL",
  },
  AGENCY_WAS_ACTIVATED: {
    agencyName: "AGENCY_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: "EDIT_FRONT_URL",
    businessAddress: "BUSINESS_ADDRESS",
    businessName: "BUSINESS_NAME",
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    editFrontUrl: "EDIT_FRONT_URL",
    businessAddress: "BUSINESS_ADDRESS",
    businessName: "BUSINESS_NAME",
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    businessName: "BUSINESS_NAME",
    businessAddress: "BUSINESS_ADDRESS",
  },
  CREATE_IMMERSION_ASSESSMENT: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    agencyValidatorEmail: "VALIDATOR_EMAIL",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    conventionId: "CONVENTION_ID",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    immersionAssessmentCreationLink: "IMMERSION_ASSESSMENT_CREATION_LINK",
    internshipKind: "immersion",
  },
  FULL_PREVIEW_EMAIL: {
    internshipKind: "immersion",
    beneficiaryName: "BENEFICIARY_NAME",
    conventionId: "CONVENTION_ID",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  SIGNEE_HAS_SIGNED_CONVENTION: {
    agencyLogoUrl: defaultEmailPreviewUrl,
    conventionId: "CONVENTION_ID",
    conventionStatusLink: "http://CONVENTION_STATUS_LINK",
    internshipKind: "immersion",
    signedAt: new Date().toISOString(),
    agencyName: "AGENCY_NAME",
  },
  IC_USER_RIGHTS_HAS_CHANGED: {
    agencyName: "AGENCY_NAME",
  },
  DEPRECATED_CONVENTION_NOTIFICATION: {
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    conventionId: "CONVENTION_ID",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    deprecationReason: "DEPRECATION_REASON",
    immersionProfession: "IMMERSION_PROFESSION",
    internshipKind: "immersion",
  },
};
