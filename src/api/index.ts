import { Hono } from 'hono';
import { cors } from "hono/cors"
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from './database/schema';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>()
  .basePath('api');

app.use(cors({
  origin: "*"
}))

app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// Shifts
app.get('/shifts', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const result = await db.query.shifts.findMany();
  return c.json(result);
});

app.post('/shifts', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const items = Array.isArray(body) ? body : [body];
  
  for (const item of items) {
    await db.insert(schema.shifts).values(item).onConflictDoUpdate({
      target: schema.shifts.id,
      set: item
    });
  }
  
  return c.json({ success: true });
});

app.delete('/shifts/:id', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param('id');
  await db.delete(schema.shifts).where(eq(schema.shifts.id, id));
  return c.json({ success: true });
});

// Targets
app.get('/targets', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const result = await db.query.monthlyTargets.findMany();
  return c.json(result);
});

app.post('/targets', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const items = Array.isArray(body) ? body : [body];
  
  for (const item of items) {
    await db.insert(schema.monthlyTargets).values(item).onConflictDoUpdate({
      target: schema.monthlyTargets.id,
      set: item
    });
  }
  
  return c.json({ success: true });
});

// Locations
app.get('/locations', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const result = await db.query.savedLocations.findMany();
  return c.json(result);
});

app.post('/locations', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const items = Array.isArray(body) ? body : [body];
  
  for (const item of items) {
    await db.insert(schema.savedLocations).values(item).onConflictDoUpdate({
      target: schema.savedLocations.id,
      set: item
    });
  }
  
  return c.json({ success: true });
});

app.delete('/locations/:id', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param('id');
  await db.delete(schema.savedLocations).where(eq(schema.savedLocations.id, id));
  return c.json({ success: true });
});

export default app;
