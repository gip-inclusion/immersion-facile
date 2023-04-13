import { useDispatch } from "react-redux";

import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";

export const useSendModifyEstablishmentLink = () => {
  const dispatch = useDispatch();
  return {
    sendModifyEstablishmentLink: (siret: string) => {
      dispatch(establishmentSlice.actions.sendModificationLinkRequested(siret));
    },
  };
};
