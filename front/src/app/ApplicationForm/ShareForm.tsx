import React, { useState } from "react";
import { Form, Formik } from "formik";
import {Button, IconButton, Tooltip} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import {TextInput} from "../../components/form/TextInput";

type ShareFormProps = {
  onSuccess: () => void;
};

export const ShareForm = ({
  onSuccess,
}: ShareFormProps) => {
  const [tooltipText, setTooltipText] = useState<string>(
    "Copier le lien pour partager le formulaire",
  );

  const submit = () => {
    console.log("ShareForm submit");
    // create adapter in core-logic
    //  //await immersionSearchGateway.contactEstablishment(values);
    // setIsSubmitting(false);
    onSuccess();

    // todo gérer le on failure aussi
  };

  return (
    <Formik
      initialValues={{}}
      onSubmit={submit}
    >
      {({ errors, submitCount }) => (
        <Form>
          <Tooltip title={tooltipText}>
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setTooltipText("Lien copié !");
              }}
            >Partager par lien<ShareIcon sx={{ color: "#3458a2" }} />
            </IconButton>
          </Tooltip>
          <TextInput
            label="A quel email voulez-vous partager ?"
            name="email"
            type="email"
            placeholder="nom@exemple.com"
            description="A quel email voulez-vous partager ?"
          />
          <TextInput
            label="Informations complémentaires"
            name="details"
            multiline={true}
          />
        </Form>
      )}
    </Formik>
  );
};
