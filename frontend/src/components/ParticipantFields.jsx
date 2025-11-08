import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
                <div key={participant.id ?? participantIndex} className="participant-card">
                  <div className="form-group">
                    <label htmlFor={`name-${index}-${participantIndex}`}>
                      Participant Name
                    </label>
                    <input
                      id={`name-${index}-${participantIndex}`}
                      type="text"
                      placeholder="First & Last Name"
                      value={participant.name}
                      onChange={(event) =>
                        onChange(index, participantIndex, {
                          name: event.target.value
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`email-${index}-${participantIndex}`}>
                      Email
                    </label>
                    <input
                      id={`email-${index}-${participantIndex}`}
                      type="email"
                      placeholder="example@email.com"
                      value={participant.email}
                      onChange={(event) =>
                        onChange(index, participantIndex, {
                          email: event.target.value
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`phone-${index}-${participantIndex}`}>
                      Phone Number
                    </label>
                    <input
                      id={`phone-${index}-${participantIndex}`}
                      type="tel"
                      placeholder="+1 (555) 555-1234"
                      value={participant.phone || ''}
                      onChange={(event) =>
                        onChange(index, participantIndex, {
                          phone: event.target.value
                        })
                      }
                    />
                    <small className="input-help">Email or phone is required.</small>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
