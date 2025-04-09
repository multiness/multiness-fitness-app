import { 
  users, 
  type User, 
  type InsertUser,
  dailyGoals,
  type DailyGoal,
  type InsertDailyGoal,
  posts,
  type Post,
  type InsertPost,
  postComments,
  type PostComment,
  postLikes,
  products, 
  type Product, 
  type InsertProduct,
  events, 
  eventExternalRegistrations, 
  eventParticipants,
  type Event, 
  type EventExternalRegistration, 
  type EventParticipant,
  type InsertEventExternalRegistration, 
  type InsertEvent,
  challenges, 
  challengeParticipants, 
  challengeResults,
  type Challenge, 
  type ChallengeParticipant, 
  type ChallengeResult,
  type InsertChallenge, 
  type InsertChallengeParticipant,
  groups,
  groupMembers,
  type Group,
  type GroupMember,
  type InsertGroup,
  workoutTemplates,
  type WorkoutTemplate,
  type InsertWorkoutTemplate,
  notifications,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, like } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Daily Goals methods
  getDailyGoals(userId: number, date?: Date): Promise<DailyGoal[]>;
  getDailyGoal(id: number): Promise<DailyGoal | undefined>;
  createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal>;
  updateDailyGoal(id: number, goal: Partial<DailyGoal>): Promise<DailyGoal>;
  deleteDailyGoal(id: number): Promise<void>;
  
  // Post methods
  getPosts(options?: { userId?: number, groupId?: number, limit?: number, offset?: number }): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  likePost(postId: number, userId: number): Promise<void>;
  unlikePost(postId: number, userId: number): Promise<void>;
  
  // Group methods
  getGroups(options?: { userId?: number, limit?: number, offset?: number }): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  addGroupMember(groupId: number, userId: number, role?: string): Promise<GroupMember>;
  updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<void>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Event methods
  getEvents(options?: { groupId?: number, upcoming?: boolean, limit?: number, offset?: number }): Promise<Event[]>; 
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  createEventExternalRegistration(registration: InsertEventExternalRegistration): Promise<EventExternalRegistration>;
  getEventExternalRegistrations(eventId: number): Promise<EventExternalRegistration[]>;
  registerForEvent(eventId: number, userId: number): Promise<EventParticipant>;
  
  // Challenge methods
  getChallenges(options?: { groupId?: number, active?: boolean, limit?: number, offset?: number }): Promise<Challenge[]>;
  getChallenge(id: number): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, challenge: Partial<Challenge>): Promise<Challenge>;
  deleteChallenge(id: number): Promise<void>;
  
  // Challenge Participant methods
  getChallengeParticipants(challengeId: number): Promise<ChallengeParticipant[]>;
  getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined>;
  addChallengeParticipant(participant: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateChallengeParticipant(challengeId: number, userId: number, data: Partial<ChallengeParticipant>): Promise<ChallengeParticipant | undefined>;
  removeChallengeParticipant(challengeId: number, userId: number): Promise<void>;
  
  // Workout methods
  getWorkoutTemplates(options?: { userId?: number, public?: boolean, limit?: number, offset?: number }): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: number): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: number, template: Partial<WorkoutTemplate>): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(id: number): Promise<void>;
  
  // Notification methods
  getNotifications(userId: number, options?: { unreadOnly?: boolean, limit?: number, offset?: number }): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Daily Goals methods
  async getDailyGoals(userId: number, date?: Date): Promise<DailyGoal[]> {
    let query = db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId));
    
    if (date) {
      // Nur Ziele vom angegebenen Datum abrufen
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          gte(dailyGoals.date, startOfDay),
          lte(dailyGoals.date, endOfDay)
        )
      );
    }
    
    return await query.orderBy(dailyGoals.date);
  }
  
  async getDailyGoal(id: number): Promise<DailyGoal | undefined> {
    const [goal] = await db.select().from(dailyGoals).where(eq(dailyGoals.id, id));
    return goal;
  }
  
  async createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal> {
    const goalData = { ...goal };
    if (typeof goalData.date === 'string') {
      goalData.date = new Date(goalData.date);
    }
    
    const [newGoal] = await db.insert(dailyGoals).values(goalData).returning();
    return newGoal;
  }
  
  async updateDailyGoal(id: number, goalData: Partial<DailyGoal>): Promise<DailyGoal> {
    const data = { ...goalData, updatedAt: new Date() };
    
    // Aktualisiere den completed-Status, wenn der Fortschritt größer oder gleich dem Ziel ist
    if (goalData.progress !== undefined && goalData.target !== undefined && goalData.progress >= goalData.target) {
      data.completed = true;
    }
    
    const [updatedGoal] = await db.update(dailyGoals)
      .set(data)
      .where(eq(dailyGoals.id, id))
      .returning();
    return updatedGoal;
  }
  
  async deleteDailyGoal(id: number): Promise<void> {
    await db.delete(dailyGoals).where(eq(dailyGoals.id, id));
  }
  
  // Post methods
  async getPosts(options?: { userId?: number, groupId?: number, limit?: number, offset?: number }): Promise<Post[]> {
    let query = db.select().from(posts);
    
    if (options?.userId) {
      query = query.where(eq(posts.userId, options.userId));
    }
    
    if (options?.groupId) {
      query = query.where(eq(posts.groupId, options.groupId));
    }
    
    query = query.orderBy(desc(posts.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post> {
    const [updatedPost] = await db.update(posts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
  
  async likePost(postId: number, userId: number): Promise<void> {
    // Prüfen, ob der Like bereits existiert
    const existingLikes = await db.select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    if (existingLikes.length === 0) {
      // Like hinzufügen
      await db.insert(postLikes).values({ postId, userId });
      
      // Like-Zähler erhöhen
      await db.update(posts)
        .set({ likeCount: sql`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId));
    }
  }
  
  async unlikePost(postId: number, userId: number): Promise<void> {
    // Like entfernen
    const result = await db.delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    if (result.rowCount && result.rowCount > 0) {
      // Like-Zähler verringern
      await db.update(posts)
        .set({ likeCount: sql`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId));
    }
  }
  
  // Group methods
  async getGroups(options?: { userId?: number, limit?: number, offset?: number }): Promise<Group[]> {
    if (options?.userId) {
      // Gruppen abrufen, in denen der Benutzer Mitglied ist
      const memberGroups = await db.select({
        group: groups
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, options.userId))
      .orderBy(desc(groups.updatedAt))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);
      
      return memberGroups.map(row => row.group);
    } else {
      // Alle öffentlichen Gruppen abrufen
      let query = db.select()
        .from(groups)
        .where(eq(groups.isPrivate, false))
        .orderBy(desc(groups.updatedAt));
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      
      return await query;
    }
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    
    // Ersteller automatisch als Admin-Mitglied hinzufügen
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: newGroup.creatorId,
      role: 'admin'
    });
    
    // Mitgliederzähler aktualisieren
    await db.update(groups)
      .set({ memberCount: 1 })
      .where(eq(groups.id, newGroup.id));
    
    return newGroup;
  }
  
  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group> {
    const [updatedGroup] = await db.update(groups)
      .set({ ...groupData, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }
  
  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }
  
  async addGroupMember(groupId: number, userId: number, role: string = 'member'): Promise<GroupMember> {
    // Prüfen, ob der Benutzer bereits Mitglied ist
    const existingMember = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    if (existingMember.length > 0) {
      throw new Error('Benutzer ist bereits Mitglied dieser Gruppe');
    }
    
    const [newMember] = await db.insert(groupMembers)
      .values({ groupId, userId, role })
      .returning();
    
    // Mitgliederzähler aktualisieren
    await db.update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1` })
      .where(eq(groups.id, groupId));
    
    return newMember;
  }
  
  async updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember> {
    const [updatedMember] = await db.update(groupMembers)
      .set({ role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();
    
    if (!updatedMember) {
      throw new Error('Gruppenmitglied nicht gefunden');
    }
    
    return updatedMember;
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    const result = await db.delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    
    if (result.rowCount && result.rowCount > 0) {
      // Mitgliederzähler aktualisieren
      await db.update(groups)
        .set({ memberCount: sql`${groups.memberCount} - 1` })
        .where(eq(groups.id, groupId));
    }
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
    const result = await db.query.challenges.findMany();
    return result.map(challenge => {
      // Konvertiere die Datenbankstruktur in das erwartete Modell
      return {
        ...challenge,
        type: challenge.type || 'custom',
        status: challenge.status || 'active',
        createdAt: challenge.created_at || new Date()
      } as Challenge;
    });
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
    try {
      return await db
        .select()
        .from(challengeParticipants)
        .where(eq(challengeParticipants.challengeId, challengeId));
    } catch (error) {
      console.log("Error fetching challenge participants:", error);
      return []; // Return empty array if table doesn't exist yet
    }
  }

  async getChallengeParticipant(challengeId: number, userId: number): Promise<ChallengeParticipant | undefined> {
    try {
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
    } catch (error) {
      console.log("Error fetching challenge participant:", error);
      return undefined; // Return undefined if table doesn't exist yet
    }
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
  
  async removeChallengeParticipant(challengeId: number, userId: number): Promise<void> {
    await db.delete(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
      
    // Aktualisiere den Teilnehmerzähler
    await db.update(challenges)
      .set({ participantCount: sql`${challenges.participantCount} - 1` })
      .where(eq(challenges.id, challengeId));
  }
  
  async deleteChallenge(id: number): Promise<void> {
    await db.delete(challenges).where(eq(challenges.id, id));
  }
  
  // Events methods
  async getEvents(options?: { groupId?: number, upcoming?: boolean, limit?: number, offset?: number }): Promise<Event[]> {
    let query = db.select().from(events);
    
    if (options?.groupId) {
      query = query.where(eq(events.groupId, options.groupId));
    }
    
    if (options?.upcoming) {
      const now = new Date();
      query = query.where(gte(events.date, now));
    }
    
    query = query.orderBy(asc(events.date));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    const data = { ...eventData, updatedAt: new Date() };
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date);
    }
    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate);
    }
    
    const [updatedEvent] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
  
  async registerForEvent(eventId: number, userId: number): Promise<EventParticipant> {
    // Prüfen, ob der Benutzer bereits registriert ist
    const existingRegistration = await db.select()
      .from(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.userId, userId)
      ));
      
    if (existingRegistration.length > 0) {
      throw new Error('Benutzer ist bereits für diese Veranstaltung registriert');
    }
    
    // Prüfen, ob die Veranstaltung voll ist
    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error('Veranstaltung nicht gefunden');
    }
    
    if (!event.unlimitedParticipants && event.maxParticipants !== null && event.currentParticipants >= event.maxParticipants) {
      throw new Error('Die Veranstaltung ist bereits voll');
    }
    
    // Registrierung erstellen
    const [registration] = await db.insert(eventParticipants)
      .values({
        eventId,
        userId,
        status: 'registered'
      })
      .returning();
      
    // Teilnehmerzähler aktualisieren
    await db.update(events)
      .set({ currentParticipants: sql`${events.currentParticipants} + 1` })
      .where(eq(events.id, eventId));
      
    return registration;
  }
  
  // Workout methods
  async getWorkoutTemplates(options?: { userId?: number, public?: boolean, limit?: number, offset?: number }): Promise<WorkoutTemplate[]> {
    let query = db.select().from(workoutTemplates);
    
    if (options?.userId) {
      query = query.where(eq(workoutTemplates.creatorId, options.userId));
    }
    
    if (options?.public !== undefined) {
      query = query.where(eq(workoutTemplates.isPublic, options.public));
    }
    
    query = query.orderBy(desc(workoutTemplates.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async getWorkoutTemplate(id: number): Promise<WorkoutTemplate | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
    return template;
  }
  
  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [newTemplate] = await db.insert(workoutTemplates).values(template).returning();
    return newTemplate;
  }
  
  async updateWorkoutTemplate(id: number, templateData: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
    const [updatedTemplate] = await db.update(workoutTemplates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(workoutTemplates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteWorkoutTemplate(id: number): Promise<void> {
    await db.delete(workoutTemplates).where(eq(workoutTemplates.id, id));
  }
  
  // Notification methods
  async getNotifications(userId: number, options?: { unreadOnly?: boolean, limit?: number, offset?: number }): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (options?.unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }
    
    query = query.orderBy(desc(notifications.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();