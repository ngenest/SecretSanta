import { useEffect, useState } from 'react';
import EventSetupScreen from './components/EventSetupScreen.jsx';
import DrawAnimationScreen from './components/DrawAnimationScreen.jsx';
import ConfirmationScreen from './components/ConfirmationScreen.jsx';
import Header from './components/Header.jsx';
import ProgressDots from './components/ProgressDots.jsx';
import { createDraw, sendNotifications } from './lib/api';

const SCREENS = {
  setup: 0,
  draw: 1,
  confirmation: 2
};

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

const createDefaultEvent = () => ({
  name: '',
  date: '',
  exchangeType: '',
  otherGroupType: '',
  drawMode: 'couples',
  organizer: {
    name: '',
    email: '',
    phone: ''
  },
  secretSantaRules: '',
  couples: Array.from({ length: 4 }, (_, idx) => ({
    id: idx,
    participants: [createParticipant(), createParticipant()]
  })),
  individuals: Array.from({ length: 6 }, () => createParticipant())
});

export default function App() {
  const [screenIndex, setScreenIndex] = useState(SCREENS.setup);
  const [eventData, setEventData] = useState(createDefaultEvent);
  const [assignments, setAssignments] = useState([]);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [areAssignmentsReady, setAreAssignmentsReady] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationBatchId, setNotificationBatchId] = useState(null);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [drawResult, setDrawResult] = useState(null);

  useEffect(() => {
    if (
      screenIndex === SCREENS.draw &&
      isAnimationComplete &&
      areAssignmentsReady
    ) {
      setShowNotificationPrompt(true);
    }
  }, [areAssignmentsReady, isAnimationComplete, screenIndex]);

  const handleEventSubmit = async (payload) => {
    setEventData(payload);
    setScreenIndex(SCREENS.draw);
    setIsAnimationComplete(false);
    setAreAssignmentsReady(false);
    setShowNotificationPrompt(false);
    setNotificationBatchId(null);
    setNotificationError('');
    setIsSendingNotifications(false);
    try {
      setIsLoading(true);
      const result = await createDraw(payload);
      setAssignments(result.assignments);
      setAreAssignmentsReady(true);
      setNotificationBatchId(result.notificationBatchId || null);
      setDrawResult(result); // Store the draw result
      setScreenIndex('notification-confirmation'); // Move to notification confirmation screen (Step 2)
    } catch (error) {
      console.error('Error:', error);
      setScreenIndex(SCREENS.setup);
      setIsAnimationComplete(false);
      setAreAssignmentsReady(false);
      setShowNotificationPrompt(false);
      setNotificationBatchId(null);
      setNotificationError('');
      setIsSendingNotifications(false);
      alert('Unable to complete draw. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setAssignments([]);
    setEventData(createDefaultEvent());
    setScreenIndex(SCREENS.setup);
    setIsAnimationComplete(false);
    setAreAssignmentsReady(false);
    setShowNotificationPrompt(false);
    setNotificationBatchId(null);
    setNotificationError('');
    setIsSendingNotifications(false);
  };

  const handleNotificationConfirmed = async () => {
    if (!notificationBatchId) {
      setNotificationError(
        'We could not locate the notification batch. Please restart the draw and try again.'
      );
      return false;
    }

    setIsSendingNotifications(true);
    setNotificationError('');

    try {
      const response = await sendNotifications(notificationBatchId);

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message = errorPayload?.error || 'Failed to send notifications.';
        throw new Error(message);
      }

      setShowNotificationPrompt(false);
      setScreenIndex(SCREENS.confirmation);
      setNotificationBatchId(null);
      return true;
    } catch (error) {
      console.error(error);
      setNotificationError(error.message || 'Unable to send notifications. Please try again.');
      return false;
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const handleSendNotifications = async () => {
    try {
      setIsLoading(true);
      await sendNotifications(notificationBatchId);
      
      // Now move to success screen (Step 3)
      setScreenIndex('success');
      
    } catch (error) {
      console.error('Error sending notifications:', error);
      setNotificationError('Failed to send notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    // Move to success screen without sending
    setScreenIndex('success');
  };

  const handleDrawCancellation = () => {
    setShowNotificationPrompt(false);
    setAssignments([]);
    setScreenIndex(SCREENS.setup);
    setIsAnimationComplete(false);
    setAreAssignmentsReady(false);
    setNotificationBatchId(null);
    setNotificationError('');
    setIsSendingNotifications(false);
  };

  const participantList =
    eventData.drawMode === 'individuals'
      ? Array.isArray(eventData.individuals)
        ? eventData.individuals
        : []
      : (eventData.couples || []).flatMap((couple) => couple.participants || []);

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
          participants={participantList}
          onComplete={() => setIsAnimationComplete(true)}
          notificationPromptVisible={showNotificationPrompt}
          onNotificationConfirm={handleNotificationConfirmed}
          notificationsSending={isSendingNotifications}
          notificationError={notificationError}
          onCancelDrawConfirmed={handleDrawCancellation}
        />
      )}
      {screenIndex === SCREENS.confirmation && (
        <ConfirmationScreen
          eventName={eventData.name}
          eventDate={eventData.date}
          drawMode={eventData.drawMode}
          secretSantaRules={eventData.secretSantaRules}
          participants={participantList}
          assignments={assignments}
          onRestart={handleRestart}
        />
      )}
      {screenIndex === 'notification-confirmation' && (
        <div>
          <h2>Notification Confirmation</h2>
          <p>
            Your draw has been completed. Would you like to send notifications
            to the participants?
          </p>
          <button onClick={handleSendNotifications} disabled={isLoading}>
            Yes, send notifications
          </button>
          <button onClick={handleSkipNotifications} disabled={isLoading}>
            Skip notifications
          </button>
          {notificationError && <p className="error">{notificationError}</p>}
        </div>
      )}
      {screenIndex === 'success' && (
        <div>
          <h2>Success!</h2>
          <p>Your draw was successful, and notifications have been sent.</p>
          <button onClick={handleRestart}>Start a new draw</button>
        </div>
      )}
    </div>
  );
}
