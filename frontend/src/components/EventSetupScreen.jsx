import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ParticipantFields from './ParticipantFields.jsx';
import IndividualParticipants from './IndividualParticipants.jsx';

const DEFAULT_COUPLE_COUNT = 4;
const MIN_INDIVIDUALS = 3;
const DEFAULT_INDIVIDUALS_COUNT = 6;

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createParticipant = () => ({
  id: generateId(),
  name: '',
  email: '',
  phone: ''
});

const createDefaultCouples = () =>
  Array.from({ length: DEFAULT_COUPLE_COUNT }, (_, idx) => ({
    id: idx,
    participants: [createParticipant(), createParticipant()]
  }));

const createDefaultIndividuals = () =>
  Array.from({ length: DEFAULT_INDIVIDUALS_COUNT }, () => createParticipant());

const normalizeParticipant = (participant = {}) => ({
  id: participant.id || generateId(),
  name: participant.name || '',
  email: participant.email || '',
  phone: participant.phone || ''
});

const normalizeCouple = (couple, fallbackId) => {
  const participantsSource = Array.isArray(couple?.participants)
    ? couple.participants
    : [];
  const normalizedParticipants = participantsSource.slice(0, 2).map(normalizeParticipant);
  while (normalizedParticipants.length < 2) {
    normalizedParticipants.push(createParticipant());
  }

  return {
    id: couple?.id ?? fallbackId ?? generateId(),
    participants: normalizedParticipants
  };
};

const EXCHANGE_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'friends-and-family', label: 'Friends and Family' },
  { value: 'colleagues', label: 'Colleagues' },
  { value: 'neighbors', label: 'Neighbors' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other group' }
];

