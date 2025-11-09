import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';

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

export default function DrawAnimationScreen({
  participants,
  onComplete,
  notificationPromptVisible,
  onNotificationConfirm,
  onCancelDrawConfirmed
}) {
  const controls = useAnimationControls();
  const [showCancelOverlay, setShowCancelOverlay] = useState(false);

  const contactInstructions = useMemo(
    () =>
      participants.map((participant, index) => {
        const name = participant.name || `Participant ${index + 1}`;
        const email = (participant.email || '').trim();
        const phone = (participant.phone || '').trim();
        const hasEmail = Boolean(email);
        const hasPhone = Boolean(phone);

        if (hasEmail && hasPhone) {
          return `${name} will be contacted at ${email} and at ${phone}`;
        }

        if (hasEmail) {
          return `${name} will be contacted at ${email}`;
        }

        if (hasPhone) {
          return `${name} will be contacted at ${phone}`;
        }

        return `${name} does not have contact information on file.`;
      }),
    [participants]
  );

  useEffect(() => {
    let timeout;
    const startTime = Date.now();
    const MIN_DISPLAY_DURATION = 5000;
    animationSequence(controls).then(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DISPLAY_DURATION - elapsed);
      timeout = setTimeout(onComplete, remaining);
    });
    return () => clearTimeout(timeout);
  }, [controls, onComplete]);

  useEffect(() => {
    if (!notificationPromptVisible) {
      setShowCancelOverlay(false);
    }
  }, [notificationPromptVisible]);

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
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              className="spinner-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {participant.name || `Participant ${index + 1}`}
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
      <AnimatePresence>
        {notificationPromptVisible && (
          <motion.section
            className="notification-prompt"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
          >
            <h2>
              I have completed the draw and everything looks right. Do you want to
              inform each participant about whom they were assigned over their
              preferred communication channel?
            </h2>
            <p className="notification-intro">
              Here is how each participant will be contacted:
            </p>
            <ul className="contact-list">
              {contactInstructions.map((instruction, index) => (
                <li key={participants[index]?.id || index}>{instruction}</li>
              ))}
            </ul>
            <div className="button-row">
              <button
                type="button"
                className="primary"
                onClick={onNotificationConfirm}
              >
                Yes
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowCancelOverlay(true)}
              >
                No
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCancelOverlay && (
          <motion.div
            className="cancellation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="cancellation-dialog"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              role="alertdialog"
              aria-modal="true"
            >
              <h3>
                The Draw will be cancelled and you will be taken back to the participant
                information screen and you can modify the information you entered. Do you
                confirm abandoning the draw?
              </h3>
              <div className="button-row">
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setShowCancelOverlay(false);
                    onCancelDrawConfirmed?.();
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowCancelOverlay(false)}
                >
                  No
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
