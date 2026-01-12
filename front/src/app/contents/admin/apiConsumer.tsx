import { fr } from "@codegouvfr/react-dsfr";
import type { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { keys } from "ramda";
import { useState } from "react";
import {
  type ApiConsumer,
  type ApiConsumerContact,
  type ApiConsumerId,
  type ApiConsumerKind,
  type ApiConsumerName,
  type ApiConsumerRights,
  type ConventionScope,
  domElementIds,
  type NoScope,
} from "shared";

const apiConsumerKindSeverity: Record<ApiConsumerKind, AlertProps.Severity> = {
  READ: "success",
  WRITE: "warning",
  SUBSCRIPTION: "info",
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
        // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
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
  revokedAt: string | null,
) => (
  <>
    <strong>{id}</strong>
    <br />({name})
    {revokedAt && (
      <Badge severity="error" className={fr.cx("fr-mt-1w")}>
        Révoqué
      </Badge>
    )}
  </>
);

export const formatApiConsumerScope = (scope: NoScope | ConventionScope) => {
  if (scope === "no-scope") return "";
  return <ApiConsumerConventionScopeDisplayed scope={scope} />;
};

type ApiConsumerActionHandlers = {
  onEdit: (apiConsumer: ApiConsumer) => void;
  onRevoke: (apiConsumer: ApiConsumer) => void;
  onRenewKey: (apiConsumer: ApiConsumer) => void;
};

export const makeApiConsumerActionButtons = (
  apiConsumer: ApiConsumer,
  handlers: ApiConsumerActionHandlers,
) => {
  const isRevoked = apiConsumer.revokedAt !== null;
  return (
    <ButtonsGroup
      inlineLayoutWhen="always"
      buttonsSize="small"
      buttons={[
        {
          children: "Éditer",
          type: "button",
          onClick: () => handlers.onEdit(apiConsumer),
          id: domElementIds.admin.technicalOptionsTab.editApiConsumerButton({
            apiConsumerId: apiConsumer.id,
          }),
          disabled: isRevoked,
        },
        {
          children: "Révoquer",
          type: "button",
          priority: "tertiary",
          onClick: () => handlers.onRevoke(apiConsumer),
          id: domElementIds.admin.technicalOptionsTab.revokeApiConsumerButton({
            apiConsumerId: apiConsumer.id,
          }),
          disabled: isRevoked,
        },
        {
          children: isRevoked ? "Réactiver" : "Renouveler clé",
          type: "button",
          priority: "tertiary",
          onClick: () => handlers.onRenewKey(apiConsumer),
          id: domElementIds.admin.technicalOptionsTab.renewApiConsumerKeyButton(
            {
              apiConsumerId: apiConsumer.id,
            },
          ),
        },
      ]}
    />
  );
};
