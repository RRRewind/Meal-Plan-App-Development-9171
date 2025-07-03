import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRating } from '../contexts/RatingContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiStar, FiX } = FiIcons;

const RatingModal = ({ recipe, isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitRating, getUserRating, loading } = useRating();

  // ✅ SIMPLIFIED: Initialize form when modal opens
  useEffect(() => {
    if (isOpen && recipe) {
      setIsSubmitting(false);
      setHoverRating(0);
      
      const userRating = getUserRating(recipe.id);
      if (userRating) {
        setRating(userRating.rating);
        setReview(userRating.review || '');
      } else {
        setRating(0);
        setReview('');
      }
    }
  }, [isOpen, recipe, getUserRating]);

  // ✅ SIMPLIFIED: Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoverRating(0);
      setReview('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitRating(recipe.id, rating, review);
      if (result.success) {
        // Close modal after successful submission
        onClose();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating) => {
    if (!isSubmitting) {
      setRating(starRating);
    }
  };

  const handleStarHover = (starRating) => {
    if (!isSubmitting) {
      setHoverRating(starRating);
    }
  };

  const handleStarLeave = () => {
    if (!isSubmitting) {
      setHoverRating(0);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const displayRating = hoverRating || rating;

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  // ✅ SIMPLIFIED: Only render if open and has recipe
  if (!isOpen || !recipe) return null;

  const existingRating = getUserRating(recipe.id);

  const ModalContent = () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {existingRating ? 'Update Rating' : 'Rate Recipe'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-50"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </motion.button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{recipe.title}</h3>
              <p className="text-sm text-gray-600">Share your experience with this community recipe</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="text-center">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Your Rating
                </label>
                <div className="flex justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={handleStarLeave}
                      disabled={isSubmitting}
                      className="p-1 disabled:opacity-50"
                    >
                      <SafeIcon
                        icon={FiStar}
                        className={`text-3xl transition-colors duration-200 ${
                          star <= displayRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                {displayRating > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-semibold text-gray-900"
                  >
                    {ratingLabels[displayRating]}
                  </motion.p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Review (Optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 input-modern rounded-xl font-medium resize-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {review.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={rating === 0 || isSubmitting || loading}
                  className="flex-1 px-6 py-3 btn-gradient text-white rounded-xl font-bold disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  {isSubmitting || loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
                  ) : (
                    <span>{existingRating ? 'Update' : 'Submit'} Rating</span>
                  )}
                </motion.button>
              </div>
            </form>

            {existingRating && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Your current rating:</strong> {existingRating.rating} stars
                  {existingRating.review && (
                    <span className="block mt-1">"{existingRating.review}"</span>
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Portal the modal to document.body
  return typeof document !== 'undefined' ? createPortal(<ModalContent />, document.body) : null;
};

export default RatingModal;