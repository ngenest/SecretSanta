import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const overlayVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 12,
    transition: { duration: 0.4, ease: 'easeIn' }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.4, ease: 'easeInOut' }
  }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -65 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: index * 0.08,
      type: 'spring',
      stiffness: 120,
      damping: 12
    }
  }),
  exit: {
    opacity: 0,
    y: -40,
    rotateX: 45,
    transition: { duration: 0.25 }
  }
};

const sparkleVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0.5, 1.2, 0.8],
    rotate: [0, 30, -15],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
  }
};

const orbVariants = {
  animate: {
    scale: [0.9, 1.2, 0.95],
    rotate: [0, 25, -15, 0],
    filter: [
      'blur(40px) hue-rotate(0deg)',
      'blur(30px) hue-rotate(45deg)',
      'blur(40px) hue-rotate(-20deg)'
    ],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' }
  }
};

export default function ConfirmationScreen({
  eventName,
  eventDate,
  drawMode = 'couples',
  secretSantaRules = '',
  participants,
  assignments = [],
  onRestart
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayCycle, setOverlayCycle] = useState(0);

  const assignmentPairs = useMemo(
    () => (Array.isArray(assignments) ? assignments : []),
    [assignments]
  );

  const handleShare = (event) => {
    const shareMessage = `${eventName} on ${eventDate}`;

    if (event?.ctrlKey) {
      event.preventDefault();
      setOverlayCycle((cycle) => cycle + 1);
      setShowOverlay(true);
    }

    navigator.clipboard?.writeText(shareMessage);
  };

  useEffect(() => {
    if (!showOverlay) return;

    const timeout = setTimeout(() => {
      setShowOverlay(false);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [showOverlay, overlayCycle]);

  const drawSummary =
    drawMode === 'individuals'
      ? 'Assignments are secret – everyone was matched randomly under no restrictions!'
      : 'Assignments are secret – no one draws their partner!';

  const rulesLines = (secretSantaRules || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <main className="screen screen-confirmation">
      <motion.h1
        className="screen-title"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 1.2 }}
      >
        Ho Ho Ho! Draw Complete!
      </motion.h1>
      <section className="confirmation-content">
        <p className="success-message">
          Email and SMS notifications are on their merry way to every participant.
          Every time one of them confirms receipt by clicking their link, you, as
          the organizer, will be notified. You can then remain the great leader you
          have been so far!

          Happy Holidays!
        </p>
        <div className="participant-list">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              className="participant-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="check">✔</span>
              <span>{participant.name}</span>
            </motion.div>
          ))}
        </div>
        <p className="privacy-note">{drawSummary}</p>
        {rulesLines.length > 0 && (
          <div className="rules-summary">
            <h3>Secret Santa Rules</h3>
            <ul>
              {rulesLines.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="button-row">
          <button className="primary" type="button" onClick={onRestart}>
            Done
          </button>
          <button
            className="secondary"
            type="button"
            onClick={handleShare}
          >
            Share Event
          </button>
        </div>
      </section>
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key={`easter-egg-${overlayCycle}`}
            className="easter-egg-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="presentation"
          >
            <motion.div
              className="easter-egg-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.96 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            <motion.div
              className="easter-egg-orb orb-one"
              variants={orbVariants}
              animate="animate"
            />
            <motion.div
              className="easter-egg-orb orb-two"
              variants={orbVariants}
              animate="animate"
            />
            <motion.div
              className="easter-egg-orb orb-three"
              variants={orbVariants}
              animate="animate"
            />

            <motion.div
              className="easter-egg-content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.h2
                className="easter-egg-title"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                North Pole Confidential
              </motion.h2>
              <motion.p
                className="easter-egg-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Secret assignments decoded! Keep your eyes peeled for 10 seconds...
              </motion.p>
              <motion.ul
                className="assignment-grid"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {assignmentPairs.length ? (
                  assignmentPairs.map(({ giver, receiver }, index) => (
                    <motion.li
                      key={`${giver?.id ?? giver?.name ?? index}-assignment`}
                      className="assignment-card"
                      variants={itemVariants}
                      custom={index}
                    >
                      <span className="assignment-label">{giver?.name}</span>
                      <motion.span
                        className="assignment-arrow"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: [0.5, 1.2, 1] }}
                        transition={{ duration: 0.6, delay: 0.1 + index * 0.05 }}
                      >
                        ➜
                      </motion.span>
                      <span className="assignment-target">{receiver?.name}</span>
                    </motion.li>
                  ))
                ) : (
                  <motion.li
                    className="assignment-card empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span>No assignments available.</span>
                  </motion.li>
                )}
              </motion.ul>
            </motion.div>

            {[...Array(6)].map((_, index) => (
              <motion.span
                // eslint-disable-next-line react/no-array-index-key
                key={`sparkle-${index}`}
                className={`overlay-sparkle sparkle-${(index % 3) + 1}`}
                style={{
                  top: `${15 + index * 12}%`,
                  left: `${10 + (index % 3) * 25}%`
                }}
                variants={sparkleVariants}
                initial="initial"
                animate="animate"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
