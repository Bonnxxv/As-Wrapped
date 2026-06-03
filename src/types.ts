export type PlatformType = 'instagram' | 'tiktok';

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number; // Represents shares for both IG and TT
}

export interface ContentEntry {
  id: string;
  day: number; // 1 to 28/29/30/31
  title: string;
  instagram: ContentMetrics;
  tiktok: ContentMetrics;
}

export interface PlatformProfile {
  username: string;
  fullName: string;
  followers: number;
}

export interface PlatformProfiles {
  instagram: PlatformProfile;
  tiktok: PlatformProfile;
}

// Folder State: Year -> MonthIndex (0-11) -> Array of Content Entries
export type FolderDataState = Record<number, Record<number, ContentEntry[]>>;

export interface AppState {
  years: number[];
  folders: FolderDataState;
  profiles: PlatformProfiles;
}
