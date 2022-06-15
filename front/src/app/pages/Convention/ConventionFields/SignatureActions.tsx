import React from "react";
import {
  RequestModificationButton,
  SignButton,
} from "src/app/pages/Convention/ConventionFields/SubmitButtons";
import { BoolCheckboxGroup } from "src/uiComponents/form/CheckboxGroup";

export const SignatureActions = (props: {
  isSignatureEnterprise?: boolean;
  signeeName?: string;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  onRejectForm: () => Promise<void>;
}) => (
  <>
    <BoolCheckboxGroup
      name={
        props.isSignatureEnterprise
          ? "enterpriseAccepted"
          : "beneficiaryAccepted"
      }
      label={`Je, soussigné ${props.signeeName} (${
        props.isSignatureEnterprise
          ? "représentant de la structure d'accueil"
          : "bénéficiaire de l'immersion"
      }) m'engage à avoir pris connaissance des dispositions réglementaires de la PMSMP et à les respecter *`}
      description="Avant de répondre, consultez ces dispositions ici"
      descriptionLink="https://docs.google.com/document/d/1siwGSE4fQB5hGWoppXLMoUYX42r9N-mGZbM_Gz_iS7c/edit?usp=sharing"
      disabled={false}
    />
    <p style={{ display: "flex", gap: "50px" }}>
      <SignButton isSubmitting={props.isSubmitting} onSubmit={props.onSubmit} />

      <RequestModificationButton
        onSubmit={props.onRejectForm}
        isSubmitting={props.isSubmitting}
      />
    </p>
  </>
);
