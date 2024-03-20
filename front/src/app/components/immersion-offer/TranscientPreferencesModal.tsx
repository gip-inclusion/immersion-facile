import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect } from "react";
import { keys } from "shared";
import { inputsLabelsByKey } from "src/app/components/immersion-offer/ContactByEmail";
import {
  TranscientData,
  useTranscientDataFromStorage,
} from "src/app/components/immersion-offer/useTranscientDataFromStorage";

export const transcientPreferencesModal = createModal({
  id: "transcient-preferences-modal",
  isOpenedByDefault: true,
});

export const TranscientPreferencesModal = ({
  scope,
  onPreferencesChange,
}: {
  scope: keyof TranscientData;
  onPreferencesChange: (accept: boolean) => void;
}) => {
  const {
    getTranscientDataForScope,
    setPreferUseTranscientDataForScope,
    setTranscientDataForScope,
  } = useTranscientDataFromStorage(scope);
  const transcientDataForScope = getTranscientDataForScope();
  const savePreferences = (accept: boolean) => {
    setPreferUseTranscientDataForScope(accept);
    setTranscientDataForScope({
      ...transcientDataForScope?.value,
    });
    onPreferencesChange(accept);
    transcientPreferencesModal.close();
  };
  const shouldOpenModal = transcientDataForScope !== null;
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (shouldOpenModal) {
        transcientPreferencesModal.open();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [shouldOpenModal]);
  return (
    <transcientPreferencesModal.Component title="Préremplir le formulaire">
      <p>
        Nous avons trouvé des données précédemment saisies pour vous aider à
        remplir ce formulaire :
      </p>
      <ul>
        {keys(transcientDataForScope?.value ?? {}).map((key) => (
          <li key={key}>
            {inputsLabelsByKey[key]}:{" "}
            <strong>{transcientDataForScope?.value?.[key]}</strong>
          </li>
        ))}
      </ul>
      <p>Voulez-vous utiliser ces données ?</p>
      <ButtonsGroup
        buttons={[
          {
            type: "button",
            children: "Oui",
            id: "transcient-preferences-modal-yes",
            onClick: () => {
              savePreferences(true);
            },
          },
          {
            type: "button",
            priority: "secondary",
            children: "Non",
            id: "transcient-preferences-modal-no",
            onClick: () => {
              savePreferences(false);
            },
          },
        ]}
      />
    </transcientPreferencesModal.Component>
  );
};
