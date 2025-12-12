import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { createPortal } from "react-dom";
import type { InternshipKind, Signatory } from "shared";
import { SignConventionModalContent } from "src/app/components/forms/convention/manage-actions/modals/SignConventionModalContent";

export const createSignModalParams = {
  isOpenedByDefault: false,
  id: "sign",
};

const { Component: SignModal, open: openSignModal } = createModal(
  createSignModalParams,
);

type SignButtonProps = {
  disabled: boolean;
  id: string;
  onCloseSignModalWithoutSignature?: (value: boolean) => void;
  signatory: Signatory;
  internshipKind: InternshipKind;
  className?: string;
  onOpenSignModal?: () => Promise<boolean>;
};

export const SignButton = ({
  disabled,
  id,
  onCloseSignModalWithoutSignature,
  signatory,
  internshipKind,
  className,
  onOpenSignModal,
}: SignButtonProps) => {
  return (
    <>
      <Button
        priority="primary"
        type="button"
        iconId="fr-icon-checkbox-circle-line"
        iconPosition="left"
        className={className}
        nativeButtonProps={{
          id,
        }}
        disabled={disabled}
        onClick={async () => {
          if (onCloseSignModalWithoutSignature) {
            onCloseSignModalWithoutSignature(false);
          }
          if (onOpenSignModal) {
            const shouldOpen = await onOpenSignModal();
            if (!shouldOpen) {
              return;
            }
          }
          openSignModal();
        }}
      >
        Signer la convention
      </Button>
      {createPortal(
        <SignModal
          title="Accepter les dispositions réglementaires et terminer la signature"
          size="large"
          concealingBackdrop={false}
        >
          <SignConventionModalContent
            signatory={signatory}
            internshipKind={internshipKind}
            onCancel={() => {
              if (onCloseSignModalWithoutSignature) {
                onCloseSignModalWithoutSignature(true);
              }
            }}
          />
        </SignModal>,
        document.body,
      )}
    </>
  );
};
