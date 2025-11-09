import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParticipantCard from './ParticipantCard.jsx';

export default function ParticipantFields({ couple, index, onChange }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="accordion-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{`Couple ${index + 1}`}</span>
        <span className="twist">↺</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="accordion-content"
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="participant-grid">
              {couple.participants.map((participant, participantIndex) => (
                <ParticipantCard
                  key={participant.id ?? participantIndex}
                  participant={participant}
                  index={participantIndex}
                  idPrefix={`couple-${index}`}
                  onChange={(updates) =>
                    onChange(index, participantIndex, {
                      ...updates
                    })
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
