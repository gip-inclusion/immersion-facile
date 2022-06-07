import React from "react";

export type ImageProps = {
  url: string;
  alt: string;
  height: string;
};

export const Image = ({ url, alt, height }: ImageProps) => (
  <img src={url} alt={alt} height={height} />
);
