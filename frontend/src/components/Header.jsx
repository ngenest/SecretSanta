import { GiftLogo } from './GiftLogo.jsx';

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <GiftLogo />
        <h1 className="logo-text">Secret Santa Magic</h1>
      </div>
    </header>
  );
}
