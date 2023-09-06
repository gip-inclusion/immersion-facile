import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { keys } from "ramda";
import {
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerId,
  ApiConsumerKind,
  ApiConsumerName,
  ApiConsumerRights,
  ConventionScope,
  NoScope,
} from "shared";

const apiConsumerKindSeverity: Record<ApiConsumerKind, AlertProps.Severity> = {
  READ: "success",
  WRITE: "warning",
};

const ApiConsumerConventionScopeDisplayed = ({
  scope,
}: {
  scope: ConventionScope;
}) => {
  const apiConsumerScopeName = keys(scope);
  const [isScopeDisplayed, setIsDisplayed] = useState(false);
  return (
    <>
      <Button
        className={fr.cx("fr-my-1w")}
        size="small"
        priority="secondary"
        type="button"
        onClick={() => {
          setIsDisplayed(!isScopeDisplayed);
        }}
      >
        {isScopeDisplayed ? "Cacher les scopes" : "Voir les scopes"}
      </Button>
      {isScopeDisplayed && (
        <ul className={fr.cx("fr-text--xs")}>
          {apiConsumerScopeName
            .filter((scopeName) => !!scope[scopeName])
            .map((scopeName) => {
              const scopeValues = scope[scopeName];
              if (!scopeValues) return null;
              return (
                <li key={scopeName}>
                  {scopeName} :{" "}
                  {scopeValues.length > 0 && (
                    <ul>
                      {scopeValues.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                  )}
                  {scopeValues.length === 0 && <span>vide</span>}
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
};

export const formatApiConsumerContact = (
  apiConsumerContact: ApiConsumerContact,
) => `${apiConsumerContact.lastName} ${apiConsumerContact.firstName}
  ${apiConsumerContact.job}
  ${apiConsumerContact.phone}
  ${apiConsumerContact.emails.join(", ")}`;

export const formatApiConsumerRights = (
  apiConsumerRights: ApiConsumerRights,
) => {
  const apiConsumerNames = keys(apiConsumerRights);
  return (
    <ul>
      {apiConsumerNames.map((name, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>
          <strong>{name}</strong>
          <ul className={fr.cx("fr-badge-group")}>
            {apiConsumerRights[name].kinds.map((kind) => (
              <li key={kind}>
                <Badge severity={apiConsumerKindSeverity[kind]}>{kind}</Badge>
              </li>
            ))}
          </ul>
          {formatApiConsumerScope(apiConsumerRights[name].scope)}
        </li>
      ))}
    </ul>
  );
};

export const formatApiConsumerDescription = (
  description: string | undefined,
) => {
  if (!description) return "";
  return (
    <span title={description}>
      {description.length <= 15
        ? description
        : `${description.slice(0, 15)}...`}
    </span>
  );
};

export const formatApiConsumerName = (
  id: ApiConsumerId,
  name: ApiConsumerName,
) => (
  <>
    <strong>{id}</strong>
    <br />({name})
  </>
);

export const formatApiConsumerScope = (scope: NoScope | ConventionScope) => {
  if (scope === "no-scope") return "";
  return <ApiConsumerConventionScopeDisplayed scope={scope} />;
};

export const makeApiConsumerActionButtons = (
  apiConsumer: ApiConsumer,
  onClick: (apiConsumer: ApiConsumer) => void,
) => (
  <Button size="small" type="button" onClick={() => onClick(apiConsumer)}>
    Éditer
  </Button>
);
