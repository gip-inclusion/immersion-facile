import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect, useState } from "react";
import { keys } from "shared";
import { ContactEstablishmentByMailDto, OmitFromExistingKeys } from "shared";
import { inputsLabelsByKey } from "src/app/components/immersion-offer/ContactByEmail";

const transcientDataStorageKey = "IfTranscientData";
const preferUseTranscientDataStorageKey = "IfPreferUseTranscientData";

const transcientPreferencesModal = createModal({
  id: "transcient-preferences-modal",
  isOpenedByDefault: true,
});

const unrelevantDataKeysForContactScope: (keyof ContactEstablishmentByMailDto)[] =
  ["locationId", "message", "appellationCode", "contactMode", "siret"] as const;

type ContactTranscientData = OmitFromExistingKeys<
  ContactEstablishmentByMailDto,
  (typeof unrelevantDataKeysForContactScope)[number]
>;

type TranscientDataItem<T> = {
  value: T | null;
  expireAt: number;
};

type TranscientData = {
  "contact-establishment": TranscientDataItem<ContactTranscientData>;
};

type PreferTranscientData = Record<keyof TranscientData, boolean>;

const filterDataInScope = <T extends ContactTranscientData>(data: T) =>
  keys(data).reduce((acc, key) => {
    if (!unrelevantDataKeysForContactScope.includes(key)) {
      acc[key] = data[key];
    }
    return acc;
  }, {} as T);

const isStringTranscientData = (data: object): data is TranscientData => {
  return data && typeof data === "object" && "contact-establishment" in data;
};

export const useTranscientDataFromStorage = (scope: keyof TranscientData) => {
  const dataInStorage = localStorage.getItem(transcientDataStorageKey);
  const preferUseTranscientDataInStorage = localStorage.getItem(
    preferUseTranscientDataStorageKey,
  );
  const parsedData = dataInStorage ? JSON.parse(dataInStorage) : null;
  const [transcientData, setTranscientData] = useState<TranscientData | null>(
    isStringTranscientData(parsedData) ? parsedData : null,
  );
  const [preferUseTranscientData, setPreferUseTranscientData] =
    useState<PreferTranscientData>(
      preferUseTranscientDataInStorage
        ? JSON.parse(preferUseTranscientDataInStorage)
        : null,
    );

  const setPreferUseTranscientDataForScope = (preferUse: boolean) => {
    const updatedData = {
      ...preferUseTranscientData,
      [scope]: preferUse,
    };
    setPreferUseTranscientData(updatedData);
    localStorage.setItem(
      preferUseTranscientDataStorageKey,
      JSON.stringify(updatedData),
    );
  };

  const getExpireAt = (expireInMinutes: number) => {
    if (expireInMinutes) {
      return Date.now() + expireInMinutes * 60 * 1000;
    }
    if (transcientData?.["contact-establishment"]) {
      return transcientData["contact-establishment"].expireAt;
    }
    return 0;
  };

  const setTranscientDataForScope = (
    data: TranscientDataItem<ContactTranscientData>["value"],
    expireInMinutes = 0,
  ) => {
    const updatedDataItem = data
      ? {
          expireAt: getExpireAt(expireInMinutes),
          value: filterDataInScope(data),
        }
      : {
          expireAt: 0,
          value: null,
        };
    const updatedData = {
      ...transcientData,
      [scope]: updatedDataItem,
    };
    setTranscientData(updatedData);
    localStorage.setItem(transcientDataStorageKey, JSON.stringify(updatedData));
  };
  const getTranscientDataForScope =
    (): TranscientDataItem<ContactTranscientData> | null => {
      const data = transcientData?.[scope] ?? null;
      const shouldDataExpire = data?.expireAt && data.expireAt < Date.now();
      if (shouldDataExpire) {
        localStorage.removeItem(transcientDataStorageKey);
        localStorage.removeItem(preferUseTranscientDataStorageKey);
        return {
          expireAt: 0,
          value: null,
        };
      }
      return data;
    };
  const getPreferUseTranscientDataForScope = (): boolean | null => {
    return preferUseTranscientData?.[scope] ?? null;
  };
  return {
    getPreferUseTranscientDataForScope,
    setPreferUseTranscientDataForScope,
    transcientData,
    setTranscientData,
    getTranscientDataForScope,
    setTranscientDataForScope,
    transcientModalPreferences: {
      ...transcientPreferencesModal,
      Component: TranscientPreferencesModal,
    },
  };
};

const TranscientPreferencesModal = ({
  scope,
  onPreferencesChange,
}: {
  scope: keyof TranscientData;
  onPreferencesChange: (accept: boolean) => void;
}) => {
  const {
    getTranscientDataForScope,
    getPreferUseTranscientDataForScope,
    setPreferUseTranscientDataForScope,
    setTranscientDataForScope,
  } = useTranscientDataFromStorage(scope);
  const transcientDataForScope = getTranscientDataForScope();
  const preferUseTranscientData = getPreferUseTranscientDataForScope();
  const savePreferences = (accept: boolean) => {
    setPreferUseTranscientDataForScope(accept);
    setTranscientDataForScope({
      ...transcientDataForScope?.value,
    });
    onPreferencesChange(accept);
    transcientPreferencesModal.close();
  };
  const shouldOpenModal =
    preferUseTranscientData === null && transcientDataForScope !== null;
  useEffect(() => {
    if (shouldOpenModal) {
      transcientPreferencesModal.open();
    }
  }, [shouldOpenModal]);

  if (preferUseTranscientData !== null) {
    return null;
  }
  return (
    <transcientPreferencesModal.Component title="Préremplir le formulaire">
      <p>
        Nous avons trouvé de la données précédemment saisie pour ce formulaire :
      </p>
      <ul>
        {keys(transcientDataForScope?.value ?? {}).map((key) => (
          <li key={key}>
            {inputsLabelsByKey[key]}: {transcientDataForScope?.value?.[key]}
          </li>
        ))}
      </ul>
      <p>Voulez-vous utiliser ces données ?</p>
      <ButtonsGroup
        buttons={[
          {
            type: "button",
            children: "Oui",
            onClick: () => {
              savePreferences(true);
            },
          },
          {
            type: "button",
            priority: "secondary",
            children: "Non",
            onClick: () => {
              savePreferences(false);
            },
          },
        ]}
      />
    </transcientPreferencesModal.Component>
  );
};
