import { useEffect, useRef, useState } from 'react';

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script';
let recaptchaLoaderPromise = null;

const loadRecaptchaScript = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaLoaderPromise) {
    return recaptchaLoaderPromise;
  }

  recaptchaLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.grecaptcha));
      existingScript.addEventListener('error', (event) => reject(event));
      return;
    }

    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = (event) => {
      recaptchaLoaderPromise = null;
      reject(event);
    };

    document.body.appendChild(script);
  });

  return recaptchaLoaderPromise;
};

export default function RecaptchaCheckbox({ siteKey, onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onVerify, onExpire });
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    callbacksRef.current.onVerify = onVerify;
    callbacksRef.current.onExpire = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') {
      return undefined;
    }

    let isUnmounted = false;

    const initialize = async () => {
      try {
        const grecaptcha = await loadRecaptchaScript();

        if (!grecaptcha || isUnmounted) {
          return;
        }

        grecaptcha.ready(() => {
          if (isUnmounted || !containerRef.current) {
            return;
          }

          if (widgetIdRef.current !== null) {
            grecaptcha.reset(widgetIdRef.current);
            return;
          }

          widgetIdRef.current = grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              callbacksRef.current.onVerify?.(token);
            },
            'expired-callback': () => {
              callbacksRef.current.onExpire?.();
            },
            'error-callback': () => {
              callbacksRef.current.onExpire?.();
            }
          });
        });
      } catch (error) {
        console.error('Failed to load reCAPTCHA script', error);
        recaptchaLoaderPromise = null;
        if (!isUnmounted) {
          setLoadError('Unable to load reCAPTCHA. Please refresh the page.');
        }
      }
    };

    initialize();

    return () => {
      isUnmounted = true;
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="recaptcha-wrapper">
      <div ref={containerRef} />
      {loadError && <p className="error">{loadError}</p>}
    </div>
  );
}
