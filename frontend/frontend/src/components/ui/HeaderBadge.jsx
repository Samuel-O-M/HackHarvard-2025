import React from 'react';

const HeaderBadge = ({ 
  text = "Badge", 
  variant = "primary",
  size = "medium" 
}) => {
  const getVariantClasses = (variant) => {
    const variants = {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      secondary: "bg-gray-500 text-white hover:bg-gray-600",
      success: "bg-green-500 text-white hover:bg-green-600",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      danger: "bg-red-500 text-white hover:bg-red-600",
      info: "bg-cyan-500 text-white hover:bg-cyan-600",
      light: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      dark: "bg-gray-800 text-white hover:bg-gray-900"
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = (size) => {
    const sizes = {
      small: "px-2 py-1 text-xs",
      medium: "px-3 py-1.5 text-sm",
      large: "px-4 py-2 text-base"
    };
    return sizes[size] || sizes.medium;
  };

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        transition-colors duration-200 cursor-pointer
        ${getVariantClasses(variant)}
        ${getSizeClasses(size)}
      `}
    >
      {text}
    </span>
  );
};

export default HeaderBadge;