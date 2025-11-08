import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ParticipantFields from './ParticipantFields.jsx';

const defaultCouples = Array.from({ length: 4 }, (_, idx) => ({
  id: idx
}));

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
  const [participants, setParticipants] = useState(
    initialEvent.couples ||
      defaultCouples.map((couple) => ({
        ...couple,
        participants: [
          { name: '', email: '' },
          { name: '', email: '' }
        ]
      }))
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!eventDate) {
      const year = new Date().getFullYear();
      setEventDate(`${year}-12-24`);
    }
  }, [eventDate]);

  const flatParticipants = useMemo(
    () => participants.flatMap((couple) => couple.participants),
    [participants]
  );

  const emails = flatParticipants.map((p) => p.email.trim()).filter(Boolean);
  const uniqueEmails = new Set(emails);

  const isValid =
    exchangeType.trim().length > 0 &&
    (exchangeType !== 'other' || otherGroupType.trim().length > 0) &&
    eventName.trim().length > 0 &&
    eventDate.trim().length > 0 &&
    flatParticipants.every((p) => p.name.trim() && p.email.trim()) &&
    emails.length === uniqueEmails.size;

  const updateParticipant = (coupleIndex, participantIndex, updates) => {
    setErrors((prev) => ({ ...prev, [`participant-${coupleIndex}-${participantIndex}`]: undefined }));
    setParticipants((prev) =>
      prev.map((couple, idx) => {
        if (idx !== coupleIndex) return couple;
        const nextParticipants = couple.participants.map((person, pIdx) =>
          pIdx === participantIndex ? { ...person, ...updates } : person
        );
        return { ...couple, participants: nextParticipants };
      })
    );
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
      if (emails.length !== uniqueEmails.size)
        nextErrors.emails = 'Participant emails must be unique';
      flatParticipants.forEach((p, index) => {
        if (!p.name.trim() || !p.email.trim()) {
          nextErrors[`participant-${index}`] = 'Name and email required';
        }
      });
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: eventName,
      date: eventDate,
      exchangeType,
      otherGroupType: exchangeType === 'other' ? otherGroupType.trim() : '',
      couples: participants.map((couple) => ({
        id: couple.id,
        participants: couple.participants.map(({ name, email }) => ({ name, email }))
      }))
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
        <div className="accordion">
          {participants.map((couple, idx) => (
            <ParticipantFields
              key={couple.id}
              index={idx}
              couple={couple}
              onChange={updateParticipant}
            />
          ))}
        </div>
        {errors.emails && <p className="error email-error">{errors.emails}</p>}
        <button type="submit" className="primary" disabled={!isValid}>
          Start the Draw!
        </button>
      </form>
    </motion.main>
  );
}
