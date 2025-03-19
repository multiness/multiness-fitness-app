import { users, type User, type InsertUser } from "@shared/schema";
import { products, type Product, type InsertProduct } from "@shared/schema";
import { events, eventExternalRegistrations, type Event, type EventExternalRegistration, type InsertEventExternalRegistration, type InsertEvent } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  createEventExternalRegistration(registration: InsertEventExternalRegistration): Promise<EventExternalRegistration>;
  getEventExternalRegistrations(eventId: number): Promise<EventExternalRegistration[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const productData = { ...insertProduct };
    if (productData.validUntil) {
      productData.validUntil = new Date(productData.validUntil);
    }

    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    try {
      const updateData = { ...product };
      if (updateData.validUntil) {
        updateData.validUntil = new Date(updateData.validUntil);
      }

      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async createEventExternalRegistration(registration: InsertEventExternalRegistration): Promise<EventExternalRegistration> {
    const [newRegistration] = await db
      .insert(eventExternalRegistrations)
      .values(registration)
      .returning();
    return newRegistration;
  }

  async getEventExternalRegistrations(eventId: number): Promise<EventExternalRegistration[]> {
    return await db
      .select()
      .from(eventExternalRegistrations)
      .where(eq(eventExternalRegistrations.eventId, eventId));
  }
}

export const storage = new DatabaseStorage();