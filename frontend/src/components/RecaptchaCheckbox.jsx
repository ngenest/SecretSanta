import { useCallback, useEffect, useRef, useState } from 'react';
import { RECAPTCHA_ACTION, RECAPTCHA_TOKEN_TTL_MS } from '../config/recaptcha';

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-enterprise-script';
let recaptchaLoaderPromise = null;
let recaptchaLoaderSiteKey = '';

const DEFAULT_PROMPT_MESSAGE = 'Click verify to confirm you are not a robot.';

const loadRecaptchaScript = (siteKey) => {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.grecaptcha?.enterprise) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaLoaderPromise && recaptchaLoaderSiteKey === siteKey) {
    return recaptchaLoaderPromise;
  }

  recaptchaLoaderSiteKey = siteKey;
  recaptchaLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

    const resolveIfReady = () => {
      if (window.grecaptcha?.enterprise) {
        resolve(window.grecaptcha);
        return true;
      }
      return false;
    };

    if (existingScript) {
      if (!resolveIfReady()) {
        existingScript.addEventListener('load', () => {
          if (!resolveIfReady()) {
            recaptchaLoaderPromise = null;
            reject(new Error('reCAPTCHA Enterprise API not available after loading script.'));
          }
        });
        existingScript.addEventListener('error', (event) => {
          recaptchaLoaderPromise = null;
          reject(event);
        });
      } else {
        resolve(window.grecaptcha);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!resolveIfReady()) {
        recaptchaLoaderPromise = null;
        reject(new Error('reCAPTCHA Enterprise API not available after loading script.'));
      }
    };
    script.onerror = (event) => {
      recaptchaLoaderPromise = null;
      reject(event);
    };

    document.head.appendChild(script);
  });

  return recaptchaLoaderPromise;
};

export default function RecaptchaCheckbox({ siteKey, onVerify, onExpire }) {
  const callbacksRef = useRef({ onVerify, onExpire });
  const tokenTimeoutRef = useRef(null);
  const hasTokenRef = useRef(false);
  const isExecutingRef = useRef(false);

  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(DEFAULT_PROMPT_MESSAGE);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    callbacksRef.current.onVerify = onVerify;
    callbacksRef.current.onExpire = onExpire;
  }, [onVerify, onExpire]);

  const clearTimer = useCallback(() => {
    if (tokenTimeoutRef.current !== null) {
      clearTimeout(tokenTimeoutRef.current);
      tokenTimeoutRef.current = null;
    }
  }, []);

  const expireVerification = useCallback(
    (message) => {
      clearTimer();
      if (hasTokenRef.current) {
        hasTokenRef.current = false;
        callbacksRef.current.onExpire?.();
      }
      setStatus('expired');
      setStatusMessage(message || DEFAULT_PROMPT_MESSAGE);
      setErrorMessage('');
    },
    [clearTimer]
  );

  const executeVerification = useCallback(async () => {
    if (!siteKey || typeof window === 'undefined') {
      return;
    }

    if (isExecutingRef.current) {
      return;
    }

    isExecutingRef.current = true;
    setIsExecuting(true);
    setStatus('processing');
    setStatusMessage('Verifying reCAPTCHA…');
    setErrorMessage('');

    try {
      const grecaptcha = await loadRecaptchaScript(siteKey);
      if (!grecaptcha?.enterprise) {
        throw new Error('reCAPTCHA Enterprise API unavailable.');
      }

      await new Promise((resolve) => grecaptcha.enterprise.ready(resolve));
      const token = await grecaptcha.enterprise.execute(siteKey, { action: RECAPTCHA_ACTION });
      if (!token) {
        throw new Error('No token returned from reCAPTCHA.');
      }

      hasTokenRef.current = true;
      callbacksRef.current.onVerify?.(token);
      setStatus('verified');
      setStatusMessage('Verification completed.');
      setErrorMessage('');

      clearTimer();
      tokenTimeoutRef.current = window.setTimeout(() => {
        expireVerification('Verification expired. Please verify again.');
      }, Math.max(1000, RECAPTCHA_TOKEN_TTL_MS));
    } catch (error) {
      console.error('Failed to verify reCAPTCHA.', error);
      if (hasTokenRef.current) {
        expireVerification('Verification expired. Please verify again.');
      } else {
        setStatus('error');
        setStatusMessage(DEFAULT_PROMPT_MESSAGE);
      }
      setErrorMessage('Unable to complete reCAPTCHA verification. Please try again.');
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
    }
  }, [siteKey, clearTimer, expireVerification]);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') {
      return undefined;
    }

    let isUnmounted = false;

    const preload = async () => {
      try {
        await loadRecaptchaScript(siteKey);
        if (isUnmounted) {
          return;
        }
        executeVerification();
      } catch (error) {
        console.error('Failed to load reCAPTCHA script', error);
        if (!isUnmounted) {
          setStatus('error');
          setStatusMessage('Unable to load reCAPTCHA.');
          setErrorMessage('Unable to load reCAPTCHA. Please refresh the page.');
        }
      }
    };

    preload();

    return () => {
      isUnmounted = true;
      clearTimer();
      hasTokenRef.current = false;
    };
  }, [siteKey, executeVerification, clearTimer]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="recaptcha-wrapper">
      <div className={`recaptcha-status ${status}`}>
        <div className="recaptcha-status-header">
          <span className="recaptcha-indicator" aria-hidden="true" />
          <span className="recaptcha-status-title">
            {status === 'verified' ? 'You are verified' : 'Verify you are not a robot'}
          </span>
        </div>
        <p className="recaptcha-status-message">{statusMessage}</p>
        <button
          type="button"
          className="recaptcha-button"
          onClick={executeVerification}
          disabled={isExecuting}
        >
          {isExecuting
            ? 'Verifying…'
            : status === 'verified'
            ? 'Refresh verification'
            : 'Verify reCAPTCHA'}
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  );
}
