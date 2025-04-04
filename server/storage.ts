import { users, type User, type InsertUser } from "@shared/schema";
import { products, type Product, type InsertProduct } from "@shared/schema";
import { events, eventExternalRegistrations, type Event, type EventExternalRegistration, type InsertEventExternalRegistration, type InsertEvent } from "@shared/schema";
import { challenges, challengeParticipants, type Challenge, type ChallengeParticipant, type InsertChallenge, type InsertChallengeParticipant } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

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
  
  // Challenge methods
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, challenge: Partial<Challenge>): Promise<Challenge>;
  
  // Challenge Participant methods
  getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]>;
  getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined>;
  addChallengeParticipant(participant: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateChallengeParticipant(challengeId: number, userId: number, data: Partial<ChallengeParticipant>): Promise<ChallengeParticipant | undefined>;
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

  // Challenge methods
  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getChallenge(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const challengeData = { ...challenge };
    if (challengeData.startDate) {
      challengeData.startDate = new Date(challengeData.startDate);
    }
    if (challengeData.endDate) {
      challengeData.endDate = new Date(challengeData.endDate);
    }

    const [newChallenge] = await db.insert(challenges).values(challengeData).returning();
    return newChallenge;
  }

  async updateChallenge(id: number, challenge: Partial<Challenge>): Promise<Challenge> {
    try {
      const updateData = { ...challenge };
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const [updatedChallenge] = await db
        .update(challenges)
        .set(updateData)
        .where(eq(challenges.id, id))
        .returning();
      return updatedChallenge;
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  // Challenge Participant methods
  async getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]> {
    return await db
      .select()
      .from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId));
  }

  async getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        )
      );
    return participant;
  }

  async addChallengeParticipant(participant: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const participantData = { ...participant };
    if (participantData.joinedAt) {
      participantData.joinedAt = new Date(participantData.joinedAt);
    }
    if (participantData.completedAt) {
      participantData.completedAt = new Date(participantData.completedAt);
    }

    const [newParticipant] = await db
      .insert(challengeParticipants)
      .values(participantData)
      .returning();
    return newParticipant;
  }

  async updateChallengeParticipant(
    challengeId: number,
    userId: number,
    data: Partial<ChallengeParticipant>
  ): Promise<ChallengeParticipant | undefined> {
    try {
      const updateData = { ...data };
      if (updateData.completedAt) {
        updateData.completedAt = new Date(updateData.completedAt);
      }

      const [updatedParticipant] = await db
        .update(challengeParticipants)
        .set(updateData)
        .where(
          and(
            eq(challengeParticipants.challengeId, challengeId),
            eq(challengeParticipants.userId, userId)
          )
        )
        .returning();
      return updatedParticipant;
    } catch (error) {
      console.error('Error updating challenge participant:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();