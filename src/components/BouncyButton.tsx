import React from 'react';
import { motion } from 'framer-motion';
import { playPopSound } from '../game/audioEngine';

interface BouncyButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const BouncyButton: React.FC<BouncyButtonProps> = ({ 
  onClick, 
  children, 
  className = '',
  variant = 'primary'
}) => {
  const handleClick = () => {
    playPopSound(); 
    onClick();
  };

  const variants = {
    initial: { scale: 1 },
    pressed: { scale: 0.9 },
    hover: { scale: 1.05 }
  };

  const baseStyles = "cursor-pointer transition-colors duration-200";
  
  return (
    <motion.button
      whileHover="hover"
      whileTap="pressed"
      variants={variants}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
      className={`${baseStyles} ${className}`}
    >
      {children}
    </motion.button>
  );
};
