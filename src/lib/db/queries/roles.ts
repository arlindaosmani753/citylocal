import { db } from '@/lib/db'
import { userCityRoles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export type UserCityRole = {
  isLocal: boolean
  verifiedPostCount: number
  localSince: Date | null
}

/**
 * Check whether a user has earned local status in a specific city.
 * Returns false if no row exists (not yet posted) or if isLocal is false.
 * Local status is earned via 3+ GPS-verified posts — populated by Phase 2.
 *
 * NEVER use user_metadata or a global role column — always use this function.
 */
export async function isUserLocalInCity(userId: string, cityId: string): Promise<boolean> {
  const result = await db
    .select({ isLocal: userCityRoles.isLocal })
    .from(userCityRoles)
    .where(and(eq(userCityRoles.userId, userId), eq(userCityRoles.cityId, cityId)))
    .limit(1)

  return result[0]?.isLocal ?? false
}

/**
 * Get the full role record for a user in a city.
 * Used by Phase 2 GPS verification to increment verifiedPostCount.
 */
export async function getUserCityRole(
  userId: string,
  cityId: string
): Promise<UserCityRole | null> {
  const result = await db
    .select({
      isLocal: userCityRoles.isLocal,
      verifiedPostCount: userCityRoles.verifiedPostCount,
      localSince: userCityRoles.localSince,
    })
    .from(userCityRoles)
    .where(and(eq(userCityRoles.userId, userId), eq(userCityRoles.cityId, cityId)))
    .limit(1)

  return result[0] ?? null
}
