export interface ListingDeletePermission {
  allowed: boolean;
  message?: string;
  hoursLeft?: number;
}

export function canDeleteListing(listing: any): ListingDeletePermission {
  if (!listing) return { allowed: true };

  const status = (listing.status || 'active').toLowerCase();

  // Active, pending, available, open -> always deletable
  if (status === 'active' || status === 'pending' || status === 'available' || status === 'open') {
    return { allowed: true };
  }

  // Accepted / Scheduled -> only deletable after 24 hours
  if (status === 'accepted' || status === 'scheduled' || status === 'matched') {
    const acceptedAt = new Date(listing.updated_at || listing.created_at || Date.now());
    const hoursSince = (Date.now() - acceptedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSince >= 24) {
      return { allowed: true };
    }

    const hoursLeft = Math.ceil(24 - hoursSince);
    return {
      allowed: false,
      hoursLeft,
      message: `Cannot delete accepted listing yet. Available in ${hoursLeft} hour(s).`,
    };
  }

  // Completed, cancelled, sold, fulfilled -> always deletable
  return { allowed: true };
}
