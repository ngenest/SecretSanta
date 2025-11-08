import { motion } from 'framer-motion';

export default function ConfirmationScreen({
  eventName,
  eventDate,
  participants,
  onRestart
}) {
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
          Your Secret Santa matches have been drawn successfully! Emails sent to
          all participants with their secret assignments.
        </p>
        <div className="participant-list">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.email}
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
        <p className="privacy-note">
          Assignments are secret – no one draws their spouse!
        </p>
        <div className="button-row">
          <button className="primary" type="button" onClick={onRestart}>
            Done
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => navigator.clipboard?.writeText(`${eventName} on ${eventDate}`)}
          >
            Share Event
          </button>
        </div>
      </section>
    </main>
  );
}
