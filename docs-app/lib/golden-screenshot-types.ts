export interface GoldenScreenshot {
  name: string;
  chart: string;
  theme: string;
  path: string;
  imageUrl: string;
  sourceUrl: string;
}

export interface GoldenScreenshotResult {
  screenshots: GoldenScreenshot[];
  error?: string;
}
