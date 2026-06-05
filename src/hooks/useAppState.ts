import { useState, useEffect } from 'react';
import { FolderDataState, PlatformProfiles, ContentEntry, PlatformType } from '../types';
import { getInitialMockFolders, getInitialProfiles } from '../utils/initialState';

const FOLDERS_STORAGE_KEY = 'aswrapped_folders_data';
const PROFILES_STORAGE_KEY = 'aswrapped_profiles_data';
const YEARS_STORAGE_KEY = 'aswrapped_years_data';

const OLD_FOLDERS_STORAGE_KEY = 'asrep_folders_data';
const OLD_PROFILES_STORAGE_KEY = 'asrep_profiles_data';
const OLD_YEARS_STORAGE_KEY = 'asrep_years_data';

const migrateFoldersData = (data: any): FolderDataState => {
  const migrated: FolderDataState = {};
  
  if (!data || typeof data !== 'object') {
    return getInitialMockFolders();
  }

  const defaultMetrics = { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 };

  try {
    for (const yearStr of Object.keys(data)) {
      const year = parseInt(yearStr, 10);
      if (isNaN(year)) continue;

      migrated[year] = {};
      const monthsData = data[yearStr];
      if (monthsData && typeof monthsData === 'object') {
        for (let month = 0; month < 12; month++) {
          const entries = monthsData[month.toString()];
          if (Array.isArray(entries)) {
            migrated[year][month] = entries.map((entry: any): ContentEntry => {
              const hasInstagram = entry.instagram && typeof entry.instagram === 'object';
              const hasTiktok = entry.tiktok && typeof entry.tiktok === 'object';

              if (hasInstagram && hasTiktok) {
                // If it already matches the new layout, preserve and sanitize
                return {
                  id: entry.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  day: typeof entry.day === 'number' ? entry.day : 1,
                  title: typeof entry.title === 'string' ? entry.title : 'Untitled',
                  instagram: {
                    views: Number(entry.instagram.views) || 0,
                    likes: Number(entry.instagram.likes) || 0,
                    comments: Number(entry.instagram.comments) || 0,
                    saves: Number(entry.instagram.saves) || 0,
                    shares: Number(entry.instagram.shares) || 0,
                  },
                  tiktok: {
                    views: Number(entry.tiktok.views) || 0,
                    likes: Number(entry.tiktok.likes) || 0,
                    comments: Number(entry.tiktok.comments) || 0,
                    saves: Number(entry.tiktok.saves) || 0,
                    shares: Number(entry.tiktok.shares) || 0,
                  }
                };
              }

              // Otherwise convert from old structure
              const flatMetrics = {
                views: Number(entry.views) || 0,
                likes: Number(entry.likes) || 0,
                comments: Number(entry.comments) || 0,
                saves: Number(entry.saves) || 0,
                shares: Number(entry.shares) || 0,
              };

              const platform = entry.platform || 'instagram';

              return {
                id: entry.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                day: typeof entry.day === 'number' ? entry.day : 1,
                title: typeof entry.title === 'string' ? entry.title : 'Untitled',
                instagram: platform === 'instagram' ? flatMetrics : { ...defaultMetrics },
                tiktok: platform === 'tiktok' ? flatMetrics : { ...defaultMetrics }
              };
            });
          } else {
            migrated[year][month] = [];
          }
        }
      } else {
        // If monthsData is missing/invalid, initialize empty months for this year
        for (let month = 0; month < 12; month++) {
          migrated[year][month] = [];
        }
      }
    }
  } catch (err) {
    console.error("Error migrating folders data, falling back to mock", err);
    return getInitialMockFolders();
  }

  return migrated;
};

const migrateProfilesData = (data: any): PlatformProfiles => {
  const defaultProfiles = getInitialProfiles();
  if (!data || typeof data !== 'object') return defaultProfiles;
  
  return {
    instagram: {
      username: typeof data.instagram?.username === 'string' ? data.instagram.username : defaultProfiles.instagram.username,
      fullName: typeof data.instagram?.fullName === 'string' ? data.instagram.fullName : defaultProfiles.instagram.fullName,
      followers: typeof data.instagram?.followers === 'number' ? data.instagram.followers : defaultProfiles.instagram.followers
    },
    tiktok: {
      username: typeof data.tiktok?.username === 'string' ? data.tiktok.username : defaultProfiles.tiktok.username,
      fullName: typeof data.tiktok?.fullName === 'string' ? data.tiktok.fullName : defaultProfiles.tiktok.fullName,
      followers: typeof data.tiktok?.followers === 'number' ? data.tiktok.followers : defaultProfiles.tiktok.followers
    }
  };
};

