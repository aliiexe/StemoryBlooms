import SupportPage from '../support/SupportPage';

export default function ShippingPage() {
  return (
    <SupportPage
      eyebrow="Support"
      title="Shipping policy"
      intro="We pack orders carefully and coordinate delivery to keep each arrangement looking polished when it arrives."
      bullets={['We prepare each order with secure packaging.', 'Delivery timing depends on destination and order complexity.', 'If timing matters, add a note through the contact form.']}
      panels={[
        { title: 'Packaging', body: 'Each bouquet is packed to protect the shape, color, and finishing details during transit.' },
        { title: 'Delivery timing', body: 'We coordinate delivery based on the destination and order volume. For time-sensitive requests, contact us before placing the order.' },
        { title: 'Order updates', body: 'If we need clarification on delivery details, we’ll reach out using the email provided at checkout or through the contact form.' },
      ]}
      ctaHref="/shop"
      ctaLabel="Continue shopping"
    />
  );
}