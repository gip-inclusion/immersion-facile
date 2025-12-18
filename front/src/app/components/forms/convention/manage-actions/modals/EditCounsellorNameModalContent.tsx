import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  type ConventionId,
  domElementIds,
  type EditConventionCounsellorNameRequestDto,
  type WithOptionalFirstnameAndLastname,
  withOptionalFirstnameAndLastnameSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";

export const EditCounsellorNameModalContent = ({
  onSubmit,
  closeModal,
  conventionId,
}: {
  onSubmit: (params: EditConventionCounsellorNameRequestDto) => void;
  closeModal: () => void;
  conventionId: ConventionId;
}) => {
  const { register, handleSubmit, formState } =
    useForm<WithOptionalFirstnameAndLastname>({
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
  const getFieldError = makeFieldError(formState);
  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      id={domElementIds.manageConvention.editCounsellorNameModalForm}
    >
      <p>
        Le nom du conseiller est fourni à titre informatif. Toute réaffectation
        de la convention ne peut être effectuée que par (ou via) l'agence.
      </p>

      <Input
        label={"Prénom"}
        nativeInputProps={{
          ...register("firstname"),
          required: true,
          id: domElementIds.manageConvention
            .editCounsellorNameModalFirstNameInput,
        }}
        {...getFieldError("firstname")}
      />
      <Input
        label={"Nom"}
        nativeInputProps={{
          ...register("lastname"),
          required: true,
          id: domElementIds.manageConvention
            .editCounsellorNameModalLastNameInput,
        }}
        {...getFieldError("lastname")}
      />
    </form>
  );
};
