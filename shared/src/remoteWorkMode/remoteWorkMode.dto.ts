export const physicalWorkModes = ["HYBRID", "ON_SITE"] as const;

export type PhysicalWorkMode = (typeof physicalWorkModes)[number];

export const remoteWorkModes = ["FULL_REMOTE", ...physicalWorkModes] as const;

export type RemoteWorkMode = (typeof remoteWorkModes)[number];

export type WithRemoteWorkMode = {
  remoteWorkMode: RemoteWorkMode;
};
export type WithOptionnalRemoteWorkModes = {
  remoteWorkModes?: RemoteWorkMode[];
};

export const remoteWorkModeLabels: Record<
  RemoteWorkMode,
  { label: string; answerLabel: string; description: string }
> = {
  HYBRID: {
    label: "Télétravail hybride",
    answerLabel: "Oui, télétravail hybride",
    description:
      "Apparaîtra dans les recherches pour tous vos lieux d’immersion",
  },
  FULL_REMOTE: {
    label: "100% télétravail",
    answerLabel: "Oui, 100% télétravail",
    description:
      "Apparaîtra pour la France entière, quelle que soit la localisation du candidat",
  },
  ON_SITE: {
    label: "100% présentiel",
    answerLabel: "Non, 100% en présentiel",
    description:
      "Apparaîtra dans les recherches pour tous vos lieux d’immersion",
  },
};

export const isPhysicalWorkMode = (workMode: RemoteWorkMode) => {
  return physicalWorkModes.includes(workMode as PhysicalWorkMode);
};
