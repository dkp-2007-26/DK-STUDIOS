const ADMIN_ACCESS_KEY = "d.k-studios.adminAccessVerified";
const ADMIN_ACCESS_TTL_MS = 1000 * 60 * 30;

type AdminAccessRecord = {
  userId: string;
  verifiedAt: number;
};

export function markAdminAccessVerified(userId: string) {
  const record: AdminAccessRecord = {
    userId,
    verifiedAt: Date.now(),
  };
  sessionStorage.setItem(ADMIN_ACCESS_KEY, JSON.stringify(record));
}

export function clearAdminAccessVerification() {
  sessionStorage.removeItem(ADMIN_ACCESS_KEY);
}

export function hasAdminAccessVerification(userId: string | null | undefined) {
  if (!userId) return false;

  try {
    const raw = sessionStorage.getItem(ADMIN_ACCESS_KEY);
    if (!raw) return false;

    const record = JSON.parse(raw) as AdminAccessRecord;
    const stillFresh = Date.now() - record.verifiedAt < ADMIN_ACCESS_TTL_MS;
    return record.userId === userId && stillFresh;
  } catch {
    clearAdminAccessVerification();
    return false;
  }
}
