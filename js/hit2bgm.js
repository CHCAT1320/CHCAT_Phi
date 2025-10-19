const AudioProcessor = {
  audioContext: null,
  originalBuffer: null,
  originalDuration: 0,
  soundBuffers: [],
  soundUrls: [       // 4个固定音效路径
    "audio/tap.wav",
    "audio/tap.wav",
    "audio/flick.wav",
    "audio/drag.wav"
  ],
  hits: []           // 存储插入的音效 [{type, time}]
};

// 1. 初始化：加载原音频和预加载音效
async function hit2bgm() {
  try {
    const audio = document.getElementById("audio");
    if (!audio) throw new Error("未找到ID为'audio'的音频元素");
    
    // 初始化音频上下文
    AudioProcessor.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 加载原音频
    const response = await fetch(audio.src);
    const arrayBuffer = await response.arrayBuffer();
    AudioProcessor.originalBuffer = await AudioProcessor.audioContext.decodeAudioData(arrayBuffer);
    AudioProcessor.originalDuration = AudioProcessor.originalBuffer.duration;
    console.log(`原音频加载完成，时长：${AudioProcessor.originalDuration.toFixed(2)}秒`);
    
    // 预加载4个固定音效
    for (let i = 0; i < 4; i++) {
      const res = await fetch(AudioProcessor.soundUrls[i]);
      const buf = await res.arrayBuffer();
      AudioProcessor.soundBuffers[i] = await AudioProcessor.audioContext.decodeAudioData(buf);
    }
    console.log("4个音效预加载完成，可调用putHit(type, time)插入音效");
  } catch (err) {
    console.error("初始化失败：", err);
  }
}

// 2. 插入音效
function putHit(type, time) {
  if (!AudioProcessor.audioContext) {
    console.error("请先调用hit2bgm()初始化");
    return;
  }
  if (type < 0 || type > 3) {
    console.error("type必须是0-3之间的整数");
    return;
  }
  if (time < 0 || time > AudioProcessor.originalDuration) {
    console.error(`time必须在0~${AudioProcessor.originalDuration.toFixed(2)}秒之间`);
    return;
  }
  
  AudioProcessor.hits.push({ type, time });
  console.log(`已在原音频${time}秒处插入音效${type}`);
}

// 3. 生成最终音频（使用WAV格式，兼容性更好）
async function exportResult() {
  if (AudioProcessor.hits.length === 0) {
    console.error("请先调用putHit()插入音效");
    return null;
  }
  
  // 计算最终音频时长
  let finalDuration = AudioProcessor.originalDuration;
  AudioProcessor.hits.forEach(({ type, time }) => {
    const soundLen = AudioProcessor.soundBuffers[type].duration;
    finalDuration = Math.max(finalDuration, time + soundLen);
  });
  
  // 创建离线上下文
  const offlineCtx = new OfflineAudioContext(
    2, 
    Math.ceil(AudioProcessor.audioContext.sampleRate * finalDuration),
    AudioProcessor.audioContext.sampleRate
  );
  
  // 添加原音频
  const originalSource = offlineCtx.createBufferSource();
  originalSource.buffer = AudioProcessor.originalBuffer;
  originalSource.connect(offlineCtx.destination);
  originalSource.start(0);
  
  // 添加所有插入的音效
  AudioProcessor.hits.forEach(({ type, time }) => {
    const source = offlineCtx.createBufferSource();
    source.buffer = AudioProcessor.soundBuffers[type];
    source.connect(offlineCtx.destination);
    source.start(time);
  });
  
  // 渲染音频
  const renderedBuffer = await offlineCtx.startRendering();
  
  // 将AudioBuffer转换为WAV格式的Blob（兼容性更好）
  const wavBlob = audioBufferToWav(renderedBuffer);
  
  // 返回DataURL
  return URL.createObjectURL(wavBlob);
}

// 辅助函数：将AudioBuffer转换为WAV格式
function audioBufferToWav(buffer) {
  const numOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM格式
  const bitDepth = 16; // 16位
  
  // 合并所有声道
  const result = new Float32Array(buffer.length * numOfChannels);
  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < numOfChannels; j++) {
      result[offset++] = buffer.getChannelData(j)[i];
    }
  }
  
  // 转换为16位整数
  const bytes = convertFloat32ToInt16(result);
  
  // 创建WAV文件头
  const header = createWavHeader(
    bytes.length,
    numOfChannels,
    sampleRate,
    bitDepth,
    format
  );
  
  // 合并头和数据
  const wavBuffer = new Uint8Array(header.length + bytes.length);
  wavBuffer.set(header, 0);
  wavBuffer.set(bytes, header.length);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// 辅助函数：将Float32音频数据转换为Int16
function convertFloat32ToInt16(buffer) {
  const l = buffer.length;
  const buf = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    buf[i] = Math.min(1, Math.max(-1, buffer[i])) < 0 ? 
      buffer[i] * 0x8000 : buffer[i] * 0x7FFF;
  }
  return buf;
}

// 辅助函数：创建WAV文件头
function createWavHeader(dataLength, numChannels, sampleRate, bitDepth, format) {
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = dataLength * 2;
  
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF标识
  view.setUint8(0, 0x52); // 'R'
  view.setUint8(1, 0x49); // 'I'
  view.setUint8(2, 0x46); // 'F'
  view.setUint8(3, 0x46); // 'F'
  
  // 文件大小 - 8
  view.setUint32(4, 36 + dataSize, true);
  
  // WAVE标识
  view.setUint8(8, 0x57); // 'W'
  view.setUint8(9, 0x41); // 'A'
  view.setUint8(10, 0x56); // 'V'
  view.setUint8(11, 0x45); // 'E'
  
  // fmt子块
  view.setUint8(12, 0x66); // 'f'
  view.setUint8(13, 0x6D); // 'm'
  view.setUint8(14, 0x74); // 't'
  view.setUint8(15, 0x20); // ' '
  
  // fmt子块大小
  view.setUint32(16, 16, true);
  
  // 格式（PCM = 1）
  view.setUint16(20, format, true);
  
  // 声道数
  view.setUint16(22, numChannels, true);
  
  // 采样率
  view.setUint32(24, sampleRate, true);
  
  // 字节率
  view.setUint32(28, byteRate, true);
  
  // 块对齐
  view.setUint16(32, blockAlign, true);
  
  // 位深度
  view.setUint16(34, bitDepth, true);
  
  // data子块
  view.setUint8(36, 0x64); // 'd'
  view.setUint8(37, 0x61); // 'a'
  view.setUint8(38, 0x74); // 't'
  view.setUint8(39, 0x61); // 'a'
  
  // 数据大小
  view.setUint32(40, dataSize, true);
  
  return new Uint8Array(header);
}
