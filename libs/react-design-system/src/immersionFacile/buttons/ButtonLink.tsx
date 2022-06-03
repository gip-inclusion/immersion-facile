import React from "react";
import { Link } from "type-route";

export interface ButtonLinkContract {
  text: string;
  url: Link;
}

export const ButtonLink = ({ text, url }: ButtonLinkContract) => (
  <a
    {...url}
    className="no-underline shadow-none bg-immersionBlue py-3 px-2 rounded-md text-white font-semibold w-full text-center  h-15 text-sm "
  >
    {text}
  </a>
);
