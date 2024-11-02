import vision from '@google-cloud/vision';
import { writeFile } from 'fs/promises';

export class VisionService {
  constructor() {
    this.client = new vision.ImageAnnotatorClient();
  }

  async analyzeFrame(framePath) {
    try {
      const [result] = await this.client.labelDetection(framePath);
      const labels = result.labelAnnotations;
      console.log('Frame Analysis Results:');
      labels.forEach(label => console.log(`${label.description}: ${label.score.toFixed(2)}`));
    } catch (error) {
      console.error('Error analyzing frame:', error);
    }
  }

  async saveFrame(frameData, framePath) {
    try {
      await writeFile(framePath, frameData);
      await this.analyzeFrame(framePath);
    } catch (error) {
      console.error('Error saving frame:', error);
    }
  }
}