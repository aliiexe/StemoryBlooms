import styles from './page.module.css';

const REVIEWS = [
  {
    id: 1,
    name: 'Salma M.',
    date: '2 weeks ago',
    text: 'Absolutely stunning! The quality is amazing and it looks incredibly realistic.',
  },
  {
    id: 2,
    name: 'Youssef K.',
    date: '1 month ago',
    text: 'Bought this as an anniversary gift. She loved it — keeps it forever.',
  },
  {
    id: 3,
    name: 'Imane T.',
    date: '2 months ago',
    text: 'The custom bouquet builder was so fun. Final result exceeded expectations.',
  },
  {
    id: 4,
    name: 'Othmane R.',
    date: '3 months ago',
    text: 'Beautiful craftsmanship. Lots of love in these.',
  },
  {
    id: 5,
    name: 'Zineb H.',
    date: '4 months ago',
    text: 'Ordered the lavender bunch — soft, beautiful touch to my room.',
  },
  {
    id: 6,
    name: 'Ayoub B.',
    date: '5 months ago',
    text: 'Great customer service and fast delivery. Premium packaging.',
  }
];

function StarIcon() {
  return (
    <svg className={styles.star} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function ReviewsPage() {
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Love</h1>
        <p className={styles.subtitle}>Hear what our wonderful customers have to say about their everlasting blooms.</p>
      </div>

      <div className={styles.grid}>
        {REVIEWS.map((review) => (
          <div key={review.id} className={styles.card}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} />
              ))}
            </div>
            <p className={styles.quote}>"{review.text}"</p>
            <div className={styles.footer}>
              <span className={styles.name}>{review.name}</span>
              <span className={styles.date}>{review.date}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
