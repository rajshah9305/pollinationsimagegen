export interface ImageModel {
  id: string;
  name: string;
  description?: string;
}

export interface ImageGenerationParams {
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  nologo?: boolean;
  private?: boolean;
  safe?: boolean;
  negative?: string;
  referrer?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  params: ImageGenerationParams;
  timestamp: Date;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
