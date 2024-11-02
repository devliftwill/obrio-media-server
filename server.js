import NodeMediaServer from 'node-media-server';
import { mediaServerConfig } from './config/mediaServer.js';
import { StreamService } from './services/streamService.js';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// Create frames directory
await mkdir(join(process.cwd(), 'frames'), { recursive: true });

const nms = new NodeMediaServer(mediaServerConfig);
const streamService = new StreamService();

// Handle stream events
nms.on('prePublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', StreamPath);
  const stream = nms.getSession(id);
  streamService.handleStream(stream);
});

nms.run();

console.log('RTMP server running on rtmp://localhost:1935');
console.log('HTTP server running on http://localhost:8000');