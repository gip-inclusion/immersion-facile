import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type SignAssessmentRequestDto,
  signAssessmentRequestDtoSchema,
} from "shared";
import { useFormModal } from "src/app/utils/createFormModal";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";

type AgreementKind = "agree-no-comment" | "agree-with-comment" | "disagree";

type SignAssessmentModalContentProps = {
  conventionId: string;
  jwt: string;
  onCloseModal: () => void;
};

export const AssessmentSignModalContent = ({
  conventionId,
  jwt,
  onCloseModal,
}: SignAssessmentModalContentProps) => {
  const dispatch = useDispatch();
  const { formId } = useFormModal();
  const [agreementKind, setAgreementKind] =
    useState<AgreementKind>("agree-with-comment");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignAssessmentRequestDto>({
    resolver: zodResolver(signAssessmentRequestDtoSchema),
    defaultValues: {
      conventionId,
      beneficiaryAgreement: true,
      beneficiaryFeedback: "",
    },
  });

  const onAgreementChange = (kind: AgreementKind) => {
    setAgreementKind(kind);
    setValue("beneficiaryAgreement", kind !== "disagree");
    if (kind === "agree-no-comment") setValue("beneficiaryFeedback", null);
  };

  const needsComment = agreementKind !== "agree-no-comment";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) => {
        dispatch(
          assessmentSlice.actions.signAssessmentRequested({
            params: values,
            jwt,
            feedbackTopic: "sign-assessment",
          }),
        );
        onCloseModal();
      })}
    >
      <p>
        Assurez-vous d'avoir bien pris connaissance de l'ensemble du document
        avant de le signer.
      </p>
      <RadioButtons
        options={[
          {
            label: "J'ai bien lu, je suis d'accord, rien à ajouter",
            nativeInputProps: {
              value: "agree-no-comment",
              checked: agreementKind === "agree-no-comment",
              onChange: () => onAgreementChange("agree-no-comment"),
            },
          },
          {
            label: "J'ai bien lu, je suis d'accord, je veux commenter",
            nativeInputProps: {
              value: "agree-with-comment",
              checked: agreementKind === "agree-with-comment",
              onChange: () => onAgreementChange("agree-with-comment"),
            },
          },
          {
            label: "J'ai bien lu, je ne suis pas d'accord, je veux commenter",
            nativeInputProps: {
              value: "disagree",
              checked: agreementKind === "disagree",
              onChange: () => onAgreementChange("disagree"),
            },
          },
        ]}
      />

      <Input
        label="Commentaire"
        hintText="Votre commentaire apparaîtra sur la version finale du bilan."
        textArea
        nativeTextAreaProps={{
          ...register("beneficiaryFeedback"),
        }}
        state={errors.beneficiaryFeedback ? "error" : "default"}
        stateRelatedMessage={errors.beneficiaryFeedback?.message}
        className={fr.cx("fr-mt-2w")}
        disabled={!needsComment}
      />
    </form>
  );
};
