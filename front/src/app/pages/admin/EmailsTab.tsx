import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { keys } from "ramda";

import { EmailSentDto, EmailVariables } from "shared";

import { DsfrTitle } from "react-design-system";

import { TextCell } from "src/app/components/admin/TextCell";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ENV } from "src/config/environmentVariables";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { sentEmailsSlice } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";

export const EmailsTab = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(sentEmailsSlice.actions.lastSentEmailsRequested());
  }, []);
  const latestEmails = useAppSelector(adminSelectors.sentEmails.sentEmails);
  const errorMessage = useAppSelector(adminSelectors.sentEmails.error);

  if (ENV.envType === "production")
    return (
      <div>
        <DsfrTitle level={5} text="Derniers emails envoyés" />
        <Alert
          title={"Non disponible en production"}
          severity="warning"
          description="La récupération des emails n'est pas disponible en production"
        />
      </div>
    );

  return (
    <div>
      <DsfrTitle level={5} text="Derniers emails envoyés" />
      {errorMessage ? (
        <Alert title={"Oups..."} severity="error" description={errorMessage} />
      ) : (
        <ul className={fr.cx("fr-accordions-group")}>
          {latestEmails.map((email, index) => (
            <li key={index}>
              <Email email={email} />
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Email = ({ email }: { email: EmailSentDto }) => {
  const sentAtDate = new Date(email.sentAt);
  return (
    <Accordion
      label={`${email.error ? "❌" : "✅"} ${
        email.templatedEmail.type
      } envoyé le ${sentAtDate.toLocaleDateString(
        "fr",
      )} à ${sentAtDate.toLocaleTimeString("fr")}`}
    >
      <TextCell title="Type" contents={email.templatedEmail.type} />
      <TextCell
        title="Destinataires"
        contents={email.templatedEmail.recipients.join(", ")}
      />
      <TextCell title="CC" contents={email.templatedEmail.cc?.join(", ")} />
      <TextCell
        title="Paramètres"
        contents={
          <ul className={fr.cx("fr-text--xs")}>
            {keys(email.templatedEmail.params).map((key: EmailVariables) => {
              const value = (
                email.templatedEmail.params as Record<EmailVariables, string>
              )[key];

              const links: EmailVariables[] = [
                "agencyLogoUrl",
                "conventionFormUrl",
                "conventionStatusLink",
                "editFrontUrl",
                "immersionAssessmentCreationLink",
                "magicLink",
              ];

              return (
                <li key={key}>
                  {" "}
                  <span>{key} :</span>{" "}
                  <span style={{ wordWrap: "break-word" }}>
                    {links.includes(key) ? (
                      <a href={value as string}>Lien vers la page</a>
                    ) : (
                      JSON.stringify(value, undefined, 2)
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        }
      />
      {email?.error && (
        <TextCell title="Message d'erreur" contents={email.error} />
      )}
    </Accordion>
  );
};
