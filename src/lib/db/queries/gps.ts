import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

// Two separate constants — do NOT conflate accuracy threshold with geofence radius
export const GPS_ACCURACY_THRESHOLD_METERS = 150  // reject GPS readings less precise than this
export const GEOFENCE_RADIUS_METERS = 200          // user must be within this distance of the place

export async function verifyGpsProximity(
  userLat: number,
  userLng: number,
  userAccuracy: number,  // from navigator.geolocation — meters at 95% confidence
  placeLat: number,
  placeLng: number
): Promise<{ verified: boolean; reason?: string }> {
  // Step 1: Reject imprecise readings before hitting the DB
  if (userAccuracy > GPS_ACCURACY_THRESHOLD_METERS) {
    return { verified: false, reason: 'GPS accuracy insufficient — move outdoors and try again' }
  }

  // Step 2: PostGIS proximity check
  // IMPORTANT: ST_MakePoint takes (longitude, latitude) — NOT (latitude, longitude)
  // This matches PostGIS (x, y) = (lng, lat) convention
  const result = await db.execute(sql`
    SELECT ST_DWithin(
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${placeLng}, ${placeLat}), 4326)::geography,
      ${GEOFENCE_RADIUS_METERS}
    ) AS within_range
  `)

  const withinRange = (result as any)[0]?.within_range ?? false
  if (!withinRange) {
    return { verified: false, reason: 'You must be physically at the location to post' }
  }

  return { verified: true }
}
