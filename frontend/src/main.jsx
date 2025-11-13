import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AcknowledgementLanding from './components/AcknowledgementLanding.jsx';
import './styles.css';

const isAcknowledgementRoute = () => {
  try {
    const { pathname } = new URL(window.location.href);
    return pathname === '/acknowledgement' || pathname === '/acknowledgement/';
  } catch (error) {
    return false;
  }
};

const rootComponent = isAcknowledgementRoute() ? <AcknowledgementLanding /> : <App />;
const appShell = import.meta.env.DEV ? rootComponent : <React.StrictMode>{rootComponent}</React.StrictMode>;

ReactDOM.createRoot(document.getElementById('root')).render(appShell);
