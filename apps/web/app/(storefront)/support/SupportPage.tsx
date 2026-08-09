import Link from 'next/link';

type SupportPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  panels: Array<{ title: string; body: string }>;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
};

export default function SupportPage({ eyebrow, title, intro, panels, bullets = [], ctaHref = '/contact', ctaLabel = 'Contact us' }: SupportPageProps) {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--surface-primary)', padding: '6rem 1.25rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <section style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, #5F7654 100%)', color: '#FDFBF7', borderRadius: '32px', padding: '4rem 2rem', boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
          <p style={{ margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '0.75rem', color: '#EAE6DF' }}>{eyebrow}</p>
          <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.02, fontWeight: 400, margin: 0, maxWidth: '12ch' }}>{title}</h1>
          <p style={{ maxWidth: '680px', margin: '1.25rem 0 0', fontSize: '1.1rem', lineHeight: 1.8, color: '#F3EEE6' }}>{intro}</p>
        </section>

        {bullets.length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {bullets.map((bullet) => (
              <div key={bullet} style={{ padding: '1rem 1.15rem', borderRadius: '18px', backgroundColor: '#FBF8F1', border: '1px solid #E5DCCF', color: '#4E473F', boxShadow: '0 12px 30px rgba(0,0,0,0.03)' }}>
                {bullet}
              </div>
            ))}
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {panels.map((panel) => (
            <article key={panel.title} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #EAE6DF', padding: '1.5rem', boxShadow: '0 16px 40px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontFamily: 'var(--font-editorial)', fontWeight: 400, fontSize: '1.7rem', margin: '0 0 0.85rem', color: 'var(--brand-primary)' }}>{panel.title}</h2>
              <p style={{ margin: 0, color: '#5A5551', lineHeight: 1.75 }}>{panel.body}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Link href={ctaHref} style={{ display: 'inline-block', padding: '1rem 2rem', borderRadius: '999px', backgroundColor: 'var(--brand-primary)', color: '#FDFBF7', textDecoration: 'none', fontWeight: 600, boxShadow: '0 14px 30px rgba(0,0,0,0.08)' }}>{ctaLabel}</Link>
        </section>
      </div>
    </main>
  );
}