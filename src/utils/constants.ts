export const DEFAULT_IMAGE_PARAMS = {
  width: 1024,
  height: 1024,
  model: 'turbo', // Changed to 'turbo' for faster generation
  enhance: false,
  nologo: true, // Enable nologo for cleaner images
  private: false,
  safe: true, // Enable safe mode for better performance
} as const;

export const IMAGE_SIZES = [
  { label: 'Square (1024×1024)', width: 1024, height: 1024 },
  { label: 'Landscape (1280×720)', width: 1280, height: 720 },
  { label: 'Portrait (720×1280)', width: 720, height: 1280 },
  { label: 'Wide (1920×1080)', width: 1920, height: 1080 },
  { label: 'Mobile (1080×1920)', width: 1080, height: 1920 },
  { label: 'Custom', width: 1024, height: 1024 },
] as const;

export const MAX_PROMPT_LENGTH = 1000;
export const MAX_NEGATIVE_PROMPT_LENGTH = 500;
