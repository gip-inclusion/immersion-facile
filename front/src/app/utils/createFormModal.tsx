import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { createModal, type ModalProps } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import {
  type Context,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";

export type FormModalButtonConfig = ButtonProps & {
  type?: "button" | "submit";
};

type FormModalContextValue = {
  formId: string;
  modalOnCancelCallback: (callback: () => void) => () => void;
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

type FormModalProps = Omit<ModalProps, "buttons" | "children"> & {
  formId: string;
  children: ReactNode;
  buttons?: FormModalButtonConfig[];
  title: string;
  doSubmitClosesModal: boolean;
};

type FormModalComponent = {
  Component: (props: FormModalProps) => JSX.Element;
  open: () => void;
  close: () => void;
};

export const createFormModal = (
  params: Parameters<typeof createModal>[0],
): FormModalComponent => {
  const modal = createModal(params);

  const FormModalComponent = ({
    formId,
    children,
    buttons,
    title,
    doSubmitClosesModal,
    ...modalProps
  }: FormModalProps) => {
    const onCancelCallbacksRef = useRef<Set<() => void>>(new Set());
    const isCancellingRef = useRef(false);

    const onCancelCallback = useCallback((callback: () => void) => {
      onCancelCallbacksRef.current.add(callback);
      return () => {
        onCancelCallbacksRef.current.delete(callback);
      };
    }, []);

    const handleCancel = useCallback(() => {
      isCancellingRef.current = true;
      if (isCancellingRef.current) {
        onCancelCallbacksRef.current.forEach((callback) => {
          callback();
        });
      }
      queueMicrotask(() => {
        isCancellingRef.current = false;
      });
    }, []);

    useIsModalOpen(
      {
        id: modal.id,
        isOpenedByDefault: false,
      },
      {
        onConceal: handleCancel,
      },
    );

    const defaultButtons: FormModalButtonConfig[] = [
      {
        children: "Annuler",
        type: "button" as const,
        priority: "secondary" as const,
        onClick: handleCancel,
      },
      {
        children: "Valider",
        type: "submit" as const,
        priority: "primary" as const,
      },
    ];
    const buttonsToUse = buttons ?? defaultButtons;

    const transformedButtons = buttonsToUse.map((button) => {
      if (button.type === "submit") {
        return {
          ...button,
          doClosesModal: doSubmitClosesModal,
          nativeButtonProps: {
            ...button.nativeButtonProps,
            form: formId,
            type: "submit" as const,
          },
        };
      }
      return button;
    });

    const modalButtons: ModalProps["buttons"] =
      transformedButtons.length === 0
        ? undefined
        : transformedButtons.length === 1
          ? transformedButtons[0]
          : [transformedButtons[0], ...transformedButtons.slice(1)];

    return (
      <FormModalContext.Provider
        value={{
          formId,
          modalOnCancelCallback: onCancelCallback,
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
