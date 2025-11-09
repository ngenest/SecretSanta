import { useMemo, useState } from 'react';

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

const useContactPickerAvailability = () =>
  useState(() => typeof navigator !== 'undefined' && !!navigator.contacts?.select)[0];

export default function ParticipantCard({
  participant,
  index,
  onChange,
  idPrefix,
  showRemove,
  onRemove,
  removeLabel = 'Remove',
  autoFocus = false
}) {
  const [isPickingContact, setIsPickingContact] = useState(false);
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState('idle');
  const isContactPickerAvailable = useContactPickerAvailability();

  const cardId = useMemo(() => `${idPrefix}-${index}`, [idPrefix, index]);

  const handleContactImport = async () => {
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

      onChange({
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
    <div className="participant-card" data-participant-id={cardId}>
      <div className="participant-card-header">
        <span className="participant-card-title">Participant {index + 1}</span>
        {showRemove && (
          <button
            type="button"
            className="remove-participant"
            onClick={onRemove}
            aria-label={`${removeLabel} participant ${index + 1}`}
          >
            ✕
          </button>
        )}
      </div>
      <div className="form-group">
        <label htmlFor={`${cardId}-name`}>Participant Name</label>
        <div className="input-with-action">
          <input
            id={`${cardId}-name`}
            type="text"
            placeholder="First & Last Name"
            value={participant.name}
            onChange={(event) => onChange({ name: event.target.value })}
            required
            autoFocus={autoFocus}
          />
          {isContactPickerAvailable && (
            <button
              type="button"
              className="contact-import-button"
              onClick={handleContactImport}
              title="Import from contacts"
              aria-label="Import participant from contacts"
              disabled={isPickingContact}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img">
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
            Access to contacts was denied. Update your browser permissions to enable importing.
          </small>
        )}
      </div>
      <div className="form-group">
        <label htmlFor={`${cardId}-email`}>Email</label>
        <input
          id={`${cardId}-email`}
          type="email"
          placeholder="example@email.com"
          value={participant.email}
          onChange={(event) => onChange({ email: event.target.value })}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${cardId}-phone`}>Phone Number</label>
        <input
          id={`${cardId}-phone`}
          type="tel"
          placeholder="+1 (555) 555-1234"
          value={participant.phone || ''}
          onChange={(event) => onChange({ phone: event.target.value })}
        />
        <small className="input-help">Email or phone is required.</small>
      </div>
    </div>
  );
}
