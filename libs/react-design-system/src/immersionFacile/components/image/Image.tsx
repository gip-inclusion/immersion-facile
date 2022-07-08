import React from "react";

export type ImageProps = {
  url: string;
  alt: string;
  height?: string;
  width?: string;
  style?: React.CSSProperties;
};

export const Image = ({ url, alt, width, height, style }: ImageProps) => (
  <img src={url} alt={alt} width={width} height={height} style={style} />
);
