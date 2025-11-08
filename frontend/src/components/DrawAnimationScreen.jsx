import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const animationSequence = async (controls) => {
  await controls.start({
    rotate: 360,
    transition: { duration: 3, repeat: 0, ease: 'linear' }
  });
  await controls.start({
    x: [0, -20, 20, -10, 10, 0],
    transition: { duration: 2, ease: 'easeInOut' }
  });
  await controls.start({
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 0px rgba(255,215,0,0.8)',
      '0 0 30px rgba(255,215,0,0.9)',
      '0 0 5px rgba(255,215,0,0.6)'
    ],
    transition: { duration: 2 }
  });
};

export default function DrawAnimationScreen({ participantNames, onComplete }) {
  const controls = useAnimationControls();

  useEffect(() => {
    let timeout;
    animationSequence(controls).then(() => {
      timeout = setTimeout(onComplete, 2000);
    });
    return () => clearTimeout(timeout);
  }, [controls, onComplete]);

  return (
    <main className="screen screen-draw">
      <motion.h1
        className="screen-title"
        animate={{ color: ['#FFD700', '#FF0000', '#008000'] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Shuffling the Secrets!
      </motion.h1>
      <div className="draw-stage">
        <motion.div className="spinner" animate={controls}>
          {participantNames.map((name, index) => (
            <motion.div
              key={`${name}-${index}`}
              className="spinner-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {name || `Participant ${index + 1}`}
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          className="match-banner"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: [0.5, 1.1, 1] }}
          transition={{ delay: 4, duration: 2 }}
        >
          Matches Made!
        </motion.div>
      </div>
    </main>
  );
}
