import React from 'react';
import * as FiIcons from 'react-icons/fi';
import { FiAlertTriangle } from 'react-icons/fi';

const SafeIcon = ({ icon, name, ...props }) => {
  let IconComponent;
  
  try {
    // If icon is passed directly, use it
    if (icon) {
      IconComponent = icon;
    }
    // If name is passed, try to find it in FiIcons
    else if (name && FiIcons[`Fi${name}`]) {
      IconComponent = FiIcons[`Fi${name}`];
    }
    // Fallback to alert triangle
    else {
      IconComponent = FiAlertTriangle;
    }
  } catch (e) {
    console.warn('SafeIcon error:', e);
    IconComponent = FiAlertTriangle;
  }
  
  // Ensure we have a valid component
  if (!IconComponent || typeof IconComponent !== 'function') {
    IconComponent = FiAlertTriangle;
  }
  
  return React.createElement(IconComponent, props);
};

export default SafeIcon;