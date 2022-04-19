import React, { ReactNode } from "react";
import { Link } from "type-route";

type SubmitButtonProps = {
  disable?: boolean;
  onSubmit?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  type?: "submit" | "button" | "reset";
  level?: "primary" | "secondary";
};

export const Button = ({
  onSubmit,
  disable,
  children,
  className,
  type = "button",
  level = "primary",
}: SubmitButtonProps) => {
  const isSecondary = level === "secondary" ? "fr-btn--secondary" : "";

  return (
    <button
      className={`fr-btn ${isSecondary} ${className}`}
      style={{ margin: "5px" }}
      type={type}
      onClick={onSubmit}
      disabled={disable}
    >
      {children}
    </button>
  );
};

type HomeButtonProps = {
  disable?: boolean;
  onClick?: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  type?:"primary"|"secondary"
};
export const HomeButton = ({
  onClick,
  disable,
  children,
  className,
  type = "primary"
}: HomeButtonProps) => {
  return (
    <button
      className={className ? className : `rounded-md w-full h-15 py-3 px-2 no-underline ${type === "primary"?"bg-immersionBlue text-white shadow-none":"bg-white text-immersionBlue border-2 border-blue-200"} font-semibold text-center text-sm`} 
      style={type === "secondary"? {border: '2px solid'} :{} }
      onClick={onClick}
      disabled={disable}
    >
      {children}
    </button>
  );
};


interface ButtonLinkContract {
  text:string
  url:Link
}
export const ButtonLink = (
  { text,url }:ButtonLinkContract
) =>{
  return (
    <a
      {...url}
      className="no-underline shadow-none bg-immersionBlue py-3 px-2 rounded-md text-white font-semibold w-full text-center  h-15 text-sm "
    >
      {text}
    </a>
  );
}