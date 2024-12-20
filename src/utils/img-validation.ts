import { vision } from "../config/gcloud";

export const validateImageContent = async (imageBuffer: Buffer): Promise<{
    safe: boolean;
    reason?: string;
  }> => {
    try {
      const [result] = await vision.safeSearchDetection(imageBuffer);
      const safeSearch = result.safeSearchAnnotation;
  
      if (!safeSearch) {
        throw new Error('No safe search data found');
      }
  
      const checks = {
        adult: safeSearch.adult,
        violence: safeSearch.violence,
        racy: safeSearch.racy,
      };
  
      const unacceptableLevels = new Set(['LIKELY', 'VERY_LIKELY']);
  
      for (const [category, level] of Object.entries(checks)) {
        if (unacceptableLevels.has(level as string)) {
          return {
            safe: false,
            reason: `Unsafe content detected: ${category}`
          };
        }
      }
  
      return { safe: true };
    } catch (error) {
      console.error('Error during img validation:', error);
      throw error;
    }
  }