import { FolderDataState, PlatformProfiles, ContentEntry } from '../types';

// Standard 12 months abbreviation / full names in Indonesian
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const createEmptyFolderState = (): FolderDataState => {
  const folders: FolderDataState = {};
  // Pre-populate folders from 2024 to 2030
  for (let year = 2024; year <= 2030; year++) {
    folders[year] = {};
    for (let month = 0; month < 12; month++) {
      folders[year][month] = [];
    }
  }
  return folders;
};

export const getInitialMockFolders = (): FolderDataState => {
  const folders = createEmptyFolderState();

  // 1. Prepopulate April 2026 (Month index 3)
  const aprilMockContents: ContentEntry[] = [
    {
      id: 'mock-ap-1',
      day: 5,
      title: 'April Photo Dump Recap',
      instagram: { views: 18500, likes: 2100, comments: 95, saves: 180, shares: 34 },
      tiktok: { views: 25000, likes: 3500, comments: 150, saves: 300, shares: 120 }
    },
    {
      id: 'mock-ap-2',
      day: 18,
      title: 'Minimalist Room Tour Reels',
      instagram: { views: 22000, likes: 3100, comments: 180, saves: 520, shares: 110 },
      tiktok: { views: 42000, likes: 7200, comments: 420, saves: 1100, shares: 220 }
    },
    {
      id: 'mock-ap-3',
      day: 24,
      title: 'ASMR Cafe Coffee Brewing',
      instagram: { views: 12500, likes: 1800, comments: 85, saves: 210, shares: 45 },
      tiktok: { views: 15500, likes: 2400, comments: 115, saves: 390, shares: 95 }
    }
  ];

  // 2. Prepopulate May 2026 (Month index 4) - Shows MOM growth compared to April
  const mayMockContents: ContentEntry[] = [
    {
      id: 'mock-my-1',
      day: 3,
      title: 'Aesthetic Outfit Tips',
      instagram: { views: 24500, likes: 3800, comments: 140, saves: 520, shares: 92 },
      tiktok: { views: 32000, likes: 5100, comments: 210, saves: 800, shares: 240 }
    },
    {
      id: 'mock-my-2',
      day: 12,
      title: 'Office Styling Hacks Reels',
      instagram: { views: 19800, likes: 2400, comments: 105, saves: 240, shares: 55 },
      tiktok: { views: 21000, likes: 3200, comments: 145, saves: 320, shares: 110 }
    },
    {
      id: 'mock-my-3',
      day: 18,
      title: 'Mini Vlog: Working in a Coffee Shop',
      instagram: { views: 35000, likes: 4900, comments: 340, saves: 950, shares: 210 },
      tiktok: { views: 48000, likes: 9500, comments: 610, saves: 1450, shares: 890 }
    },
    {
      id: 'mock-my-4',
      day: 26,
      title: 'Summer Collection Preview',
      instagram: { views: 9200, likes: 1100, comments: 48, saves: 85, shares: 15 },
      tiktok: { views: 14000, likes: 2100, comments: 130, saves: 410, shares: 110 }
    }
  ];

  folders[2026][3] = aprilMockContents;
  folders[2026][4] = mayMockContents;

  return folders;
};

export const getInitialProfiles = (): PlatformProfiles => {
  return {
    instagram: {
      username: 'asrep.aesthetic',
      fullName: 'Asrep Instagram Official',
      followers: 84200
    },
    tiktok: {
      username: 'asrep.creative',
      fullName: 'Asrep TikTok Official',
      followers: 124500
    }
  };
};
