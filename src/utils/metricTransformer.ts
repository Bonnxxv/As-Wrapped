import { ContentEntry } from '../types';

/**
 * Safe division helper that returns a value rounded to 2 decimal places as a float.
 * Handles division by zero by returning 0.
 * 
 * @param {number} numerator 
 * @param {number} denominator 
 * @param {number} multiplier 
 * @returns {number}
 */
const safeDivideAndRound = (numerator: number, denominator: number, multiplier: number = 1): number => {
  if (!denominator || denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * multiplier).toFixed(2));
};

/**
 * Transforms raw content entry array by calculating and injecting analytics metrics
 * for Instagram and TikTok individually, as well as cross-platform comparative metrics.
 * 
 * @param {ContentEntry[]} contentArray - Array of content entry objects.
 * @returns {ContentEntry[]} - New array of content entry objects with calculated analytics.
 */
export function transformContentMetrics(contentArray: ContentEntry[]): ContentEntry[] {
  if (!Array.isArray(contentArray)) {
    return [];
  }

  return contentArray.map(content => {
    const ig = content.instagram || { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 };
    const tt = content.tiktok || { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 };

    // Calculate Instagram Analytics
    const igUtilityRate = safeDivideAndRound(ig.saves, ig.views, 100);
    const igResonanceRate = safeDivideAndRound(ig.shares, ig.views, 100);
    const igTotalEngagement = (ig.likes || 0) + (ig.comments || 0) + (ig.saves || 0) + (ig.shares || 0);
    const igTrueEngagement = safeDivideAndRound(igTotalEngagement, ig.views, 100);
    const igSavesPerMille = safeDivideAndRound(ig.saves, ig.views, 1000);

    // Calculate TikTok Analytics
    const ttUtilityRate = safeDivideAndRound(tt.saves, tt.views, 100);
    const ttResonanceRate = safeDivideAndRound(tt.shares, tt.views, 100);
    const ttTotalEngagement = (tt.likes || 0) + (tt.comments || 0) + (tt.saves || 0) + (tt.shares || 0);
    const ttTrueEngagement = safeDivideAndRound(ttTotalEngagement, tt.views, 100);
    const ttSavesPerMille = safeDivideAndRound(tt.saves, tt.views, 1000);

    // Cross-platform variance multiplier: (Instagram Views / TikTok Views)
    const varianceMultiplier = safeDivideAndRound(ig.views, tt.views, 1);

    return {
      ...content,
      analytics: {
        instagram: {
          utilityRate: igUtilityRate,
          resonanceRate: igResonanceRate,
          trueEngagement: igTrueEngagement,
          savesPerMille: igSavesPerMille
        },
        tiktok: {
          utilityRate: ttUtilityRate,
          resonanceRate: ttResonanceRate,
          trueEngagement: ttTrueEngagement,
          savesPerMille: ttSavesPerMille
        },
        varianceMultiplier
      }
    };
  });
}
