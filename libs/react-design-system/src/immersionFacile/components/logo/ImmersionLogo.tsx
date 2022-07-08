import React from "react";
import { Image } from "../image";

export type ImmersionLogoProps = {
  url: string;
};

export const ImmersionLogo = (props: ImmersionLogoProps): JSX.Element => (
  <Image alt="Immersion Facilitée" width={"95px"} {...props} />
);
