import { GiftLogo } from './GiftLogo.jsx';

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <GiftLogo />
        <span className="logo-text">Secret Santa Magic</span>
      </div>
    </header>
  );
}
