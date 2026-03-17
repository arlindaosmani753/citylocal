import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  varchar,
  decimal,
  index,
  uniqueIndex,
  customType,
} from 'drizzle-orm/pg-core'

// Enums
export const contentStatusEnum = pgEnum('content_status', ['active', 'hidden', 'removed'])
export const reportReasonEnum = pgEnum('report_reason', ['spam', 'inappropriate', 'fake', 'other'])

// Shared timestamp columns pattern
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft-delete: null = active
}

// Cities (seed data: Paris)
export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // 'paris-france'
  name: varchar('name', { length: 200 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  radiusKm: decimal('radius_km', { precision: 5, scale: 2 }).notNull().default('25'),
  timezone: varchar('timezone', { length: 100 }).notNull(),
  ...timestamps,
})

// User profiles (extends Supabase auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // FK to auth.users.id — same UUID
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  homeCityId: uuid('home_city_id').references(() => cities.id), // ROLE-01: self-declared home city
  avatarUrl: text('avatar_url'),
  ...timestamps,
})

// Per-city role tracking (ROLE-02: behavior-based local status)
// Populated by trigger/function in Phase 2 when GPS-verified post count >= 3
export const userCityRoles = pgTable(
  'user_city_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' }),
    isLocal: boolean('is_local').notNull().default(false), // true = earned local status
    verifiedPostCount: integer('verified_post_count').notNull().default(0),
    localSince: timestamp('local_since', { withTimezone: true }), // when 3rd post was verified
    ...timestamps,
  },
  (table) => [
    uniqueIndex('user_city_roles_user_city_unique').on(table.userId, table.cityId),
    index('user_city_roles_user_idx').on(table.userId),
    index('user_city_roles_city_idx').on(table.cityId),
  ]
)

// Phase 2: place_category enum (must be declared before posts table)
export const placeCategoryEnum = pgEnum('place_category', [
  'restaurant', 'cafe', 'bar', 'activity', 'sport',
  'tourist_attraction', 'shopping', 'other',
])

// Custom type for PostgreSQL interval (no Drizzle built-in)
export const pgInterval = customType<{ data: string }>({
  dataType() { return 'interval' },
})

// Custom type for PostGIS geography point
export const pgGeography = customType<{ data: string }>({
  dataType() { return 'geography(POINT, 4326)' },
})

// Unified posts table (places + events — Phase 2 will add GPS-gated creation)
// Define here so foreign keys work; content_type 'event' used in Phase 5
export const contentTypeEnum = pgEnum('content_type', ['place', 'event'])

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cityId: uuid('city_id').notNull().references(() => cities.id),
    authorId: uuid('author_id').notNull().references(() => profiles.id),
    contentType: contentTypeEnum('content_type').notNull().default('place'),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body'),
    category: placeCategoryEnum('category'),
    // GPS fields — populated in Phase 2; nullable now
    lat: decimal('lat', { precision: 10, scale: 7 }),
    lng: decimal('lng', { precision: 10, scale: 7 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    // Phase 2 additions: geography point, location name, recurrence
    location:           pgGeography('location'),
    locationName:       varchar('location_name', { length: 200 }),
    recurrenceInterval: pgInterval('recurrence_interval'),
    recurrenceEndsAt:   timestamp('recurrence_ends_at', { withTimezone: true }),
    // Event-specific — populated in Phase 5; nullable now
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    // Moderation
    status: contentStatusEnum('status').notNull().default('active'),
    flagCount: integer('flag_count').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('posts_city_created_idx').on(table.cityId, table.createdAt),
    index('posts_author_idx').on(table.authorId),
    index('posts_status_idx').on(table.status),
  ]
)

// Phase 2: Post images (multiple photos per post)
export const postImages = pgTable('post_images', {
  id:           uuid('id').primaryKey().defaultRandom(),
  postId:       uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  storagePath:  text('storage_path').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('post_images_post_idx').on(table.postId),
])

// Phase 2: Event RSVPs (one per user per event, enforced by uniqueIndex)
export const eventRsvps = pgTable('event_rsvps', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('event_rsvps_user_post_unique').on(table.userId, table.postId),
  index('event_rsvps_post_idx').on(table.postId),
  index('event_rsvps_user_idx').on(table.userId),
])

// Reports/flags (RATE-03 data model — built here, UI in Phase 4)
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id').notNull().references(() => profiles.id),
    targetType: varchar('target_type', { length: 20 }).notNull(), // 'post' | 'review'
    targetId: uuid('target_id').notNull(),
    reason: reportReasonEnum('reason').notNull(),
    details: text('details'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('reports_target_idx').on(table.targetType, table.targetId),
    index('reports_reporter_idx').on(table.reporterId),
  ]
)
