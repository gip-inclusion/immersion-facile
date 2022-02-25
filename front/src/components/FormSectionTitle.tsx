import React from "react";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import {
  ElementModalContainer,
  useElementContainerModal,
} from "./FormModal/ElementModalContainer";
import {ShareForm} from "../app/ApplicationForm/ShareForm";

type FormSectionTitleProps = { children: string };

export const FormSectionTitle = ({ children }: FormSectionTitleProps) => {
  const { modalState, dispatch } = useElementContainerModal();
  return (
    <>
      <div className="h-6" />
      <div
        className={
          "sticky top-0 text-immersionBlue-dark font-semibold p-2 mb-1 bg-white border-b text-lg z-10 flex justify-between"
        }
      >
        <div>{children}</div>
        <Tooltip title={"Partager le formulaire"}>
          <IconButton onClick={() => dispatch({ type: "CLICKED_OPEN" })}>
            <ShareIcon sx={{ color: "#3458a2" }} />
          </IconButton>
        </Tooltip>

        <ElementModalContainer
          modalState={modalState}
          dispatch={dispatch}
        >
          <ShareForm
            onSuccess={() => {
              dispatch({ type: "CLICKED_CLOSE" });
              console.log("ShareForm success");
            }}
          />
        </ElementModalContainer>
      </div>
    </>
  );
};
