import React from 'react';

const ReviewCard = ({ 
  title = "Sample Review", 
  content = "This is a sample review content.", 
  rating = 5,
  author = "Anonymous" 
}) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-1">
          {renderStars(rating)}
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 leading-relaxed">{content}</p>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">by {author}</span>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default ReviewCard;