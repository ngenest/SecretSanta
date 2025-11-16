export default function SeoContent() {
  return (
    <section className="seo-section" aria-labelledby="seo-overview-title">
      <div className="seo-section__content">
        <h2 id="seo-overview-title">Plan unforgettable Secret Santa draws</h2>
        <p className="seo-section__lede">
          Secret Santa Magic combines a playful drawing experience with the practical tools organizers need: exclusions for
          couples or coworkers, customizable rules, and optional participant notifications so everyone gets their giftee on
          time.
        </p>
        <div className="seo-grid" role="list">
          <article className="seo-card" role="listitem">
            <h3>Automatic Secret Santa pairing</h3>
            <p>
              Build draws for families, friends, or distributed teams. We instantly generate fair assignments while honoring
              your rules, keeping partners apart, and avoiding duplicate matches.
            </p>
          </article>
          <article className="seo-card" role="listitem">
            <h3>Share results securely</h3>
            <p>
              Export a confirmation summary, keep a copy of every pairing, and let us email participants their giftee without
              revealing the full list.
            </p>
          </article>
          <article className="seo-card" role="listitem">
            <h3>Holiday-ready notifications</h3>
            <p>
              Upgrade to automated SMS or email alerts that include draw details, organizer contact information, and optional
              gift budget notes.
            </p>
          </article>
        </div>
        <div className="seo-cta">
          <h3>Perfect for every kind of gift exchange</h3>
          <ul>
            <li>Secret Santa draws for workplaces, school clubs, and remote teams</li>
            <li>Family gift exchanges with couple-aware matching</li>
            <li>Last-minute holiday raffles, white elephant alternatives, and Pollyanna gifts</li>
            <li>Automated reminders so no one forgets to buy a present</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
