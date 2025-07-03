import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRating } from '../contexts/RatingContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiStar, FiCheck, FiX, FiEdit3 } = FiIcons;

const InlineRating = ({ recipe, canRate, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Use refs to track state without triggering re-renders
  const initializedRecipeRef = useRef(null);
  const reviewInputRef = useRef(null);
  const isUserTypingRef = useRef(false);
  
  const { submitRating, getUserRating } = useRating();

  // Memoize the existing rating to prevent unnecessary re-computations
  const existingRating = useCallback(() => {
    return getUserRating(recipe?.id);
  }, [getUserRating, recipe?.id]);

  // Initialize rating data only when recipe changes (not on every render)
  useEffect(() => {
    if (recipe?.id && initializedRecipeRef.current !== recipe.id) {
      initializedRecipeRef.current = recipe.id;
      
      const userRating = existingRating();
      if (userRating) {
        setRating(userRating.rating);
        // Only set review if user is not currently typing
        if (!isUserTypingRef.current) {
          setReview(userRating.review || '');
        }
      } else {
        setRating(0);
        if (!isUserTypingRef.current) {
          setReview('');
        }
      }
    }
  }, [recipe?.id, existingRating]);

  // Focus textarea when edit form opens
  useEffect(() => {
    if (showEditForm && reviewInputRef.current) {
      setTimeout(() => {
        reviewInputRef.current.focus();
        const length = reviewInputRef.current.value.length;
        reviewInputRef.current.setSelectionRange(length, length);
      }, 100);
    }
  }, [showEditForm]);

  const currentExistingRating = existingRating();
  const displayRating = hoverRating || rating;

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good', 
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleStarClick = async (starRating) => {
    if (!canRate || isSubmitting) return;

    setRating(starRating);
    setIsSubmitting(true);

    try {
      const result = await submitRating(recipe.id, starRating, review);
      if (result.success) {
        toast.success(`⭐ Rated ${starRating} star${starRating !== 1 ? 's' : ''}!`);
        setIsExpanded(false);
        setShowEditForm(false);
        isUserTypingRef.current = false;
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!rating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitRating(recipe.id, rating, review);
      if (result.success) {
        toast.success('⭐ Review updated!');
        setShowEditForm(false);
        setIsExpanded(false);
        isUserTypingRef.current = false;
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpand = () => {
    if (!canRate) {
      toast.error('You can only rate community recipes from other users');
      return;
    }
    setIsExpanded(true);
  };

  const handleEditReview = () => {
    const currentRating = existingRating();
    if (currentRating && currentRating.review) {
      setReview(currentRating.review);
    }
    setShowEditForm(true);
    setIsExpanded(true);
    isUserTypingRef.current = false;
  };

  // Completely isolated review change handler
  const handleReviewChange = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Mark that user is actively typing
    isUserTypingRef.current = true;
    
    const newValue = e.target.value;
    setReview(newValue);
    
    // Clear the typing flag after a delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 1000);
  }, []);

  // Handle input events
  const handleTextareaInput = useCallback((e) => {
    isUserTypingRef.current = true;
    setReview(e.target.value);
  }, []);

  // Handle focus events
  const handleTextareaFocus = useCallback(() => {
    isUserTypingRef.current = true;
  }, []);

  // Handle blur events
  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 500);
  }, []);

  const handleCancel = () => {
    setShowEditForm(false);
    isUserTypingRef.current = false;
    
    if (!currentExistingRating) {
      setIsExpanded(false);
      setReview('');
    } else {
      setReview(currentExistingRating.review || '');
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setShowEditForm(false);
    setHoverRating(0);
    isUserTypingRef.current = false;
    
    if (currentExistingRating) {
      setReview(currentExistingRating.review || '');
    } else {
      setReview('');
    }
  };

  if (!canRate && !currentExistingRating) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Compact Rating Display */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3"
        >
          {/* Star Display */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => currentExistingRating ? handleExpand() : handleStarClick(star)}
                onMouseEnter={() => !currentExistingRating && setHoverRating(star)}
                onMouseLeave={() => !currentExistingRating && setHoverRating(0)}
                className="transition-colors duration-200"
                disabled={isSubmitting}
              >
                <SafeIcon
                  icon={FiStar}
                  className={`text-lg ${
                    currentExistingRating
                      ? star <= currentExistingRating.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                      : star <= displayRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Rating Info */}
          {currentExistingRating ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-700">
                Your rating: {currentExistingRating.rating}/5
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditReview}
                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                title="Edit your rating"
              >
                <SafeIcon icon={FiEdit3} className="text-xs" />
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {displayRating > 0 ? (
                <span className="text-sm font-semibold text-primary-600">
                  {ratingLabels[displayRating]}
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  Click to rate
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Expanded Rating Form */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mt-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                {currentExistingRating ? 'Update Your Rating' : 'Rate This Recipe'}
              </h4>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <SafeIcon icon={FiX} className="text-sm" />
              </motion.button>
            </div>

            {/* Star Rating */}
            <div className="text-center mb-4">
              <div className="flex justify-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                    className="p-1 disabled:opacity-50"
                  >
                    <SafeIcon
                      icon={FiStar}
                      className={`text-2xl transition-colors duration-200 ${
                        star <= displayRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              
              {displayRating > 0 && (
                <p className="text-sm font-semibold text-gray-700">
                  {ratingLabels[displayRating]}
                </p>
              )}
            </div>

            {/* Review Form (only if editing or adding review) */}
            {(showEditForm || !currentExistingRating) && (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    ref={reviewInputRef}
                    value={review}
                    onChange={handleReviewChange}
                    onInput={handleTextareaInput}
                    onFocus={handleTextareaFocus}
                    onBlur={handleTextareaBlur}
                    placeholder="Share your thoughts about this recipe..."
                    rows={3}
                    maxLength={200}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:border-yellow-400 focus:outline-none disabled:opacity-50 bg-white"
                    style={{
                      minHeight: '80px',
                      lineHeight: '1.4'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {review.length}/200 characters
                  </p>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!rating || isSubmitting}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <SafeIcon icon={FiCheck} className="text-sm" />
                        <span>Save Review</span>
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            )}

            {/* Existing Review Display */}
            {currentExistingRating?.review && !showEditForm && (
              <div className="mt-3 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-700 italic">
                  "{currentExistingRating.review}"
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditReview}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Edit review
                </motion.button>
              </div>
            )}

            {/* Quick Actions */}
            {!showEditForm && (
              <div className="mt-3 flex justify-center">
                <span className="text-xs text-gray-500">
                  {currentExistingRating ? 'Click stars to update rating' : 'Click stars above to rate instantly'}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InlineRating;