export const useAppState = () => {
  // Years array
  const [years, setYears] = useState<number[]>(() => {
    let saved = localStorage.getItem(YEARS_STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(OLD_YEARS_STORAGE_KEY);
      if (saved) {
        localStorage.setItem(YEARS_STORAGE_KEY, saved);
      }
    }
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved years", e);
      }
    }
    // Default years 2024 to 2030
    const list: number[] = [];
    for (let y = 2024; y <= 2030; y++) list.push(y);
    return list;
  });

  // Folders state
  const [folders, setFolders] = useState<FolderDataState>(() => {
    let saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(OLD_FOLDERS_STORAGE_KEY);
      if (saved) {
        localStorage.setItem(FOLDERS_STORAGE_KEY, saved);
      }
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return migrateFoldersData(parsed);
      } catch (e) {
        console.error("Error parsing saved folders", e);
      }
    }
    // Default folders with mock data
    return getInitialMockFolders();
  });

  // Profile followers state
  const [profiles, setProfiles] = useState<PlatformProfiles>(() => {
    let saved = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(OLD_PROFILES_STORAGE_KEY);
      if (saved) {
        localStorage.setItem(PROFILES_STORAGE_KEY, saved);
      }
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return migrateProfilesData(parsed);
      } catch (e) {
        console.error("Error parsing saved profiles", e);
      }
    }
    // Default profiles
    return getInitialProfiles();
  });

  // Persist values on change
  useEffect(() => {
    localStorage.setItem(YEARS_STORAGE_KEY, JSON.stringify(years));
  }, [years]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  // Methods
  const addYear = (year: number) => {
    if (years.includes(year)) return false;
    
    // Sort years ascending
    const updatedYears = [...years, year].sort((a, b) => a - b);
    setYears(updatedYears);

    // Initialize months 0-11 for this year
    setFolders(prev => {
      const updated = { ...prev };
      updated[year] = {};
      for (let m = 0; m < 12; m++) {
        updated[year][m] = [];
      }
      return updated;
    });
    
    return true;
  };

  const addContent = (year: number, monthIndex: number, entry: Omit<ContentEntry, 'id'>) => {
    const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEntry: ContentEntry = { id, ...entry };

    setFolders(prev => {
      const updated = { ...prev };
      if (!updated[year]) {
        updated[year] = {};
      } else {
        updated[year] = { ...updated[year] };
      }
      if (!updated[year][monthIndex]) {
        updated[year][monthIndex] = [];
      }
      updated[year][monthIndex] = [...updated[year][monthIndex], newEntry].sort((a, b) => a.day - b.day);
      return updated;
    });
  };

  const editContent = (year: number, monthIndex: number, id: string, entry: Omit<ContentEntry, 'id'>) => {
    setFolders(prev => {
      const updated = { ...prev };
      if (updated[year]?.[monthIndex]) {
        updated[year] = { ...updated[year] };
        updated[year][monthIndex] = updated[year][monthIndex]
          .map(item => item.id === id ? { ...item, ...entry } : item)
          .sort((a, b) => a.day - b.day);
      }
      return updated;
    });
  };

  const deleteContent = (year: number, monthIndex: number, id: string) => {
    setFolders(prev => {
      const updated = { ...prev };
      if (updated[year]?.[monthIndex]) {
        updated[year] = { ...updated[year] };
        updated[year][monthIndex] = updated[year][monthIndex].filter(item => item.id !== id);
      }
      return updated;
    });
  };

  const deleteYear = (year: number) => {
    setYears(prev => prev.filter(y => y !== year));
    setFolders(prev => {
      const updated = { ...prev };
      delete updated[year];
      return updated;
    });
  };

  const updateProfile = (platform: PlatformType, username: string, fullName: string, followers: number) => {
    setProfiles(prev => ({
      ...prev,
      [platform]: {
        username,
        fullName,
        followers
      }
    }));
  };

  const exportData = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        years,
        profiles,
        folders
      };
      const jsonString = JSON.stringify(backup, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `aswrapped_backup_${dateStr}.json`;

      // Check if running inside Tauri environment
      if ((window as any).__TAURI_INTERNALS__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const savedPath = await invoke<string>('save_backup_file', { content: jsonString, filename });
          return { success: true, message: `Disimpan di:\n${savedPath}` };
        } catch (tauriErr) {
          console.error("Tauri native export failed, falling back to browser download", tauriErr);
        }
      }

      // Browser fallback
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, message: `File cadangan berhasil diunduh: ${filename}` };
    } catch (err) {
      console.error("Failed to export data", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          
          if (!parsed || typeof parsed !== 'object') {
            throw new Error("Format file cadangan tidak valid.");
          }

          // Validate and parse years
          let importedYears = parsed.years;
          if (!Array.isArray(importedYears)) {
            importedYears = [];
          }
          importedYears = importedYears
            .map((y: any) => parseInt(y, 10))
            .filter((y: number) => !isNaN(y) && y >= 2000 && y <= 2100);
          
          // Validate and migrate profiles
          const importedProfiles = migrateProfilesData(parsed.profiles);

          // Validate and migrate folders
          const importedFolders = migrateFoldersData(parsed.folders);

          // Ensure imported years match the years actually present in folders
          const folderYears = Object.keys(importedFolders)
            .map(y => parseInt(y, 10))
            .filter(y => !isNaN(y));
          
          const uniqueYearsSet = new Set([...importedYears, ...folderYears]);
          if (uniqueYearsSet.size === 0) {
            for (let y = 2024; y <= 2030; y++) uniqueYearsSet.add(y);
          }
          const finalYears = Array.from(uniqueYearsSet).sort((a, b) => a - b);

          setYears(finalYears);
          setProfiles(importedProfiles);
          setFolders(importedFolders);

          resolve(true);
        } catch (err) {
          console.error("Failed to import data", err);
          alert("Gagal mengimpor data. Pastikan file JSON yang Anda pilih adalah file cadangan As-Wrapped yang valid.\nError: " + (err instanceof Error ? err.message : String(err)));
          resolve(false);
        }
      };
      reader.onerror = () => {
        alert("Gagal membaca file.");
        resolve(false);
      };
      reader.readAsText(file);
    });
  };

  return {
    years,
    folders,
    profiles,
    addYear,
    deleteYear,
    addContent,
    editContent,
    deleteContent,
    updateProfile,
    exportData,
    importData
  };
};
