import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { VisionService } from './visionService.js';

export class StreamService {
  constructor() {
    this.visionService = new VisionService();
  }

  handleStream(stream) {
    let frameCount = 0;

    ffmpeg(stream)
      .fps(1)
      .on('end', () => console.log('Frame extraction finished'))
      .on('error', (err) => console.error('Error:', err))
      .on('frame', async (frame) => {
        const framePath = join(process.cwd(), 'frames', `frame-${frameCount}.jpg`);
        frameCount++;
        await this.visionService.saveFrame(frame, framePath);
      });
  }
}