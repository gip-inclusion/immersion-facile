import {
  FeatureFlagTextImageAndRedirect,
  FeatureFlagTextWithSeverity,
} from "shared";
import { FormFieldAttributesForContent } from "src/app/contents/forms/types";
import { FormFieldsObjectForContent } from "src/app/hooks/formContents.hooks";

export type FormTextImageAndRedirectFieldsLabels = FormFieldsObjectForContent<
  Record<
    Partial<keyof FeatureFlagTextImageAndRedirect["value"]>,
    FormFieldAttributesForContent
  >
>;

export const formTextImageAndRedirectFieldsLabels: FormTextImageAndRedirectFieldsLabels =
  {
    message: {
      label: "Message (optionnel)",
      id: "message",
      placeholder:
        "Pour la journée du numérique, tentez l'immersion en entreprise !",
    },
    imageUrl: {
      label: "Url de l'image",
      id: "imageUrl",
      placeholder: "https://www.example.com/image.png",
    },
    imageAlt: {
      label: "Texte alternatif de l'image",
      id: "imageAlt",
      placeholder: "Image de la journée du numérique",
    },
    redirectUrl: {
      label: "Url de redirection",
      id: "redirectUrl",
      placeholder: "https://www.example.com",
    },
    title: {
      label: "Titre (optionnel)",
      placeholder: "Journée du numérique",
      id: "title",
    },
    overtitle: {
      label: "Sur-titre (optionnel)",
      placeholder: "À la Une",
      id: "overtitle",
    },
  };

export type FeatureFlagTextWithOptionsFieldsLabels = FormFieldsObjectForContent<
  Record<
    Partial<keyof FeatureFlagTextWithSeverity["value"]>,
    FormFieldAttributesForContent
  >
>;

export const formTextWithOptionsFieldsLabels: FeatureFlagTextWithOptionsFieldsLabels =
  {
    message: {
      label: "Message (optionnel)",
      id: "message",
      hintText: "Si le message est vide, un message par défaut s'affichera",
      placeholder:
        "Désolé, nous rencontrons actuellement des difficultés techniques. Merci de réessayer plus tard.",
    },
    severity: {
      label: "Niveau d'alerte",
      id: "maintenance-level",
      options: [
        {
          label: "Attention",
          value: "warning",
        },
        {
          label: "Erreur",
          value: "error",
        },
        {
          label: "Succes",
          value: "success",
        },
        {
          label: "Info",
          value: "info",
        },
      ],
    },
  };
