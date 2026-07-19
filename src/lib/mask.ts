export const mask = (
  str: string,
  options?: {
    end?: number;
    start?: number;
    visibleChars?: number;
    mode?: "auto" | "all" | "start" | "end" | "middle" | "email" | "phone";
  },
): string => {
  if (!str) return "";

  const trimmed = str.trim();
  let mode = options?.mode || "auto";
  const visibleChars = options?.visibleChars ?? 4;

  // 1. Auto-Detection Mode
  if (mode === "auto") {
    if (trimmed.includes("@")) {
      mode = "email";
    } else if (/^\+?[0-9\s\-()]{7,}$/.test(trimmed)) {
      mode = "phone";
    } else {
      mode = "all"; // Fallback
    }
  }

  // 2. Email Masking
  // e.g., "john.doe@example.com" -> "j***e@example.com"
  if (mode === "email") {
    const [user, domain] = trimmed.split("@");
    if (!domain || !user) return trimmed;
    if (user.length <= 2) return user[0] + "*@" + domain;
    // Keeps first and last char of username visible, masks the rest
    return user[0] + "*".repeat(user.length - 2) + user[user.length - 1] + "@" + domain;
  }

  // 3. Phone Number Masking (Smart Country Code preservation)
  // e.g., "+263785858682" -> "+263 ******82"
  if (mode === "phone") {
    const cleanPhone = trimmed.replace(/\s+/g, ""); // Strip spaces for consistent masking
    const isInternational = cleanPhone.startsWith("+");
    let countryCode = "";
    let localNumber = cleanPhone;

    if (isInternational) {
      const match = cleanPhone.match(/^(\+\d{1,3})/);
      if (match) {
        countryCode = match[1] + " ";
        localNumber = cleanPhone.slice(match[1].length);
      }
    }

    if (localNumber.length <= visibleChars) return trimmed;
    const maskedLength = localNumber.length - visibleChars;
    return countryCode + "*".repeat(maskedLength) + localNumber.slice(-visibleChars);
  }

  // 4. Mask Start (keeps start visible)
  if (mode === "start") {
    if (trimmed.length <= visibleChars) return trimmed;
    const visible = trimmed.slice(0, visibleChars);
    const masked = "*".repeat(trimmed.length - visibleChars);
    return visible + masked;
  }

  // 5. Mask End (keeps end visible)
  if (mode === "end") {
    if (trimmed.length <= visibleChars) return trimmed;
    const masked = "*".repeat(trimmed.length - visibleChars);
    const visible = trimmed.slice(-visibleChars);
    return masked + visible;
  }

  // 6. Mask Middle (masks an explicit range)
  if (mode === "middle") {
    const start = options?.start ?? 1;
    const end = options?.end ?? trimmed.length - 1;
    if (start >= end || start < 0 || end > trimmed.length) return trimmed;
    return trimmed.slice(0, start) + "*".repeat(end - start) + trimmed.slice(end);
  }

  // 7. Default ("all"): masks all except last visibleChars
  if (trimmed.length <= visibleChars) return "*".repeat(trimmed.length);
  const maskedSection = "*".repeat(trimmed.length - visibleChars);
  const visibleSection = trimmed.slice(-visibleChars);
  return maskedSection + visibleSection;
};
