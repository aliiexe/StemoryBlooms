import React from 'react';

export default function ContactPage() {
  return (
    <main style={{ backgroundColor: 'var(--surface-primary)', minHeight: '100vh', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '4rem', borderRadius: '24px', border: '1px solid #EAE6DF', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '3rem', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
            Get in Touch
          </h1>
          <p style={{ color: '#5A5551', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Have a question about an order, a custom arrangement, or a collaboration? We'd love to hear from you.
          </p>
        </header>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>First Name</label>
              <input type="text" required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>Last Name</label>
              <input type="text" required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>Email Address</label>
            <input type="email" required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>Subject</label>
            <select required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }}>
              <option value="">Select a subject...</option>
              <option value="order">Question about an order</option>
              <option value="custom">Custom bouquet inquiry</option>
              <option value="press">Press / Collaboration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#3A3531', fontWeight: 500 }}>Message</label>
            <textarea required rows={6} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7', resize: 'vertical' }}></textarea>
          </div>

          <button 
            type="button" 
            style={{ 
              marginTop: '1rem',
              padding: '1.25rem', 
              backgroundColor: 'var(--brand-primary)', 
              color: '#FDFBF7', 
              border: 'none', 
              borderRadius: '50px', 
              fontSize: '1rem', 
              fontWeight: 500, 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.preventDefault();
              alert("Thank you for reaching out! A mock email was successfully sent. We will get back to you soon.");
            }}
          >
            Send Message
          </button>

        </form>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #EAE6DF', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '3rem' }}>
          <div>
            <h4 style={{ color: '#3A3531', marginBottom: '0.5rem' }}>Email</h4>
            <a href="mailto:hello@stemoryblooms.com" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>hello@stemoryblooms.com</a>
          </div>
          <div>
            <h4 style={{ color: '#3A3531', marginBottom: '0.5rem' }}>Social</h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="#" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>Instagram</a>
              <a href="#" style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>TikTok</a>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