export default function EventSetupScreen({ onSubmit, initialEvent }) {
  const [eventName, setEventName] = useState(initialEvent.name || '');
  const [eventDate, setEventDate] = useState(initialEvent.date || '');
  const [exchangeType, setExchangeType] = useState(initialEvent.exchangeType || '');
  const [otherGroupType, setOtherGroupType] = useState(initialEvent.otherGroupType || '');
  const [drawMode, setDrawMode] = useState(initialEvent.drawMode || 'couples');
  const [organizerName, setOrganizerName] = useState(initialEvent.organizer?.name || '');
  const [organizerEmail, setOrganizerEmail] = useState(initialEvent.organizer?.email || '');
  const [organizerPhone, setOrganizerPhone] = useState(initialEvent.organizer?.phone || '');
  const [secretSantaRules, setSecretSantaRules] = useState(initialEvent.secretSantaRules || '');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [couples, setCouples] = useState(() => {
    const source =
      Array.isArray(initialEvent.couples) && initialEvent.couples.length
        ? initialEvent.couples
        : createDefaultCouples();
    return source.map((couple, idx) => normalizeCouple(couple, idx));
  });

  const [individuals, setIndividuals] = useState(() => {
    const source =
      Array.isArray(initialEvent.individuals) && initialEvent.individuals.length
        ? initialEvent.individuals
        : createDefaultIndividuals();
    const normalized = source.map((participant) => normalizeParticipant(participant));
    while (normalized.length < MIN_INDIVIDUALS) {
      normalized.push(createParticipant());
    }
    return normalized;
  });

  useEffect(() => {
    if (!eventDate) {
      const year = new Date().getFullYear();
      setEventDate(`${year}-12-24`);
    }
  }, [eventDate]);

  const activeParticipants = useMemo(
    () =>
      drawMode === 'individuals'
        ? individuals
        : couples.flatMap((couple) => couple.participants),
    [couples, drawMode, individuals]
  );

  const emails = activeParticipants
    .map((p) => (p.email ?? '').trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const phones = activeParticipants
    .map((p) => (p.phone ?? '').trim())
    .filter(Boolean)
    .map((value) => value.replace(/\D+/g, ''));
  const uniqueEmails = new Set(emails);
  const uniquePhones = new Set(phones);

  const organizerNameValue = organizerName.trim();
  const organizerEmailValue = organizerEmail.trim();
  const organizerPhoneValue = organizerPhone.trim();
  const hasOrganizerContact = organizerEmailValue || organizerPhoneValue;

  const hasEnoughParticipants =
    drawMode === 'individuals'
      ? activeParticipants.length >= MIN_INDIVIDUALS
      : activeParticipants.length >= 2;

  const participantsComplete = activeParticipants.every((participant) => {
    const name = (participant.name ?? '').trim();
    const email = (participant.email ?? '').trim();
    const phone = (participant.phone ?? '').trim();
    return name && (email || phone);
  });

  const isValid =
    exchangeType.trim().length > 0 &&
    (exchangeType !== 'other' || otherGroupType.trim().length > 0) &&
    eventName.trim().length > 0 &&
    eventDate.trim().length > 0 &&
    organizerNameValue.length > 0 &&
    hasOrganizerContact &&
    hasEnoughParticipants &&
    participantsComplete &&
    emails.length === uniqueEmails.size &&
    phones.length === uniquePhones.size;

  const clearParticipantErrors = () =>
    setErrors((prev) => ({
      ...prev,
      participants: undefined,
      emails: undefined,
      phones: undefined
    }));

  const handleCoupleParticipantChange = (coupleIndex, participantIndex, updates) => {
    clearParticipantErrors();
    setCouples((prev) =>
      prev.map((couple, idx) => {
        if (idx !== coupleIndex) return couple;
        const nextParticipants = couple.participants.map((person, pIdx) =>
          pIdx === participantIndex ? { ...person, ...updates } : person
        );
        return { ...couple, participants: nextParticipants };
      })
    );
  };

  const handleIndividualChange = (participantIndex, updates) => {
    clearParticipantErrors();
    setIndividuals((prev) =>
      prev.map((participant, idx) =>
        idx === participantIndex ? { ...participant, ...updates } : participant
      )
    );
  };

  const handleAddIndividual = () => {
    clearParticipantErrors();
    setIndividuals((prev) => [...prev, createParticipant()]);
  };

  const handleRemoveIndividual = (participantIndex) => {
    clearParticipantErrors();
    setIndividuals((prev) => {
      if (prev.length <= MIN_INDIVIDUALS) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== participantIndex);
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValid) {
      const nextErrors = {};
      if (!exchangeType.trim()) nextErrors.exchangeType = 'Please select a group for your exchange';
      if (exchangeType === 'other' && !otherGroupType.trim())
        nextErrors.otherGroupType = 'Tell us about your group';
      if (!eventName.trim()) nextErrors.eventName = 'Event name is required';
      if (!eventDate.trim()) nextErrors.eventDate = 'Event date is required';
      if (!organizerNameValue)
        nextErrors.organizerName = 'Organizer name is required to send confirmations';
      if (!hasOrganizerContact)
        nextErrors.organizerContact =
          'Provide at least one way to reach the organizer (email or phone).';
      if (!hasEnoughParticipants) {
        nextErrors.participants =
          drawMode === 'individuals'
            ? `Add at least ${MIN_INDIVIDUALS} participants for an individual draw.`
            : 'Each couple needs two participants to keep the magic fair.';
      } else if (!participantsComplete) {
        nextErrors.participants =
          'Each participant needs a name and at least one way to contact them.';
      }
      if (emails.length !== uniqueEmails.size)
        nextErrors.emails = 'Participant emails must be unique';
      if (phones.length !== uniquePhones.size)
        nextErrors.phones = 'Participant phone numbers must be unique';
      setErrors(nextErrors);
      return;
    }

    const couplesPayload = couples.map((couple) => ({
      id: couple.id,
      participants: couple.participants.map(({ id, name, email, phone }) => ({
        id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      }))
    }));

    const individualsPayload = individuals.map(({ id, name, email, phone }) => ({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim()
    }));

    onSubmit({
      name: eventName.trim(),
      date: eventDate,
      exchangeType,
      otherGroupType: exchangeType === 'other' ? otherGroupType.trim() : '',
      drawMode,
      organizer: {
        name: organizerNameValue,
        email: organizerEmailValue,
        phone: organizerPhoneValue
      },
      secretSantaRules: secretSantaRules.trim(),
      couples: couplesPayload,
      individuals: individualsPayload
    });
  };

  const handleExchangeTypeChange = (value) => {
    setErrors((prev) => ({
      ...prev,
      exchangeType: undefined,
      otherGroupType: undefined
    }));
    setExchangeType(value);
    if (value !== 'other') {
      setOtherGroupType('');
    }
  };

  const handleOtherGroupTypeChange = (value) => {
    setErrors((prev) => ({ ...prev, otherGroupType: undefined }));
    setOtherGroupType(value);
  };

  const handleEventNameChange = (value) => {
    setErrors((prev) => ({ ...prev, eventName: undefined }));
    setEventName(value);
  };

  const handleEventDateChange = (value) => {
    setErrors((prev) => ({ ...prev, eventDate: undefined }));
    setEventDate(value);
  };

  const handleOrganizerNameChange = (value) => {
    setErrors((prev) => ({ ...prev, organizerName: undefined }));
    setOrganizerName(value);
  };

  const handleOrganizerEmailChange = (value) => {
    setErrors((prev) => ({ ...prev, organizerContact: undefined }));
    setOrganizerEmail(value);
  };

  const handleOrganizerPhoneChange = (value) => {
    setErrors((prev) => ({ ...prev, organizerContact: undefined }));
    setOrganizerPhone(value);
  };

  const handleDrawModeChange = (value) => {
    clearParticipantErrors();
    setDrawMode(value);
    if (value === 'individuals' && individuals.length < MIN_INDIVIDUALS) {
      setIndividuals((prev) => {
        const next = [...prev];
        while (next.length < MIN_INDIVIDUALS) {
          next.push(createParticipant());
        }
        return next;
      });
    }
  };

  const showTooltip = () => setIsTooltipOpen(true);
  const hideTooltip = () => setIsTooltipOpen(false);
  const toggleTooltip = () => setIsTooltipOpen((prev) => !prev);

  return (
    <motion.main
      className="screen screen-setup"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
    >
      <motion.h1
        className="screen-title"
        initial={{ textShadow: '0 0 0px #FFD700' }}
        animate={{ textShadow: ['0 0 0px #FFD700', '0 0 15px #FFD700'] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Create Your Secret Santa Magic!
      </motion.h1>
      <form className="event-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="exchangeType">Who is this Secret Santa for?</label>
          <select
            id="exchangeType"
            name="exchangeType"
            value={exchangeType}
            onChange={(e) => handleExchangeTypeChange(e.target.value)}
            className={errors.exchangeType ? 'has-error' : ''}
          >
            <option value="" disabled>
              Select an option
            </option>
            {EXCHANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.exchangeType && <p className="error">{errors.exchangeType}</p>}
        </div>
        {exchangeType === 'other' && (
          <div className="form-group">
            <label htmlFor="otherGroupType">What type of group is participating?</label>
            <input
              id="otherGroupType"
              name="otherGroupType"
              type="text"
              placeholder="E.g., Book club, sports team, volunteer group"
              value={otherGroupType}
              onChange={(e) => handleOtherGroupTypeChange(e.target.value)}
              className={errors.otherGroupType ? 'has-error' : ''}
            />
            {errors.otherGroupType && <p className="error">{errors.otherGroupType}</p>}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="eventName">Event Name</label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            placeholder="E.g., Family Christmas Swap"
            value={eventName}
            onChange={(e) => handleEventNameChange(e.target.value)}
            className={errors.eventName ? 'has-error' : ''}
          />
          {errors.eventName && <p className="error">{errors.eventName}</p>}
        </div>
        <div className="organizer-group">
          <span className="group-label">Organizer details</span>
          <div className="organizer-grid">
            <div className="form-subgroup">
              <label htmlFor="organizerName">Organizer Name</label>
              <input
                id="organizerName"
                name="organizerName"
                type="text"
                placeholder="E.g., Holly Jolly"
                value={organizerName}
                onChange={(e) => handleOrganizerNameChange(e.target.value)}
                className={errors.organizerName ? 'has-error' : ''}
              />
            </div>
            <div className="form-subgroup">
              <label htmlFor="organizerEmail">Organizer Email</label>
              <input
                id="organizerEmail"
                name="organizerEmail"
                type="email"
                placeholder="organizer@email.com"
                value={organizerEmail}
                onChange={(e) => handleOrganizerEmailChange(e.target.value)}
                className={errors.organizerContact ? 'has-error' : ''}
              />
            </div>
            <div className="form-subgroup">
              <label htmlFor="organizerPhone">Organizer Phone</label>
              <input
                id="organizerPhone"
                name="organizerPhone"
                type="tel"
                placeholder="+1 (555) 555-9876"
                value={organizerPhone}
                onChange={(e) => handleOrganizerPhoneChange(e.target.value)}
                className={errors.organizerContact ? 'has-error' : ''}
              />
            </div>
          </div>
          {errors.organizerName && <p className="error">{errors.organizerName}</p>}
          {errors.organizerContact && <p className="error">{errors.organizerContact}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="eventDate">Gift Exchange Date</label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => handleEventDateChange(e.target.value)}
            className={errors.eventDate ? 'has-error' : ''}
          />
          {errors.eventDate && <p className="error">{errors.eventDate}</p>}
        </div>
        <div className="form-group draw-mode-group">
          <div className="label-with-tooltip" onMouseLeave={hideTooltip}>
            <span className="group-label">How will the draw be organized?</span>
            <button
              type="button"
              className="info-icon"
              onMouseEnter={showTooltip}
              onFocus={showTooltip}
              onBlur={hideTooltip}
              onClick={(event) => {
                event.preventDefault();
                toggleTooltip();
              }}
              aria-label="Learn more about draw options"
            >
              i
            </button>
            <AnimatePresence>
              {isTooltipOpen && (
                <motion.div
                  className="info-tooltip"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                >
                  Couples cannot be assigned to each other at time of draw. Individuals are assigned
                  randomly under no restrictions.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="radio-group">
            <label className={drawMode === 'couples' ? 'selected' : ''}>
              <input
                type="radio"
                name="drawMode"
                value="couples"
                checked={drawMode === 'couples'}
                onChange={(event) => handleDrawModeChange(event.target.value)}
              />
              Couples
            </label>
            <label className={drawMode === 'individuals' ? 'selected' : ''}>
              <input
                type="radio"
                name="drawMode"
                value="individuals"
                checked={drawMode === 'individuals'}
                onChange={(event) => handleDrawModeChange(event.target.value)}
              />
              Individuals
            </label>
          </div>
        </div>
        {drawMode === 'couples' ? (
          <div className="accordion">
            {couples.map((couple, idx) => (
              <ParticipantFields
                key={couple.id}
                index={idx}
                couple={couple}
                onChange={handleCoupleParticipantChange}
              />
            ))}
          </div>
        ) : (
          <IndividualParticipants
            participants={individuals}
            onChange={handleIndividualChange}
            onAddParticipant={handleAddIndividual}
            onRemoveParticipant={handleRemoveIndividual}
            minParticipants={MIN_INDIVIDUALS}
          />
        )}
        {errors.participants && <p className="error email-error">{errors.participants}</p>}
        {errors.emails && <p className="error email-error">{errors.emails}</p>}
        {errors.phones && <p className="error email-error">{errors.phones}</p>}
        <div className="form-group secret-rules-group">
          <label htmlFor="secretRules">Secret Santa Rules</label>
          <textarea
            id="secretRules"
            name="secretRules"
            rows="5"
            placeholder={
              'Spending limit, handmade vs. purchased gifts, wrapping themes, forbidden categories, code of conduct, etc.'
            }
            value={secretSantaRules}
            onChange={(event) => setSecretSantaRules(event.target.value)}
          />
          <small className="input-help">
            Share spending limits, gift expectations, wrapping requests, or festive reminders. Leave
            blank if there are no special rules.
          </small>
        </div>
        <button type="submit" className="primary" disabled={!isValid}>
          Start the Draw!
        </button>
      </form>
    </motion.main>
  );
}
