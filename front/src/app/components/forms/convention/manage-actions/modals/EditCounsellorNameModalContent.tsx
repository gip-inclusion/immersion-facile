import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionId,
  type EditConventionCounsellorNameRequestDto,
  type WithOptionalFirstnameAndLastname,
  domElementIds,
  withOptionalFirstnameAndLastnameSchema,
} from "shared";

export const EditCounsellorNameModalContent = ({
  onSubmit,
  closeModal,
  conventionId,
}: {
  onSubmit: (params: EditConventionCounsellorNameRequestDto) => void;
  closeModal: () => void;
  conventionId: ConventionId;
}) => {
  const { register, handleSubmit } = useForm<WithOptionalFirstnameAndLastname>({
    resolver: zodResolver(withOptionalFirstnameAndLastnameSchema),
    mode: "onTouched",
  });
  const onFormSubmit: SubmitHandler<WithOptionalFirstnameAndLastname> = ({
    firstname,
    lastname,
  }) => {
    onSubmit({ conventionId, firstname, lastname });
    closeModal();
  };
  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Input
          label={"Nom"}
          nativeInputProps={{
            ...register("lastname"),
            required: true,
            id: domElementIds.manageConvention
              .editCounsellorNameModalLastNameInput,
          }}
        />
        <Input
          label={"Prénom"}
          nativeInputProps={{
            ...register("firstname"),
            required: true,
            id: domElementIds.manageConvention
              .editCounsellorNameModalFirstNameInput,
          }}
        />
        <ButtonsGroup
          alignment="center"
          inlineLayoutWhen="always"
          buttons={[
            {
              type: "button",
              priority: "secondary",
              onClick: () => {
                closeModal();
              },
              nativeButtonProps: {
                id: domElementIds.manageConvention
                  .editCounsellorNameModalCancelButton,
              },
              children: "Annuler",
            },
            {
              type: "submit",
              nativeButtonProps: {
                id: domElementIds.manageConvention
                  .editCounsellorNameModalSubmitButton,
              },
              children: "Enregistrer",
            },
          ]}
        />
      </form>
    </>
  );
};
