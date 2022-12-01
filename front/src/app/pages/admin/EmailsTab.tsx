import { keys } from "ramda";
import React, { useEffect } from "react";
import {
  Accordion,
  DsfrTitle,
  Notification,
} from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { EmailSentDto, EmailVariables } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { sentEmailsSlice } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";
import { ENV } from "src/config/environmentVariables";
import { TextCell } from "src/app/components/admin/TextCell";

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
        <Notification title={"Non disponible en production"} type="warning">
          La récupération des emails n'est pas disponible en production
        </Notification>
      </div>
    );

  return (
    <div>
      <DsfrTitle level={5} text="Derniers emails envoyés" />
      {errorMessage ? (
        <Notification title={"Oups..."} type="error">
          {errorMessage}
        </Notification>
      ) : (
        <ul className="fr-accordions-group">
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
      title={`${email.error ? "❌" : "✅"} ${
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
          <ul className="text-xs">
            {keys(email.templatedEmail.params).map((key: EmailVariables) => {
              const value = (
                email.templatedEmail.params as Record<EmailVariables, string>
              )[key];

              const links: EmailVariables[] = [
                "magicLink",
                "conventionFormUrl",
                "editFrontUrl",
              ];

              return (
                <li key={key}>
                  {" "}
                  <span className="font-normal">{key} :</span>{" "}
                  <span
                    style={{ width: "500px" }}
                    className="font-thin inline-block break-words"
                  >
                    {links.includes(key) ? (
                      <a href={value as string}>Liens vers la page</a>
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
