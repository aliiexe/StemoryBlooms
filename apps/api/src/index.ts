import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@stemory/database';
import { CheckoutPayloadSchema } from '@stemory/contracts';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { Webhook } from 'svix';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Keep raw body for Clerk webhooks, otherwise use json
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhooks/clerk')) {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors());

const port = process.env.PORT || 3001;

// --- 1. Products ---
app.get('/api/v1/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// --- 2. Orders ---
app.post('/api/v1/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ message: 'Idempotency-Key header is required' });
  }
  
  const parsed = CheckoutPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
  }
  
  try {
    const { items, customer, fulfillment, customNote } = parsed.data;
    
    // Total calculation
    let total = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) total += product.price * item.quantity;
    }
    
    const order = await prisma.$transaction(async (tx) => {
      // Find or create customer
      const dbCustomer = await tx.customer.upsert({
        where: { email: customer.email },
        update: { phone: customer.phone, firstName: customer.firstName, lastName: customer.lastName },
        create: customer
      });
      
      // Create order
      return tx.order.create({
        data: {
          customerId: dbCustomer.id,
          total,
          status: 'PENDING',
          customNote,
          items: {
            create: items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: 0
            }))
          },
          fulfillment: {
            create: fulfillment
          }
        }
      });
    });
    
    res.json(order);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
});

// --- 3. Webhooks ---
app.post('/api/v1/webhooks/clerk', async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('Webhook secret missing');
  
  const payload = req.body;
  const headers = req.headers as Record<string, string>;
  
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Missing svix headers');
  }
  
  const wh = new Webhook(secret);
  let evt: any;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    return res.status(400).send('Webhook verification failed');
  }
  
  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const data = evt.data;
    const email = data.email_addresses?.[0]?.email_address;
    
    if (email) {
      // Ensure role exists
      const role = await prisma.role.upsert({
        where: { name: 'CUSTOMER' },
        update: {},
        create: { name: 'CUSTOMER' }
      });
      
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: {
          email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
        },
        create: {
          clerkId: data.id,
          email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          roleId: role.id
        }
      });
    }
  }
  
  res.json({ success: true });
});

// --- 4. Auth Me ---
app.get('/api/v1/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    const clerkId = decoded.sub;
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { role: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in DB' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
