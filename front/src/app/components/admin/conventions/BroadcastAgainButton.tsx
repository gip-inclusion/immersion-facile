import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import type { ApiConsumer, ConventionReadDto, Role } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

const useApiConsumers = () => {
  const dispatch = useDispatch();
  const apiConsumers = useAppSelector(apiConsumerSelectors.apiConsumers);
  const inclusionConnectToken = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  useEffect(() => {
    inclusionConnectToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(
          inclusionConnectToken,
        ),
      );
  }, [inclusionConnectToken, dispatch]);
  return { apiConsumers };
};

const broadcastAgainButton = createModal({
  isOpenedByDefault: false,
  id: "im-broadcast-modal",
});

const isConventionInScope = (
  apiConsumer: ApiConsumer,
  convention: ConventionReadDto,
) => {
  if (
    apiConsumer.rights.convention.scope.agencyKinds?.includes(
      convention.agencyKind,
    )
  )
    return true;

  if (
    apiConsumer.rights.convention.scope.agencyIds?.includes(convention.agencyId)
  )
    return true;

  return false;
};

export const BroadcastAgainButton = ({
  convention,
}: {
  convention: ConventionReadDto;
}) => {
  const dispatch = useDispatch();
  const { apiConsumers } = useApiConsumers();

  const partners = [
    ...apiConsumers.filter(
      (apiConsumer) =>
        apiConsumer.rights.convention.subscriptions.length !== 0 &&
        isConventionInScope(apiConsumer, convention),
    ),
    ...(convention.agencyKind === "pole-emploi"
      ? [{ name: "France Travail", id: "france-travail" }]
      : []),
  ];

  if (partners.length === 0) return null;

  return (
    <>
      <Button
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          broadcastAgainButton.open();
        }}
      >
        Rediffuser au partenaire
      </Button>
      {createPortal(
        <broadcastAgainButton.Component title="Rediffuser au partenaire">
          Vous allez rediffuser aux partenaires suivant :
          <ul>
            {partners.map(({ name, id }) => (
              <li key={id}>{name}</li>
            ))}
          </ul>
          <Button
            onClick={() => {
              dispatch(
                conventionSlice.actions.broadcastConventionToPartnerRequested({
                  conventionId: convention.id,
                  feedbackTopic: "broadcast-convention-again",
                }),
              );
              broadcastAgainButton.close();
            }}
          >
            Rediffuser
          </Button>
        </broadcastAgainButton.Component>,
        document.body,
      )}
    </>
  );
};

type ShowModalParams = {
  userRoles: Role[];
  convention: ConventionReadDto;
};

export const shouldShowBroadcast = ({
  userRoles,
  convention,
}: ShowModalParams) => {
  if (!userRoles.includes("backOffice")) return false;

  // should check if agency has an API consumer which has subscriptions.
  // This will have to be done, when the Button is made available for Agencies (and not only for IF admins)
  return (
    convention.agencyKind === "pole-emploi" ||
    convention.agencyKind === "mission-locale"
  );
};
