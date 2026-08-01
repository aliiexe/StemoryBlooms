"use client";

import { Mail, Smartphone, MapPin } from 'lucide-react';
import styles from './page.module.css';

export default function ContactPage() {
  return (
    <main className={styles.container}>
      <div className={styles.splitLayout}>
        <div className={styles.infoSection}>
          <h1 className={styles.title}>Let's Talk Blooms.</h1>
          <p className={styles.description}>
            Have a question about our custom bouquets, wholesale orders, or shipping? 
            Reach out to us and we'll get back to you as soon as possible.
          </p>
          
          <div className={styles.contactMethods}>
            <div className={styles.method}>
              <div className={styles.iconWrapper}>
                <Mail size={24} />
              </div>
              <div className={styles.methodDetails}>
                <span className={styles.methodLabel}>Email</span>
                <span className={styles.methodValue}>hello@stemoryblooms.com</span>
              </div>
            </div>
            
            <div className={styles.method}>
              <div className={styles.iconWrapper}>
                <Smartphone size={24} />
              </div>
              <div className={styles.methodDetails}>
                <span className={styles.methodLabel}>WhatsApp</span>
                <span className={styles.methodValue}>+212 600 000 000</span>
              </div>
            </div>
            
            <div className={styles.method}>
              <div className={styles.iconWrapper}>
                <MapPin size={24} />
              </div>
              <div className={styles.methodDetails}>
                <span className={styles.methodLabel}>Studio</span>
                <span className={styles.methodValue}>Casablanca, Morocco</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="firstName" className={styles.label}>First Name</label>
                  <input type="text" id="firstName" name="firstName" className={styles.input} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="lastName" className={styles.label}>Last Name</label>
                  <input type="text" id="lastName" name="lastName" className={styles.input} required />
                </div>
              </div>
              
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input type="email" id="email" name="email" className={styles.input} required />
              </div>
              
              <div className={styles.field}>
                <label htmlFor="message" className={styles.label}>Message</label>
                <textarea id="message" name="message" className={styles.textarea} required></textarea>
              </div>
              
              <button type="submit" className={styles.submitBtn}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
