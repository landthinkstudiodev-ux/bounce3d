import React from 'react';
import { motion } from 'framer-motion';
import { soundFX } from '../game/audio';

interface OrganicButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'play' | 'action' | 'nav';
}

export const OrganicButton: React.FC<OrganicButtonProps> = ({ 
  onClick, 
  children, 
  className = '',
  variant = 'action'
}) => {
  const handleClick = () => {
    soundFX.playButtonPop();
    onClick();
  };

  const variants = {
    initial: { scale: 1 },
    pressed: { scale: 0.9 },
    hover: { scale: 1.05 }
  };

  // Base styles for the "Angry Birds" organic/bubbly look
  const baseStyles = "cursor-pointer rounded-[30px] font-black text-white shadow-[0_6px_0_rgba(0,0,0,0.2)] transition-all duration-100 flex items-center justify-center";
  
  const variantStyles = {
    play: "bg-amber-400 text-white shadow-[0_8px_0_#d97706] hover:bg-amber-300",
    action: "bg-emerald-500 shadow-[0_4px_0_#065f46] hover:bg-emerald-400",
    nav: "bg-slate-700 shadow-[0_4px_0_#1e293b] hover:bg-slate-600"
  };

  return (
    <motion.button
      whileHover="hover"
      whileTap="pressed"
      variants={variants}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};
