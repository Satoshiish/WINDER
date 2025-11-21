/**
 * Emergency Contact Cache Utility
 * Manages local storage of user's emergency contact information
 * for faster form pre-filling during emergency situations
 */

interface EmergencyContact {
  name: string
  phone: string
  timestamp: number
  version: number
}

const CACHE_KEY = "winder-emergency-contact"
const CACHE_VERSION = 1
const CACHE_EXPIRY_DAYS = 30
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000

/**
 * Save emergency contact information to localStorage
 * @param name - User's full name
 * @param phone - User's contact phone number
 */
export function saveEmergencyContact(name: string, phone: string): boolean {
  try {
    if (!name.trim() || !phone.trim()) {
      console.warn("[Emergency Contact Cache] Invalid contact data")
      return false
    }

    const contactData: EmergencyContact = {
      name: name.trim(),
      phone: phone.trim(),
      timestamp: Date.now(),
      version: CACHE_VERSION,
    }

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(contactData))
      return true
    }
    return false
  } catch (error) {
    console.error("[Emergency Contact Cache] Error saving contact:", error)
    return false
  }
}

/**
 * Retrieve emergency contact information from localStorage
 * Returns null if cache is expired or invalid
 */
export function getEmergencyContact(): EmergencyContact | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null
    }

    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const contactData: EmergencyContact = JSON.parse(cached)

    // Validate version
    if (contactData.version !== CACHE_VERSION) {
      console.warn("[Emergency Contact Cache] Cache version mismatch, clearing")
      clearEmergencyContact()
      return null
    }

    // Check expiry
    const now = Date.now()
    if (now - contactData.timestamp > CACHE_EXPIRY_MS) {
      console.info("[Emergency Contact Cache] Cache expired, clearing")
      clearEmergencyContact()
      return null
    }

    // Validate data
    if (!contactData.name?.trim() || !contactData.phone?.trim()) {
      console.warn("[Emergency Contact Cache] Invalid cached data, clearing")
      clearEmergencyContact()
      return null
    }

    return contactData
  } catch (error) {
    console.error("[Emergency Contact Cache] Error retrieving contact:", error)
    return null
  }
}

/**
 * Clear emergency contact information from localStorage
 */
export function clearEmergencyContact(): boolean {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(CACHE_KEY)
      return true
    }
    return false
  } catch (error) {
    console.error("[Emergency Contact Cache] Error clearing contact:", error)
    return false
  }
}

/**
 * Check if emergency contact cache exists and is valid
 */
export function hasValidEmergencyContact(): boolean {
  return getEmergencyContact() !== null
}

/**
 * Get cache expiry info for display
 */
export function getCacheExpiryInfo(): {
  expires: Date
  daysRemaining: number
  expiresIn: string
} | null {
  const contact = getEmergencyContact()
  if (!contact) return null

  const expiresAt = new Date(contact.timestamp + CACHE_EXPIRY_MS)
  const now = new Date()
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const expiresIn =
    daysRemaining === 1
      ? "tomorrow"
      : daysRemaining > 1
        ? `in ${daysRemaining} days`
        : "today"

  return {
    expires: expiresAt,
    daysRemaining,
    expiresIn,
  }
}

/**
 * Manually refresh cache (e.g., when user wants to update info)
 * This updates the timestamp to extend expiry without changing the data
 */
export function refreshEmergencyContactCache(): boolean {
  try {
    const contact = getEmergencyContact()
    if (contact) {
      return saveEmergencyContact(contact.name, contact.phone)
    }
    return false
  } catch (error) {
    console.error("[Emergency Contact Cache] Error refreshing cache:", error)
    return false
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  isCached: boolean
  savedAt: Date | null
  expiresAt: Date | null
  ageMinutes: number | null
  isExpired: boolean
} {
  const contact = getEmergencyContact()

  if (!contact) {
    return {
      isCached: false,
      savedAt: null,
      expiresAt: null,
      ageMinutes: null,
      isExpired: true,
    }
  }

  const savedAt = new Date(contact.timestamp)
  const expiresAt = new Date(contact.timestamp + CACHE_EXPIRY_MS)
  const ageMinutes = Math.floor((Date.now() - contact.timestamp) / (1000 * 60))
  const isExpired = Date.now() > expiresAt.getTime()

  return {
    isCached: true,
    savedAt,
    expiresAt,
    ageMinutes,
    isExpired,
  }
}
