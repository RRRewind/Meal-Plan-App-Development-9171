import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiStar } = FiIcons;

const RatingDisplay = ({ stats, size = 'md', showCount = true, showDistribution = false }) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const starSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  if (!stats || stats.count === 0) {
    return (
      <div className={`flex items-center space-x-1 text-gray-400 ${sizeClasses[size]}`}>
        <SafeIcon icon={FiStar} className={starSizes[size]} />
        <span>No ratings</span>
      </div>
    );
  }

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <SafeIcon
            key={i}
            icon={FiStar}
            className={`${starSizes[size]} text-yellow-400 fill-current`}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className={`relative ${starSizes[size]}`}>
            <SafeIcon icon={FiStar} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <SafeIcon icon={FiStar} className="text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <SafeIcon
            key={i}
            icon={FiStar}
            className={`${starSizes[size]} text-gray-300`}
          />
        );
      }
    }

    return stars;
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center space-x-2 ${sizeClasses[size]}`}>
        <div className="flex items-center space-x-1">
          {renderStars(stats.average)}
        </div>
        <span className="font-semibold text-gray-900">{stats.average}</span>
        {showCount && (
          <span className="text-gray-500">
            ({stats.count} review{stats.count !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {showDistribution && stats.count > 0 && (
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.distribution[star] || 0;
            const percentage = (count / stats.count) * 100;
            
            return (
              <div key={star} className="flex items-center space-x-2 text-xs">
                <span className="w-3">{star}</span>
                <SafeIcon icon={FiStar} className="text-yellow-400 text-xs" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
                    className="bg-yellow-400 rounded-full h-2"
                  />
                </div>
                <span className="w-8 text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;