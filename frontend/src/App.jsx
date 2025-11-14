import { useEffect, useState } from 'react';
import EventSetupScreen from './components/EventSetupScreen.jsx';
import DrawAnimationScreen from './components/DrawAnimationScreen.jsx';
import ConfirmationScreen from './components/ConfirmationScreen.jsx';
import Header from './components/Header.jsx';
import ProgressDots from './components/ProgressDots.jsx';
import PaymentScreen from './components/PaymentScreen.jsx';
import { createDraw, createNotificationCheckoutSession, sendNotifications } from './lib/api';

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
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const [checkoutSessionId, setCheckoutSessionId] = useState('');
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false);
  const [completedCheckoutSessionId, setCompletedCheckoutSessionId] = useState('');
  const [lastPaymentIntentId, setLastPaymentIntentId] = useState('');

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
    setCheckoutClientSecret('');
    setCheckoutSessionId('');
    setIsCreatingCheckoutSession(false);
    setCompletedCheckoutSessionId('');
    setLastPaymentIntentId('');
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
    setCheckoutClientSecret('');
    setCheckoutSessionId('');
    setIsCreatingCheckoutSession(false);
    setCompletedCheckoutSessionId('');
    setLastPaymentIntentId('');
  };

  const triggerNotificationSend = async (sessionId, paymentIntentId) => {
    if (!notificationBatchId) {
      setNotificationError(
        'We could not locate the notification batch. Please restart the draw and try again.'
      );
      return;
    }

    if (!sessionId) {
      setNotificationError(
        'We could not locate a completed checkout session. Please try submitting payment again.'
      );
      return;
    }

    setIsSendingNotifications(true);
    setNotificationError('');

    try {
      const response = await sendNotifications(notificationBatchId, sessionId);

      setShowNotificationPrompt(false);
      setScreenIndex(SCREENS.confirmation);
      setNotificationBatchId(null);
      setCompletedCheckoutSessionId('');
      setLastPaymentIntentId(response?.paymentIntentId || paymentIntentId || '');
    } catch (error) {
      console.error(error);
      const message = error.message || 'Unable to send notifications. Please try again.';
      setNotificationError(message);
      setCompletedCheckoutSessionId(sessionId);
      if (paymentIntentId) {
        setLastPaymentIntentId(paymentIntentId);
      }
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
    setIsCreatingCheckoutSession(true);

    try {
      const response = await createNotificationCheckoutSession({
        batchId: notificationBatchId,
        eventName: eventData.name,
        organizer: eventData.organizer,
      });

      if (!response?.clientSecret || !response?.sessionId) {
        throw new Error('Unable to start the checkout session.');
      }

      setCheckoutClientSecret(response.clientSecret);
      setCheckoutSessionId(response.sessionId);
      setCompletedCheckoutSessionId('');
      setLastPaymentIntentId('');
      setShowNotificationPrompt(false);
      setScreenIndex(SCREENS.payment);
      return true;
    } catch (error) {
      console.error(error);
      const message = error?.message || 'Unable to start the payment process.';
      setNotificationError(message);
      return false;
    } finally {
      setIsCreatingCheckoutSession(false);
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
    setCheckoutClientSecret('');
    setCheckoutSessionId('');
    setIsCreatingCheckoutSession(false);
    setCompletedCheckoutSessionId('');
    setLastPaymentIntentId('');
  };

  const resetToDrawAfterPayment = (errorMessage = '') => {
    setCheckoutClientSecret('');
    setCheckoutSessionId('');
    setCompletedCheckoutSessionId('');
    setLastPaymentIntentId('');
    setIsCreatingCheckoutSession(false);
    setIsSendingNotifications(false);
    setScreenIndex(SCREENS.draw);
    setShowNotificationPrompt(isAnimationComplete && areAssignmentsReady);
    setNotificationError(errorMessage);
  };

  const handlePaymentCanceled = () => {
    resetToDrawAfterPayment('');
  };

  const handlePaymentError = (message) => {
    const fallbackMessage =
      typeof message === 'string' && message.trim().length > 0
        ? message
        : 'We were unable to complete the payment. Please try again.';
    resetToDrawAfterPayment(fallbackMessage);
  };

  const handlePaymentSuccess = ({ sessionId, paymentIntentId } = {}) => {
    if (!sessionId) {
      return;
    }

    setCompletedCheckoutSessionId(sessionId);
    setCheckoutClientSecret('');
    setCheckoutSessionId('');
    if (paymentIntentId) {
      setLastPaymentIntentId(paymentIntentId);
    }
    triggerNotificationSend(sessionId, paymentIntentId);
  };

  const handleRetryNotifications = (sessionId, paymentIntentId) => {
    const resolvedSessionId = sessionId || completedCheckoutSessionId;

    if (!resolvedSessionId) {
      setNotificationError(
        'We could not locate a completed payment. Please try submitting payment again.'
      );
      return;
    }

    triggerNotificationSend(resolvedSessionId, paymentIntentId || lastPaymentIntentId);
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
        paymentSetupInProgress={isCreatingCheckoutSession}
        notificationError={notificationError}
        onCancelDrawConfirmed={handleDrawCancellation}
      />
    )}
      {screenIndex === SCREENS.payment && (
        <PaymentScreen
          clientSecret={checkoutClientSecret}
          checkoutSessionId={checkoutSessionId}
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
          completedCheckoutSessionId={completedCheckoutSessionId}
          paymentIntentId={lastPaymentIntentId}
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
