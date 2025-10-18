/**
 * Capitalizes each word in a string for proper address formatting
 * Handles special cases like "Sta", "Sto", "De", "Del", "Las", "Los"
 */
export function formatAddress(address: string): string {
  if (!address) return address

  // Special words that should have specific capitalization
  const specialWords: Record<string, string> = {
    sta: "Sta",
    sto: "Sto",
    de: "de",
    del: "del",
    las: "Las",
    los: "Los",
    san: "San",
    santa: "Santa",
    santo: "Santo",
  }

  return address
    .split(",")
    .map((part) => {
      return part
        .trim()
        .split(" ")
        .map((word, index) => {
          const lowerWord = word.toLowerCase()

          // Check if it's a special word (but not at the start of a part)
          if (index > 0 && specialWords[lowerWord]) {
            return specialWords[lowerWord]
          }

          // Regular title case
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join(" ")
    })
    .join(", ")
}

/**
 * Formats a location string to ensure proper capitalization
 * Example: "sta rita, olongapo city" -> "Sta Rita, Olongapo City"
 */
export function formatLocation(location: string): string {
  return formatAddress(location)
}
