import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { ConventionReadDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

const broadcastAgainModal = createModal({
  isOpenedByDefault: false,
  id: "im-broadcast-modal",
});

export const BroadcastAgainButton = ({
  convention,
}: {
  convention: ConventionReadDto;
}) => {
  const dispatch = useDispatch();

  const consumerNames = useAppSelector(conventionSelectors.apiConsumerNames);

  if (consumerNames.length === 0) return null;

  return (
    <>
      <Button
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          broadcastAgainModal.open();
        }}
      >
        Rediffuser au partenaire
      </Button>
      {createPortal(
        <broadcastAgainModal.Component title="Rediffuser au partenaire">
          Vous allez rediffuser aux partenaires suivant :
          <ul>
            {consumerNames.map((consumerName) => (
              <li key={consumerName}>{consumerName}</li>
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
            }}
          >
            Rediffuser
          </Button>
        </broadcastAgainModal.Component>,
        document.body,
      )}
    </>
  );
};

export const shouldShowBroadcast = ({
  convention,
}: { convention: ConventionReadDto }) => {
  return (
    convention.agencyKind === "pole-emploi" ||
    convention.agencyKind === "mission-locale"
  );
};
