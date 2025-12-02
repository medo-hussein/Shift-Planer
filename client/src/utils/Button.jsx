import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const variantClasses = {
    primary: "bg-sky-700 text-white hover:bg-sky-800 active:scale-95 shadow-md",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-md",
    outline:
      "border border-sky-700 text-sky-700 bg-white hover:bg-sky-50 active:scale-95",
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-xl font-medium transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
