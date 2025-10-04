import React from 'react';

const Button = ({ 
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  const getVariantClasses = (variant) => {
    const variants = {
      primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
      success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white focus:ring-blue-500",
      ghost: "text-blue-500 hover:bg-blue-50 focus:ring-blue-500"
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = (size) => {
    const sizes = {
      small: "px-3 py-1.5 text-sm",
      medium: "px-4 py-2 text-base",
      large: "px-6 py-3 text-lg"
    };
    return sizes[size] || sizes.medium;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses(variant)}
        ${getSizeClasses(size)}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;