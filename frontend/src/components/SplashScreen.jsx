/* eslint-disable react-hooks/purity */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('loading'); // 'loading', 'bursting'
  const [binaryText, setBinaryText] = useState('1010');

  useEffect(() => {
    // Cycle binary text rapidly to look like processing
    const textInterval = setInterval(() => {
      setBinaryText(Math.random() > 0.5 ? '1010' : '0101');
    }, 150);

    // Stage 1 -> Stage 2 (Burst)
    const burstTimer = setTimeout(() => {
      setStage('bursting');
      clearInterval(textInterval);
    }, 2000);
    
    // Stage 2 -> Complete (Unmount and fade out)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800); // Wait 0.8s for the burst to finish before fading the screen away
    
    return () => {
      clearInterval(textInterval);
      clearTimeout(burstTimer);
      clearTimeout(completeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate random particles that shoot to all corners
  const particles = useMemo(() => Array.from({ length: 100 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    // Shoot far enough to clear any screen size
    const distance = 800 + Math.random() * 800; 
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const duration = 0.6 + Math.random() * 0.4;
    return { id: i, tx, ty, duration };
  }), []);

  const textFragments = useMemo(() => Array.from({ length: 20 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 600; 
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const rotate = Math.random() * 720 - 360;
    const duration = 0.7 + Math.random() * 0.3;
    const text = Math.random() > 0.5 ? '1' : '0';
    return { id: i, tx, ty, rotate, duration, text };
  }), []);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center theme-bg pointer-events-none"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <AnimatePresence>
        {stage === 'loading' && (
          <motion.div 
            key="loader"
            className="absolute flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 180 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
            transition={{ 
              scale: { duration: 0.5 },
              opacity: { duration: 0.5 },
              rotate: { duration: 4, repeat: Infinity, ease: "linear" } 
            }}
          >
            {/* Outer box spinning slowly */}
            <div className="w-32 h-32 border-[3px] theme-border-solid flex items-center justify-center relative">
              {/* Inner text counter-rotating so it remains somewhat legible but dynamic */}
              <motion.span 
                className="font-mono text-3xl font-bold theme-text tracking-[0.3em] absolute"
                animate={{ rotate: -180 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                {binaryText}
              </motion.span>
            </div>
            
            {/* Outer dashed radar ring spinning faster */}
            <motion.div 
              className="absolute inset-0 border-2 theme-border-solid theme-text-muted border-dashed rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center", scale: 1.4 }}
            />
          </motion.div>
        )}

        {stage === 'bursting' && (
          <motion.div 
            key="burst"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Primary physical particles */}
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 theme-inverted rounded-full -ml-[3px] -mt-[3px]"
                initial={{ x: 0, y: 0, opacity: 1, scale: 2 }}
                animate={{ 
                  x: p.tx, 
                  y: p.ty, 
                  opacity: 0, 
                  scale: 0 
                }}
                transition={{ duration: p.duration, ease: "easeOut" }}
              />
            ))}
            
            {/* Binary text fragments breaking off and flying */}
            {textFragments.map(f => (
              <motion.span
                key={`txt-${f.id}`}
                className="absolute left-1/2 top-1/2 font-mono text-xl font-bold theme-text -ml-2 -mt-3"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
                animate={{ 
                  x: f.tx, 
                  y: f.ty, 
                  opacity: 0, 
                  scale: 0,
                  rotate: f.rotate
                }}
                transition={{ duration: f.duration, ease: "easeOut" }}
              >
                {f.text}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};