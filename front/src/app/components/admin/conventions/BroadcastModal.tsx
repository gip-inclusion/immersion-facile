import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import type { ConventionReadDto, Role } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

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

const broadcastModal = createModal({
  isOpenedByDefault: false,
  id: "im-broadcast-modal",
});

export const BroadcastAgainButton = ({
  convention,
}: {
  convention: ConventionReadDto;
}) => {
  const { apiConsumers } = useApiConsumers();

  const options = [
    ...apiConsumers
      .filter((c) => c.rights.convention.subscriptions.length !== 0)
      .map(({ id, name }) => ({ label: name, value: id })),
    ...(convention.agencyKind === "pole-emploi"
      ? [{ label: "France Travail", value: "france-travail" }]
      : []),
  ];

  if (options.length === 0) return null;

  return (
    <>
      <Button
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          broadcastModal.open();
        }}
      >
        Rediffuser au partenaire
      </Button>
      {createPortal(
        <broadcastModal.Component title="Rediffuser au partenaire">
          <Select
            options={options}
            label="À quel partenaire redifuser ?"
            disabled={options.length === 1}
            nativeSelectProps={{
              ...(options.length === 1 ? { value: options[0].value } : {}),
            }}
          />
          <Button
            onClick={() => {
              console.log("TODO trigger broadcast again");
              broadcastModal.close();
            }}
          >
            Rediffuser
          </Button>
        </broadcastModal.Component>,
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
