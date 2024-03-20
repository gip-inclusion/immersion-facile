import { useState } from "react";
import { keys } from "shared";
import { ContactEstablishmentByMailDto, OmitFromExistingKeys } from "shared";

const transcientDataStorageKey = "IfTranscientData";
const preferUseTranscientDataStorageKey = "IfPreferUseTranscientData";

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

export const transcientExpirationTimeInMinutes = 10;

export type TranscientData = {
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

export const useTranscientDataFromStorage = (
  scope: keyof TranscientData,
  keepPreferencesInStorage = true,
) => {
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
      keepPreferencesInStorage && preferUseTranscientDataInStorage
        ? JSON.parse(preferUseTranscientDataInStorage)
        : null,
    );

  const setPreferUseTranscientDataForScope = (preferUse: boolean) => {
    const updatedData = {
      ...preferUseTranscientData,
      [scope]: preferUse,
    };
    setPreferUseTranscientData(updatedData);
    if (keepPreferencesInStorage) {
      localStorage.setItem(
        preferUseTranscientDataStorageKey,
        JSON.stringify(updatedData),
      );
    }
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
        if (keepPreferencesInStorage) {
          localStorage.removeItem(preferUseTranscientDataStorageKey);
        }
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
  };
};
