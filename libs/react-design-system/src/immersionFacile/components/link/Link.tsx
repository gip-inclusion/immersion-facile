import React from "react";
import { Link as LinkRoute } from "type-route";
export interface LinkContract {
  text: string;
  url: LinkRoute;
}
export const Link = ({ text, url }: LinkContract) => (
  <div
    className="text-immersionBlue-dark font-sans text-center"
    style={{ maxWidth: "16rem" }}
  >
    <a {...url}>{text}</a>
  </div>
);
