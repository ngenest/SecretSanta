import { useEffect, useState } from 'react';
import EventSetupScreen from './components/EventSetupScreen.jsx';
import DrawAnimationScreen from './components/DrawAnimationScreen.jsx';
import ConfirmationScreen from './components/ConfirmationScreen.jsx';
import Header from './components/Header.jsx';
import ProgressDots from './components/ProgressDots.jsx';
import PaymentScreen from './components/PaymentScreen.jsx';
import { createDraw, createNotificationPaymentIntent, sendNotifications } from './lib/api';

const SCREENS = {
  setup: 0,
  draw: 1,
  payment: 2,
  confirmation: 3
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
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [completedPaymentIntentId, setCompletedPaymentIntentId] = useState('');

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
    setPaymentIntentClientSecret('');
    setIsCreatingPaymentIntent(false);
    setCompletedPaymentIntentId('');
    try {
      const result = await createDraw(payload);
      setAssignments(result.assignments);
      setAreAssignmentsReady(true);
      setNotificationBatchId(result.notificationBatchId || null);
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
    setPaymentIntentClientSecret('');
    setIsCreatingPaymentIntent(false);
    setCompletedPaymentIntentId('');
  };

  const triggerNotificationSend = async (paymentIntentId) => {
    if (!notificationBatchId) {
      setNotificationError(
        'We could not locate the notification batch. Please restart the draw and try again.'
      );
      return;
    }

    setIsSendingNotifications(true);
    setNotificationError('');

    try {
      await sendNotifications(notificationBatchId, paymentIntentId);

      setShowNotificationPrompt(false);
      setScreenIndex(SCREENS.confirmation);
      setNotificationBatchId(null);
      setCompletedPaymentIntentId('');
    } catch (error) {
      console.error(error);
      const message = error.message || 'Unable to send notifications. Please try again.';
      setNotificationError(message);
      setCompletedPaymentIntentId(paymentIntentId);
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const handleNotificationConfirmed = async () => {
    if (!notificationBatchId) {
      setNotificationError(
        'We could not locate the notification batch. Please restart the draw and try again.'
      );
      return false;
    }

    setNotificationError('');
    setIsCreatingPaymentIntent(true);

    try {
      const response = await createNotificationPaymentIntent({
        batchId: notificationBatchId,
        eventName: eventData.name,
        organizer: eventData.organizer
      });

      setPaymentIntentClientSecret(response.clientSecret);
      setShowNotificationPrompt(false);
      setScreenIndex(SCREENS.payment);
      return true;
    } catch (error) {
      console.error(error);
      const message = error?.message || 'Unable to start the payment process.';
      setNotificationError(message);
      return false;
    } finally {
      setIsCreatingPaymentIntent(false);
    }
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
    setPaymentIntentClientSecret('');
    setIsCreatingPaymentIntent(false);
    setCompletedPaymentIntentId('');
  };

  const handlePaymentCanceled = () => {
    setPaymentIntentClientSecret('');
    setCompletedPaymentIntentId('');
    setNotificationError('');
    setScreenIndex(SCREENS.draw);
    setShowNotificationPrompt(true);
  };

  const handlePaymentError = (message) => {
    if (message) {
      setNotificationError(message);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    if (!paymentIntent?.id) {
      return;
    }

    setCompletedPaymentIntentId(paymentIntent.id);
    setPaymentIntentClientSecret('');
    triggerNotificationSend(paymentIntent.id);
  };

  const handleRetryNotifications = (paymentIntentId) => {
    const intentId = paymentIntentId || completedPaymentIntentId;

    if (!intentId) {
      setNotificationError(
        'We could not locate a completed payment. Please try submitting payment again.'
      );
      return;
    }

    triggerNotificationSend(intentId);
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
          paymentSetupInProgress={isCreatingPaymentIntent}
          notificationError={notificationError}
          onCancelDrawConfirmed={handleDrawCancellation}
        />
      )}
      {screenIndex === SCREENS.payment && (
        <PaymentScreen
          clientSecret={paymentIntentClientSecret}
          organizerName={eventData.organizer?.name}
          organizerEmail={eventData.organizer?.email}
          eventName={eventData.name}
          participants={participantList}
          onCancel={handlePaymentCanceled}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onRetryNotifications={handleRetryNotifications}
          isSendingNotifications={isSendingNotifications}
          notificationError={notificationError}
          completedPaymentIntentId={completedPaymentIntentId}
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
    </div>
  );
}
