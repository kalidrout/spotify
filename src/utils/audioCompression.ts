export interface CompressionOptions {
  sampleRate?: number;
  bitDepth?: number;
}

export async function compressAudio(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const { sampleRate = 44100, bitDepth = 16 } = options;

  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });

  // Read the file
  const arrayBuffer = await file.arrayBuffer();
  
  // Decode the audio
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    sampleRate
  );

  // Create buffer source
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  // Create compressor node
  const compressor = offlineContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  // Connect nodes
  source.connect(compressor);
  compressor.connect(offlineContext.destination);

  // Start the source
  source.start(0);

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();

  // Convert to WAV format
  const wav = audioBufferToWav(renderedBuffer, bitDepth);
  
  return new Blob([wav], { type: 'audio/wav' });
}

function audioBufferToWav(buffer: AudioBuffer, bitDepth: number): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = bitDepth === 16 ? 1 : 3; // PCM = 1, Float = 3
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const samples = buffer.getChannelData(0).length;

  const arrayBuffer = new ArrayBuffer(44 + samples * blockAlign);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples * blockAlign, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples * blockAlign, true);

  // Write audio data
  const offset = 44;
  const channels = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = channels[channel][i];
      if (bitDepth === 16) {
        view.setInt16(offset + (i * blockAlign) + (channel * bytesPerSample), 
          sample * 32767, true);
      } else {
        view.setFloat32(offset + (i * blockAlign) + (channel * bytesPerSample), 
          sample, true);
      }
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}