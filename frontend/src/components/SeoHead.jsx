import { useEffect, useMemo } from 'react';

const OG_IMAGE_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'1200'%20height%3D'630'%20role%3D'img'%20aria-label%3D'Secret%20Santa%20Magic%20-%20Instant%20Secret%20Santa%20Draws'%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3ClinearGradient%20id%3D'bg'%20x1%3D'0'%20y1%3D'0'%20x2%3D'0'%20y2%3D'1'%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D'%230f1531'%20offset%3D'0%25'%20%2F%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D'%23162045'%20offset%3D'50%25'%20%2F%3E%0A%20%20%20%20%20%20%3Cstop%20stop-color%3D'%230f1531'%20offset%3D'100%25'%20%2F%3E%0A%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%3C%2Fdefs%3E%0A%20%20%3Crect%20width%3D'1200'%20height%3D'630'%20fill%3D'url(%23bg)'%20%2F%3E%0A%20%20%3Ccircle%20cx%3D'1000'%20cy%3D'140'%20r%3D'120'%20fill%3D'%23f95e9c'%20opacity%3D'0.2'%20%2F%3E%0A%20%20%3Ccircle%20cx%3D'220'%20cy%3D'510'%20r%3D'140'%20fill%3D'%233dd6ff'%20opacity%3D'0.15'%20%2F%3E%0A%20%20%3Ctext%20x%3D'90'%20y%3D'210'%20fill%3D'%23f7f0ff'%20font-family%3D'%22Fredoka%20One%22%2C%20%22Montserrat%22%2C%20sans-serif'%20font-size%3D'82'%20font-weight%3D'700'%3ESecret%20Santa%20Magic%3C%2Ftext%3E%0A%20%20%3Ctext%20x%3D'90'%20y%3D'290'%20fill%3D'%23dfe8ff'%20font-family%3D'Roboto%2C%20%22Helvetica%20Neue%22%2C%20sans-serif'%20font-size%3D'38'%3EInstant%20draws%2C%20exclusions%2C%20and%20notifications%3C%2Ftext%3E%0A%20%20%3Ctext%20x%3D'90'%20y%3D'360'%20fill%3D'%23c2d3ff'%20font-family%3D'Roboto%2C%20%22Helvetica%20Neue%22%2C%20sans-serif'%20font-size%3D'30'%3ERun%20unforgettable%20gift%20exchanges%20for%20families%2C%20friends%2C%20and%20teams.%3C%2Ftext%3E%0A%20%20%3Crect%20x%3D'90'%20y%3D'400'%20width%3D'420'%20height%3D'70'%20rx%3D'16'%20fill%3D'%23f95e9c'%20%2F%3E%0A%20%20%3Ctext%20x%3D'110'%20y%3D'447'%20fill%3D'%23fffafc'%20font-family%3D'Roboto%2C%20%22Helvetica%20Neue%22%2C%20sans-serif'%20font-size%3D'32'%20font-weight%3D'700'%3EStart%20your%20Secret%20Santa%20draw%3C%2Ftext%3E%0A%3C%2Fsvg%3E";

const SITE_NAME = 'Secret Santa Magic';
const META_DESCRIPTION =
  'Secret Santa Magic helps families, friends, and remote teams run flawless Secret Santa draws with automatic exclusions, instant pairing, and optional notifications.';

const FAQ_ENTRIES = [
  {
    question: 'How do I run a Secret Santa draw online?',
    answer:
      'Enter your participants, choose draw settings like couples or individuals, and let Secret Santa Magic instantly create fair assignments.'
  },
  {
    question: 'Can I avoid pairing partners or coworkers together?',
    answer:
      'Yes. Choose couples mode to keep partners apart or pick individual mode for coworkers and friends while respecting your exclusions.'
  },
  {
    question: 'Does the app handle notifications?',
    answer:
      'Once you confirm payment, Secret Santa Magic emails each participant their giftee with no extra setup required.'
  }
];

export default function SeoHead() {
  const faqStructuredData = useMemo(
    () =>
      FAQ_ENTRIES.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer
        }
      })),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const { origin, pathname, href } = window.location;
    const canonicalUrl = origin ? `${origin}${pathname}` : href;

    const setMetaTag = (key, value, attribute = 'name') => {
      if (!value) return;
      const selector = `meta[${attribute}="${key}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    const setLinkTag = (rel, hrefValue) => {
      if (!hrefValue) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', hrefValue);
    };

    document.title = `${SITE_NAME} | Instant Secret Santa Draws & Notifications`;
    setMetaTag('description', META_DESCRIPTION);
    setMetaTag(
      'keywords',
      'Secret Santa, secret santa generator, online secret santa draw, gift exchange organizer, Christmas raffle, holiday gift swap, remote team secret santa, virtual secret santa'
    );
    setMetaTag('og:title', `${SITE_NAME} | Instant Secret Santa Draws`, 'property');
    setMetaTag('og:description', META_DESCRIPTION, 'property');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('og:site_name', SITE_NAME, 'property');
    setMetaTag('og:url', canonicalUrl, 'property');
    setMetaTag('og:image', OG_IMAGE_DATA_URL, 'property');
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', `${SITE_NAME} | Secret Santa Generator`);
    setMetaTag('twitter:description', META_DESCRIPTION);
    setMetaTag('twitter:image', OG_IMAGE_DATA_URL);
    setLinkTag('canonical', canonicalUrl);

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: canonicalUrl,
          description: META_DESCRIPTION,
          inLanguage: 'en-US',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${canonicalUrl}?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqStructuredData
        }
      ]
    };

    const existingScript = document.querySelector('script[data-id="seo-jsonld"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-id', 'seo-jsonld');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, [faqStructuredData]);

  return null;
}
