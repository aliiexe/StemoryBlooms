// Seed seasonal announcement templates
// Run with: npx tsx packages/database/seed-templates.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const templates = [
  {
    name: "Default Stemory",
    slug: "default",
    description: "Soft editorial brand style — ivory background, moss-green text",
    eventType: "CUSTOM",
    previewColor: "#F6F4EC",
    defaultConfig: {
      message: "Flowers made for memories.",
      backgroundColor: "#F6F4EC",
      textColor: "#4A4A4A",
      accentColor: "#C7D3B3",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "default",
    }
  },
  {
    name: "Valentine's Day",
    slug: "valentines",
    description: "Dusty rose, burgundy, ivory and soft lavender. Elegant, not childish.",
    eventType: "SEASONAL",
    previewColor: "#F8E8EE",
    defaultConfig: {
      message: "Flowers that stay, for someone worth remembering 💜",
      backgroundColor: "#F8E8EE",
      textColor: "#6B2D4E",
      accentColor: "#D6CFE6",
      linkColor: "#8B4067",
      animationType: "FADE",
      decorativeAsset: "valentines",
    }
  },
  {
    name: "International Women's Day",
    slug: "womens-day",
    description: "Lavender, deep purple, ivory and soft green.",
    eventType: "SEASONAL",
    previewColor: "#EDE7F6",
    defaultConfig: {
      message: "Celebrating every woman who makes life bloom 💜",
      backgroundColor: "#EDE7F6",
      textColor: "#4527A0",
      accentColor: "#C7D3B3",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "default",
    }
  },
  {
    name: "Mother's Day",
    slug: "mothers-day",
    description: "Dusty rose, blush, cream and sage.",
    eventType: "SEASONAL",
    previewColor: "#FCE4EC",
    defaultConfig: {
      message: "A lasting bloom for the love that lasts forever 🌸",
      backgroundColor: "#FCE4EC",
      textColor: "#880E4F",
      accentColor: "#C7D3B3",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "mothers",
    }
  },
  {
    name: "Graduation Season",
    slug: "graduation",
    description: "Ivory, sage, charcoal and subtle gold.",
    eventType: "SEASONAL",
    previewColor: "#F9FBE7",
    defaultConfig: {
      message: "Celebrate their next chapter with flowers that last 🎓",
      backgroundColor: "#F9FBE7",
      textColor: "#33691E",
      accentColor: "#C7D3B3",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "graduation",
    }
  },
  {
    name: "Ramadan",
    slug: "ramadan",
    description: "Deep green, ivory and muted gold. Elegant and respectful.",
    eventType: "SEASONAL",
    previewColor: "#E8F5E9",
    defaultConfig: {
      message: "Wishing you a blessed and beautiful Ramadan 🌙",
      backgroundColor: "#E8F5E9",
      textColor: "#1B5E20",
      accentColor: "#C7D3B3",
      linkColor: "#388E3C",
      animationType: "FADE",
      decorativeAsset: "ramadan",
    }
  },
  {
    name: "Eid",
    slug: "eid",
    description: "Sage, deep green, ivory and soft gold.",
    eventType: "SEASONAL",
    previewColor: "#F1F8E9",
    defaultConfig: {
      message: "Eid gifts made to be remembered ✨",
      backgroundColor: "#F1F8E9",
      textColor: "#2E7D32",
      accentColor: "#D6CFE6",
      linkColor: "#388E3C",
      animationType: "FADE",
      decorativeAsset: "eid",
    }
  },
  {
    name: "Black Friday / Sale",
    slug: "black-friday",
    description: "Muted charcoal, ivory and lavender. Strong contrast, brand-aligned.",
    eventType: "PROMO",
    previewColor: "#ECEFF1",
    defaultConfig: {
      message: "A special offer is blooming — limited time only",
      backgroundColor: "#4A4A4A",
      textColor: "#F6F4EC",
      accentColor: "#D6CFE6",
      linkColor: "#C7D3B3",
      animationType: "SLIDE_H",
      decorativeAsset: "blackfriday",
    }
  },
  {
    name: "Free Delivery",
    slug: "free-delivery",
    description: "Moss green, ivory and lavender with delivery icon.",
    eventType: "PROMO",
    previewColor: "#E8F5E9",
    defaultConfig: {
      message: "Free delivery in Casablanca on qualifying orders",
      backgroundColor: "#E8F5E9",
      textColor: "#1B5E20",
      accentColor: "#D6CFE6",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "default",
    }
  },
  {
    name: "Product Launch",
    slug: "product-launch",
    description: "Ivory and lavender with soft reveal animation.",
    eventType: "PROMO",
    previewColor: "#EDE7F6",
    defaultConfig: {
      message: "A new collection is about to bloom",
      backgroundColor: "#F6F4EC",
      textColor: "#4A4A4A",
      accentColor: "#D6CFE6",
      linkColor: "#6F7E59",
      animationType: "DISSOLVE",
      decorativeAsset: "default",
    }
  },
  {
    name: "Restock",
    slug: "restock",
    description: "Sage, ivory and moss green.",
    eventType: "PROMO",
    previewColor: "#C7D3B3",
    defaultConfig: {
      message: "Your favorite blooms are back",
      backgroundColor: "#C7D3B3",
      textColor: "#3A4A2F",
      accentColor: "#F6F4EC",
      linkColor: "#4A4A4A",
      animationType: "FADE",
      decorativeAsset: "default",
    }
  },
  {
    name: "Custom Blank",
    slug: "custom",
    description: "Start from scratch — fully configurable.",
    eventType: "CUSTOM",
    previewColor: "#FFFFFF",
    defaultConfig: {
      message: "Enter your custom message here",
      backgroundColor: "#F6F4EC",
      textColor: "#4A4A4A",
      accentColor: "#D6CFE6",
      linkColor: "#6F7E59",
      animationType: "FADE",
      decorativeAsset: "",
    }
  },
];

async function main() {
  console.log('🌱 Seeding announcement templates...');
  for (const t of templates) {
    await prisma.announcementTemplate.upsert({
      where: { slug: t.slug },
      update: { ...t },
      create: { ...t },
    });
    console.log(`  ✓ ${t.name}`);
  }
  console.log('✅ Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
