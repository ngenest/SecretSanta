import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AcknowledgementLanding from './components/AcknowledgementLanding.jsx';
import TermsPage from './components/TermsPage.jsx';
import './styles.css';

const isAcknowledgementRoute = () => {
  try {
    const { pathname } = new URL(window.location.href);
    return pathname === '/acknowledgement' || pathname === '/acknowledgement/';
  } catch (error) {
    return false;
  }
};

const isTermsRoute = () => {
  try {
    const { pathname } = new URL(window.location.href);
    return pathname === '/terms' || pathname === '/terms/';
  } catch (error) {
    return false;
  }
};

let rootComponent = <App />;

if (isAcknowledgementRoute()) {
  rootComponent = <AcknowledgementLanding />;
} else if (isTermsRoute()) {
  rootComponent = <TermsPage />;
}
ReactDOM.createRoot(document.getElementById('root')).render(rootComponent);
