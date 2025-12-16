import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { createModal, type ModalProps } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import {
  type Context,
  createContext,
  type ReactElement,
  useCallback,
  useContext,
  useRef,
} from "react";

type FormModalContextValue = {
  formId: string;
  modalOnCancelCallback: (callback: () => void) => () => void;
  buttons: ButtonProps[];
};

export const defaultCancelButton: ButtonProps = {
  children: "Annuler",
  type: "button" as const,
  priority: "secondary" as const,
};

export const defaultSubmitButton: ButtonProps = {
  children: "Valider",
  type: "submit" as const,
  priority: "primary" as const,
};

const FormModalContext: Context<FormModalContextValue | null> =
  createContext<FormModalContextValue | null>(null);

export const useFormModal = (): FormModalContextValue => {
  const context = useContext(FormModalContext);
  if (!context) {
    throw new Error(
      "useFormModalOnCancel() doit être utilisé à l'intérieur d'un FormModalComponent",
    );
  }
  return context;
};

export type FormModalProps = ModalProps & {
  doSubmitClosesModal?: boolean;
};

type FormModal = {
  Component: (props: FormModalProps) => ReactElement<FormModalProps>;
  open: () => void;
  close: () => void;
};

type CreateFormModalParams = Parameters<typeof createModal>[0] & {
  formId: string;
  submitButton?: Pick<ButtonProps, "id" | "children">;
  cancelButton?: Pick<ButtonProps, "id" | "children">;
};

export const createFormModal = (params: CreateFormModalParams): FormModal => {
  const modal = createModal(params);

  const FormModalComponent = ({
    children,
    buttons,
    title,
    doSubmitClosesModal,
    ...modalProps
  }: FormModalProps) => {
    const onCancelCallbacksRef = useRef<Set<() => void>>(new Set());
    const isSubmittingRef = useRef(false);

    const onCancelCallback = useCallback((callback: () => void) => {
      onCancelCallbacksRef.current.add(callback);
      return () => {
        onCancelCallbacksRef.current.delete(callback);
      };
    }, []);

    const handleConceal = useCallback(() => {
      if (!isSubmittingRef.current) {
        onCancelCallbacksRef.current.forEach((callback) => {
          callback();
        });
      }
      queueMicrotask(() => {
        isSubmittingRef.current = false;
      });
    }, []);

    useIsModalOpen(
      {
        id: modal.id,
        isOpenedByDefault: false,
      },
      {
        onConceal: handleConceal,
      },
    );

    const defaultButtons: ButtonProps[] = [
      {
        ...defaultCancelButton,
        onClick: handleConceal,
        id: params.cancelButton?.id,
      },
      {
        ...defaultSubmitButton,
        id: params.submitButton?.id,
        onClick: () => {
          isSubmittingRef.current = true;
        },
      },
    ];
    const buttonsToUse = buttons ?? defaultButtons;
    const buttonsArray = Array.isArray(buttonsToUse)
      ? buttonsToUse
      : [buttonsToUse];
    const buttonsFiltered = (buttonsArray ?? defaultButtons).filter(
      (button) => button !== undefined,
    );

    const transformedButtons = buttonsFiltered.map((button) => {
      if (button.type === "submit") {
        return {
          ...button,
          doClosesModal: doSubmitClosesModal,
          nativeButtonProps: {
            ...button.nativeButtonProps,
            onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
              isSubmittingRef.current = true;
              button.nativeButtonProps?.onClick?.(event);
            },
            form: params.formId,
            type: "submit" as const,
          },
        };
      }
      return button;
    });

    const modalButtons: ModalProps["buttons"] =
      buttonsToModalButtons(transformedButtons);

    return (
      <FormModalContext.Provider
        value={{
          formId: params.formId,
          modalOnCancelCallback: onCancelCallback,
          buttons: transformedButtons,
        }}
      >
        <modal.Component title={title} buttons={modalButtons} {...modalProps}>
          {children}
        </modal.Component>
      </FormModalContext.Provider>
    );
  };

  return {
    Component: FormModalComponent,
    open: modal.open,
    close: modal.close,
  };
};

export const buttonsToModalButtons = (
  buttons: ButtonProps[],
): ModalProps["buttons"] =>
  buttons.length === 0
    ? undefined
    : buttons.length === 1
      ? buttons[0]
      : [buttons[0], ...buttons.slice(1)];
