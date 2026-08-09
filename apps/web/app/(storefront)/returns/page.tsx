import SupportPage from '../support/SupportPage';

export default function ReturnsPage() {
  return (
    <SupportPage
      eyebrow="Support"
      title="Returns and replacements"
      intro="Because our flowers are handcrafted, we review return or replacement requests on a case-by-case basis."
      bullets={['Please contact us as soon as possible if something arrives damaged.', 'Include a photo and your order details when reaching out.', 'Custom pieces may require a different resolution path.']}
      panels={[
        { title: 'Damaged on arrival', body: 'If an item is damaged during delivery, send us a photo and your order number so we can review the issue quickly.' },
        { title: 'Custom orders', body: 'Custom arrangements are made specifically for your request, so we handle those with a case-by-case resolution process.' },
        { title: 'Need help fast?', body: 'Reach out through the contact page and we’ll reply using the same inbox the site notifications use.' },
      ]}
      ctaHref="/contact"
      ctaLabel="Contact support"
    />
  );
}