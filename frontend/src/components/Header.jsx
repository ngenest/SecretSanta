import { SantaHat } from './SantaHat.jsx';

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <SantaHat />
        <span className="logo-text">Secret Santa Magic</span>
      </div>
    </header>
  );
}
