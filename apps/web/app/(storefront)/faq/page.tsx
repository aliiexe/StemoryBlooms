import SupportPage from '../support/SupportPage';

export default function FaqPage() {
  return (
    <SupportPage
      eyebrow="Support"
      title="Frequently asked questions"
      intro="Quick answers to the most common questions about orders, custom bouquets, and aftercare."
      bullets={['Orders are confirmed once checkout is completed.', 'Custom bouquet requests are handled through the custom bouquet flow.', 'We can help with size, color, and occasion matching.']}
      panels={[
        { title: 'How do I place an order?', body: 'Browse the collection, add your bouquet to cart, and complete checkout. If you need something custom, use the custom bouquet page so we can tailor the arrangement.' },
        { title: 'Can I request a custom bouquet?', body: 'Yes. The custom bouquet page is the best place to tell us what occasion, colors, and budget you want. We’ll follow up with options that fit your request.' },
        { title: 'How do I contact support?', body: 'Use the contact page and your message will reach our inbox directly. We also keep the form submissions in the admin messages view.' },
      ]}
      ctaHref="/contact"
      ctaLabel="Ask a question"
    />
  );
}