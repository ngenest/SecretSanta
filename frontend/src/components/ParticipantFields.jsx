import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipantFields({ couple, index, onChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPickingContact, setIsPickingContact] = useState(false);
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState('idle');
  const [isContactPickerAvailable] = useState(
    () => typeof navigator !== 'undefined' && !!navigator.contacts?.select
  );

  const pickPrimaryValue = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field.trim();
    if (typeof field?.value === 'string') return field.value.trim();
    return '';
  };

  const getFirstValue = (fields) => {
    if (!fields) return '';
    if (!Array.isArray(fields)) return pickPrimaryValue(fields);
    for (const entry of fields) {
      const value = pickPrimaryValue(entry);
      if (value) return value;
    }
    return pickPrimaryValue(fields[0]);
  };

  const handleContactImport = async (participantIndex) => {
    if (!isContactPickerAvailable || isPickingContact) return;

    setContactsPermissionStatus((prev) => (prev === 'idle' ? 'prompted' : prev));
    setIsPickingContact(true);

    try {
      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], {
        multiple: false
      });

      setContactsPermissionStatus('granted');

      if (!contacts || contacts.length === 0) {
        return;
      }

      const contact = contacts[0];
      const name = getFirstValue(contact.name);
      const email = getFirstValue(contact.email);
      const phone = getFirstValue(contact.tel);

      onChange(index, participantIndex, {
        name: name || '',
        email: email || '',
        phone: phone || ''
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setContactsPermissionStatus('denied');
      }

      console.error('Unable to import contact information', error);
    } finally {
      setIsPickingContact(false);
    }
  };

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
                    <div className="input-with-action">
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
                      {isContactPickerAvailable && (
                        <button
                          type="button"
                          className="contact-import-button"
                          onClick={() => handleContactImport(participantIndex)}
                          title="Import from contacts"
                          aria-label="Import participant from contacts"
                          disabled={isPickingContact}
                        >
                          <svg
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 24 24"
                            role="img"
                          >
                            <path
                              d="M6 2h9a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm9 2H8a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8h-1a1 1 0 0 1-1-1V5a1 1 0 0 0-1-1zm-4.5 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm0 6c2.33 0 4.5 1.04 4.5 2.5V18h-9v-1.5c0-1.46 2.17-2.5 4.5-2.5z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {contactsPermissionStatus === 'denied' && (
                      <small className="input-help contact-permission-error">
                        Access to contacts was denied. Update your browser permissions to enable
                        importing.
                      </small>
                    )}
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
