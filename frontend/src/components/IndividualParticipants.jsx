import { AnimatePresence, motion } from 'framer-motion';
import ParticipantCard from './ParticipantCard.jsx';

const listVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
};

export default function IndividualParticipants({
  participants,
  onChange,
  onAddParticipant,
  onRemoveParticipant,
  minParticipants = 3
}) {
  return (
    <div className="individuals-section">
      <div className="individuals-header">
        <h3>Participants</h3>
        <button type="button" className="secondary add-participant" onClick={onAddParticipant}>
          + Add Participant
        </button>
      </div>
      <div className="individuals-grid">
        <AnimatePresence initial={false}>
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              layout
              variants={listVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ParticipantCard
                participant={participant}
                index={index}
                idPrefix="individual"
                showRemove={participants.length > minParticipants}
                onRemove={() => onRemoveParticipant(index)}
                removeLabel="Remove"
                onChange={(updates) => onChange(index, updates)}
                autoFocus={index === participants.length - 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
