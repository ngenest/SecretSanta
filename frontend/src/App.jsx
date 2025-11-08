import { useState } from 'react';
import EventSetupScreen from './components/EventSetupScreen.jsx';
import DrawAnimationScreen from './components/DrawAnimationScreen.jsx';
import ConfirmationScreen from './components/ConfirmationScreen.jsx';
import Header from './components/Header.jsx';
import ProgressDots from './components/ProgressDots.jsx';

const SCREENS = {
  setup: 0,
  draw: 1,
  confirmation: 2
};

const createDefaultEvent = () => ({
  name: '',
  date: '',
  couples: Array.from({ length: 4 }, (_, idx) => ({
    id: idx,
    participants: [
      { name: '', email: '' },
      { name: '', email: '' }
    ]
  }))
});

export default function App() {
  const [screenIndex, setScreenIndex] = useState(SCREENS.setup);
  const [eventData, setEventData] = useState(createDefaultEvent);
  const [assignments, setAssignments] = useState([]);

  const handleEventSubmit = async (payload) => {
    setEventData(payload);
    setScreenIndex(SCREENS.draw);
    try {
      const response = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to perform draw');
      }
      const data = await response.json();
      setAssignments(data.assignments);
      setScreenIndex(SCREENS.confirmation);
    } catch (error) {
      console.error(error);
      setScreenIndex(SCREENS.setup);
      alert('Unable to complete draw. Please try again.');
    }
  };

  const handleRestart = () => {
    setAssignments([]);
    setEventData(createDefaultEvent());
    setScreenIndex(SCREENS.setup);
  };

  const participantNames = eventData.couples
    .flatMap((couple) => couple.participants)
    .map((participant) => participant.name || 'Participant');

  return (
    <div className={`app screen-${screenIndex}`}>
      <Header />
      <ProgressDots activeIndex={screenIndex} />
      {screenIndex === SCREENS.setup && (
        <EventSetupScreen
          onSubmit={handleEventSubmit}
          initialEvent={eventData}
        />
      )}
      {screenIndex === SCREENS.draw && (
        <DrawAnimationScreen
          eventName={eventData.name}
          participantNames={participantNames}
          onComplete={() => setScreenIndex(SCREENS.confirmation)}
        />
      )}
      {screenIndex === SCREENS.confirmation && (
        <ConfirmationScreen
          eventName={eventData.name}
          eventDate={eventData.date}
          participants={eventData.couples.flatMap((c) => c.participants)}
          assignments={assignments}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
