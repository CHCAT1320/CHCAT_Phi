const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");
cvs.width = 720;
cvs.height = 540;
ctx.translate(cvs.width / 2, cvs.height / 2);

// 全局变量/常量
var chart;
var LineI = [];
var noteI = [];
const audio = document.getElementById("audio");
let frameCount = 0;
let lastTime = 0;

var noteImg = [];
noteImg[1] = new Image();
noteImg[1].src = "img/tap.png";
noteImg[2] = new Image();
noteImg[2].src = "img/hold.png";
noteImg[3] = new Image();
noteImg[3].src = "img/flick.png";
noteImg[4] = new Image();
noteImg[4].src = "img/drag.png";
noteImg[5] = new Image();
noteImg[5].src = "img/holdHead.png";
noteImg[6] = new Image();
noteImg[6].src = "img/holdEnd.png";

var hitI = [];
var hitImg = [];
var size = 1;
var hitAudioBuffers = [];

// 创建音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
var hitAudioBuffers = [];

// 预加载音效
function preloadSounds() {
    return new Promise((resolve, reject) => {
        const soundUrls = [
            'audio/tap.wav',
            'audio/tap.wav',
            'audio/flick.wav',
            'audio/drag.wav'
        ];
        const sounds = [];
        let loadedCount = 0;
        
        if (soundUrls.length === 0) {
            resolve(sounds);
            return;
        }
        
        soundUrls.forEach((url, index) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    sounds[index] = audioBuffer;
                    loadedCount++;
                    if (loadedCount === soundUrls.length) {
                        resolve(sounds);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    });
}


// 预加载音效
    preloadSounds()
    .then(sounds => {
        hitAudioBuffers = sounds;
        showPopup("加载完成开始播放", "info")
        audio.play();
        requestAnimationFrame(update);
    })
    .catch(error => {
        console.error('音效加载失败:', error);
        showPopup("音效加载失败将忽略音效直接播放", "error");
        // 如果音效加载失败，仍然尝试启动游戏
        audio.play();
        requestAnimationFrame(update);
    });

// 播放音效
function playSound(audioBuffer) {
    if (!audioBuffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}



// 初始化打击特效
function hitImgInit() {
    const img = new Image();
    
    img.onload = function () {
        const cvs = document.createElement("canvas");
        const ctx = cvs.getContext("2d");
        
        cvs.width = img.width;
        cvs.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        // 获取图像数据并应用金色效果
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        applyGoldenEffect(imageData.data);

        // 将修改后的图像数据放回画布
        ctx.putImageData(imageData, 0, 0);

        const columns = 6;
        const rows = 5;
        // 你这-bychuhan
        const frameWidth = img.width / columns;
        const frameHeight = img.height / rows;
        const totalFrames = columns * rows;

        // 创建一个小画布用于绘制单个帧
        const frameCvs = document.createElement("canvas");
        const frameCtx = frameCvs.getContext("2d");
        
        frameCvs.width = frameWidth;
        frameCvs.height = frameHeight;

        for (let i = 0; i < totalFrames; i++) {
            const a = i % columns;
            const b = Math.floor(i / columns);
            
            // 绘制当前帧
            frameCtx.clearRect(0, 0, frameCvs.width, frameCvs.height);
            frameCtx.drawImage(
                cvs, // 从修改后的画布中裁剪
                a * frameWidth,
                b * frameHeight,
                frameWidth,
                frameHeight,
                0,
                0,
                frameWidth,
                frameHeight
            );

            // 将当前帧的数据存入数组
            const hitImgData = new Image();
            hitImgData.src = frameCvs.toDataURL();
            hitImg.push(hitImgData);
        }

        console.log("所有帧已加载完成，总帧数：", hitImg.length);
        // showPopup("打击特效加载完成，总帧数：" + hitImg.length, "info");
    };
    
    img.onerror = function () {
        console.error("图像加载失败");
        showPopup("图像加载失败", "error");
    };
    
    img.src = "img/hit.png";
}

function applyGoldenEffect(data) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 236;
        data[i + 2] = 160;
    }
}
// 调用打击特效切图
// showPopup("正在加载打击特效，请稍候...", "info");
hitImgInit();


// 解析谱面
function readChart(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            console.log(data);
            if (data.META.RPEVersion) {
                console.log("已知谱面格式RE:PhiEdit = " + data.META.RPEVersion);
                chart = data;
            } else {
                console.error("未知谱面格式");
            }
        } catch (error) {
            console.log(error);
        }
    };
    reader.readAsText(file);
}

// 加载bgm
function bgmFiles(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log("音乐文件");
            audio.src = URL.createObjectURL(file);
        } catch(error) {
            console.log(error);
        }
    };
    reader.readAsText(file);
}


/**
 * 线性插值
 * @param {number} s 
 * @param {number} e 
 * @param {number} sT 
 * @param {number} eT 
 * @param {number} nowTime 
 * @returns {number}
 */
function linearInterpolation(s, e, t) {
    return s + (e - s) * t;
}

/**
 * 将节拍转换为秒
 * @param {Array<number>} beatArray 
 * @param {number} bpmFactor 
 * @returns {number}
 */
function beatToTimer(beatArray, bpmFactor = 1) {
  const targetBeat = beatArray[0] + beatArray[1] / beatArray[2];
  let seconds = 0.0;
  let currentBeat = 0.0;

  for (let i = 0; i < chart.BPMList.length; i++) {
    const currentBpmEvent = chart.BPMList[i];
    const bpmv = currentBpmEvent.bpm / bpmFactor;

    let nextBeat;
    if (i === chart.BPMList.length - 1) {
      // 如果是最后一个 BPM 段，计算到目标节拍
      nextBeat = targetBeat;
    } else {
      // 计算到下一个 BPM 段的开始节拍
      nextBeat = chart.BPMList[i + 1].startTime[0] + chart.BPMList[i + 1].startTime[1] / chart.BPMList[i + 1].startTime[2];
    }

    // 计算当前 BPM 段内的节拍差
    const segmentBeats = Math.min(nextBeat, targetBeat) - currentBeat;

    if (segmentBeats > 0) {
      // 计算当前 BPM 段内的秒数
      const segmentSeconds = segmentBeats * (60 / bpmv);
      seconds += segmentSeconds;
    }

    if (nextBeat >= targetBeat) {
      // 如果当前 BPM 段已覆盖目标节拍，退出循环
      break;
    }

    // 更新当前节拍位置
    currentBeat = nextBeat;
  }

  return seconds;
}

// 获取指定时间（秒）下的 BPM
function getBPMAtTime(timeInSeconds, bpmFactor = 1.0) {
    const bpmList = chart.BPMList;
    if (bpmList.length === 0) {
        return 140 * bpmFactor; // 如果 BPM 列表为空，默认初始 BPM 为 140
    }

    let currentBpm = bpmList[0].bpm;
    let currentBeat = 0.0;
    let seconds = 0.0;

    for (let i = 0; i < bpmList.length; i++) {
        const bpmEvent = bpmList[i];
        const bpmv = bpmEvent.bpm * bpmFactor;

        // 将当前 BPM 事件的开始节拍转换为数值
        const eventBeat = bpmEvent.startTime[0] + bpmEvent.startTime[1] / bpmEvent.startTime[2];

        // 计算当前 BPM 段的节拍差
        const segmentBeats = eventBeat - currentBeat;

        // 计算当前 BPM 段的秒数
        const segmentSeconds = segmentBeats * (60 / bpmv);

        // 如果目标时间在当前 BPM 段内，返回当前 BPM 并退出循环
        if (seconds + segmentSeconds >= timeInSeconds) {
            currentBpm = bpmEvent.bpm;
            break;
        }

        // 更新当前节拍和秒数
        currentBeat = eventBeat;
        seconds += segmentSeconds;
    }

    return currentBpm * bpmFactor;
}

class lines {
    constructor(index) {
        this.index = index;
        this.judgeLine = chart.judgeLineList[index];
        this.eventLayers = this.judgeLine.eventLayers;
        this.xEvents = this.fillEvents(this.eventLayers[0].moveXEvents)
        this.yEvents = this.fillEvents(this.eventLayers[0].moveYEvents);
        this.rEvents = this.fillEvents(this.eventLayers[0].rotateEvents);
        this.dEvents = this.fillEvents(this.eventLayers[0].alphaEvents);
        this.sEvents = this.fillEvents(this.eventLayers[0].speedEvents);
        // console.log(this.xEvents)
        // console.log(this.yEvents)
        // console.log(this.rEvents)
        // console.log(this.dEvents)
        // console.log(this.sEvents)
        this.prepareSpeedEvents();
        console.log(this.sEvents)
        console.log(this.judgeLine)
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.d = 0;
        this.fp = 0;
        this.bpmFactor = this.judgeLine.bpmfactor
        console.log(this.bpmFactor)
;
    }
    prepareSpeedEvents() {
        let fp = 0;
        for (let i = 0; i < this.sEvents.length; i++) {
            const st = beatToTimer(this.sEvents[i].startTime);
            const et = beatToTimer(this.sEvents[i].endTime);
            const s = this.sEvents[i].start// / 900 * cvs.height * 120;
            const e = this.sEvents[i].end// / 900 * cvs.height * 120;
            this.sEvents[i].fp = fp;
            fp += (e + s) * (et - st) / 2;
        }
    }
    fillEvents(events) {
        events.sort((a, b) => beatToTimer(a.startTime) - beatToTimer(b.startTime));
        
        let i = 0;
        while (i < events.length - 1) {
            const current = events[i];
            const next = events[i + 1];
            
            if (current.endTime !== next.startTime) { // 存在时间间隙
                const fillEvent = {
                    startTime: current.endTime,
                    endTime: next.startTime,
                    start: current.end,
                    end: current.end,
                    easingType: 1
                };
                events.splice(i + 1, 0, fillEvent);
            } //else if (current.endTime > next.startTime) {
            //     console.warn("Events overlap at index:", i);
            // }
            
            i++;
        }
        const fillEvent = {
            startTime: events[events.length - 1].endTime,
            endTime: [9999999, 99, 99],
            start: events[events.length - 1].end,
            end: events[events.length - 1].end,
            easingType: 1
        };
        events.push(fillEvent);
        // events.sort((a, b) => beatToTimer(a.startTime, this.bpmFactor) - beatToTimer(b.startTime, this.bpmFactor));
        return events;
    }
    // 查找并计算事件
    findEvent(es, timer, skey, ekey) {
        let left = 0;
        let right = es.length - 1;
        let result = 0.0;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            let currentEvent = es[mid];

            if (timer >= beatToTimer(currentEvent.startTime) && timer <= beatToTimer(currentEvent.endTime)) {
                result = easeFuncs[currentEvent.easingType - 1]((timer - beatToTimer(currentEvent.startTime)) / (beatToTimer(currentEvent.endTime) - beatToTimer(currentEvent.startTime)))
                result = result * ((currentEvent[ekey] - currentEvent[skey])) + currentEvent[skey];
                break;
            } else if (timer < beatToTimer(currentEvent.startTime)) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return result;
    }
    // 查找并计算速度事件
    findSpeedEvent(es, timer) {
        let left = 0;
        let right = es.length - 1;
        let result = 0.0;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            let currentEvent = es[mid];

            if (timer >= beatToTimer(currentEvent.startTime) && timer <= beatToTimer(currentEvent.endTime)) {
                let eV = currentEvent;
                result = eV.fp + (linearInterpolation(eV.start , eV.end, (timer - beatToTimer(eV.startTime)) / (beatToTimer(eV.endTime) - beatToTimer(eV.startTime))) + eV.start) * (timer - beatToTimer(eV.startTime)) / 2;
                break;
            } else if (timer < beatToTimer(currentEvent.startTime)) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return result;
    }
    getLineEvent(timer) {
        this.x = this.findEvent(this.xEvents, timer, "start", "end") / 1350 * cvs.width;
        this.y = -this.findEvent(this.yEvents, timer, "start", "end") / 900 * cvs.height;
        this.r = this.findEvent(this.rEvents, timer, "start", "end") * Math.PI / 180;
        this.d =  1 - (255 - this.findEvent(this.dEvents, timer, "start", "end")) / 255;
        this.fp = this.findSpeedEvent(this.sEvents, timer);
    }
    drawLine(){
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(255,255,170,${this.d})`;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.moveTo(-(cvs.width * 3) / 2, 0);
        ctx.lineTo((cvs.width * 3) / 2, 0);
        ctx.stroke();
        ctx.font = "24px Phigros";
        const text = this.index.toString();
        const textWidth = ctx.measureText(text).width;
        ctx.translate(-textWidth / 2, 0);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }
}

class notes{
    constructor(index, ln, noteIifo){
        this.index = index;
        this.noteIifo = noteIifo;
        this.above = noteIifo.above;
        this.alpha = noteIifo.alpha;
        this.endTime = beatToTimer(noteIifo.endTime);
        this.isFake = noteIifo.isFake;
        this.positionX = noteIifo.positionX / 1350 * cvs.width;
        this.size = noteIifo.size;
        this.speed = noteIifo.speed;
        this.startTime = beatToTimer(noteIifo.startTime);
        this.type = noteIifo.type;
        this.visibleTime = noteIifo.visibleTime;
        // this.yOffset = noteIifo.yOffset / 900 * cvs.height;
        this.fp = LineI[ln].findSpeedEvent(LineI[ln].sEvents, this.startTime);
        // console.log(this.fp)
        this.efp = LineI[ln].findSpeedEvent(LineI[ln].sEvents, this.endTime);
        this.ln = ln;
        this.ht = this.startTime;
        this.isHoldHit = false;
    }
    drawNote(timer){
        const y = (LineI[this.ln].fp - this.fp) / 7 * cvs.height;
        const x = LineI[this.ln].x;
        if (timer > this.startTime && timer > this.endTime){
            if (this.type !== 2) hitI.push(new hit(this.ln, this.positionX, this.startTime));
            if (this.type !== 2) playSound(hitAudioBuffers[this.type - 1]);
            noteI[this.index] = null;
            return;
        }
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, LineI[this.ln].y);
        ctx.rotate(LineI[this.ln].r);
        const img = noteImg[this.type];
        const imgWidth = 100;

        ctx.globalAlpha = this.alpha;
        if (this.type === 2) {
            const h = (this.fp - this.efp) / 7 * cvs.height / 1.9;
            const imgHeight = h / img.width * img.height;
            const imgX = -imgWidth / 2 + this.positionX;
            const imgY = y;
            if (timer < this.startTime){
                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
            }
            if (timer >= this.startTime && timer <= this.endTime){
                const h = (LineI[this.ln].fp - this.efp) / 7 * cvs.height / 1.9;
                const imgHeight = h / img.width * img.height;
                const imgX = -imgWidth / 2 + this.positionX;
                const imgY = 0;
                const bpm = getBPMAtTime(timer);
                if (this.isHoldHit === false){
                    playSound(hitAudioBuffers[this.type - 1]);
                    this.isHoldHit = true;
                }
                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
                if (timer > this.ht){
                    hitI.push(new hit(this.ln, this.positionX, timer));
                    this.ht = timer + 30 / bpm;
                }
            }
        }else{
            const imgHeight = 100 / img.width * img.height;
            const imgX = -imgWidth / 2 + this.positionX;
            const imgY = -imgHeight / 2 + y;
            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
        }
        ctx.restore()
    }
}

// 打击特效类
class hit {
    constructor(ln, offsetX, ht) {
        this.ln = ln;
        this.offsetX = offsetX; // hit 相对于 line 的 x 轴偏移量
        this.y = LineI[ln].y - ((256 / 3) * size) + (10 * size);
        this.x = LineI[ln].x - ((256 / 4) * size) - (10 * size);
        // 哎呀，上次不小心写反了
        this.r = LineI[ln].r
        this.ht = ht;
        // 随机生成 3 个 hit 的 block 初始角度 / 是 4 个！！！！！！！！！！！！！！！！
        this.blockR = [Math.random() * 360 * Math.PI / 180, Math.random() * 360 * Math.PI / 180, Math.random() * 360 * Math.PI / 180, Math.random() * 360 * Math.PI / 180];
        this.blockOffset = 0;
        this.blockD = 1;
        this.blockSize = 15 * size;
    }
    drawHit(timer) {
        // 如果 timer < hit 生成时间 + 0.5，则不绘制 hit
        if (timer >= this.ht + 0.5) return;
        ctx.save();
        ctx.beginPath();
        // 利用三角函数计算 hit 在画布上的坐标
        const hitX = this.x + this.offsetX * Math.cos(this.r);
        const hitY = this.y + this.offsetX * Math.sin(this.r);
        // 绘制 hit
        ctx.drawImage(
            hitImg[Math.floor(30 * ((timer - this.ht) / 0.5))],
            hitX,
            hitY,
            (256 / 1.7) * size,
            (256 / 1.7) * size
        );
        ctx.restore();
        // 绘制 hit 的 block
        this.drawBlock(timer, hitX + (256 / 4) * size, hitY + (256 / 3) * size);
    }
    drawBlock(timer, x, y) {
        // 如果 timer < hit 生成时间 + 0.5，则不绘制 block
        if (timer >= this.ht + 0.5) return;
        // 缓动库计算 block 的偏移、透明度、大小
        this.blockOffset = easeFuncs[7]((timer - this.ht) / 0.5) * 120 * size;
        this.blockD = 1 - easeFuncs[8]((timer - this.ht) / 0.5);
        this.blockSize = 15 * size * 1 - easeFuncs[11]((timer - this.ht) / 0.5);
        
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 236, 160,${this.blockD})`;
        // 绘制 3 个 block / 是 4 个！！！！！！！！！！！！！！！！
        for (let i = 0; i < 5; i++) {
            const blockX = x + this.blockOffset * Math.cos(this.blockR[i]);
            const blockY = y + this.blockOffset * Math.sin(this.blockR[i]);
            ctx.fillRect(blockX, blockY, this.blockSize, this.blockSize);
        }
        ctx.restore();
    }
}

function start() {
    for (let i = 0; i < chart.judgeLineList.length; i++) {
        LineI.push(new lines(i));
    }
    let noteIndex = 0;
    for (let i = 0; i < chart.judgeLineList.length; i++) {
        if (chart.judgeLineList[i].notes) {
            for (let j = 0; j < chart.judgeLineList[i].notes.length; j++) {
                noteI.push(new notes(noteIndex, i, chart.judgeLineList[i].notes[j]));
                noteIndex++;
            }
        }
    }
    audio.play();
    function update() {
        ctx.clearRect(-cvs.width / 2, -cvs.height / 2, cvs.width, cvs.height);
        const timer = audio.currentTime;
        for (let i = 0; i < LineI.length; i++) {
            LineI[i].getLineEvent(timer);
            LineI[i].drawLine();
        }
        for (let i = 0; i < noteI.length; i++) {
            if (noteI[i] !== null){
                noteI[i].drawNote(timer);
            }
            // noteI[i].drawNote(timer);
        }
        // 更新 hit
        for (let i = 0; i < hitI.length; i++) {
            if (hitI[i] !== null) {
                if (timer >= hitI[i].ht + 0.5) hitI[i] = null;
                if (hitI[i] !== null) hitI[i].drawHit(timer);
            }
        }
        // 更新 FPS
        const now = performance.now();
        frameCount++;
        if (now - lastTime >= 100) {
            document.getElementById('fps').textContent = 'FPS: ' + frameCount * 10;
            frameCount = 0;
            lastTime = now;
        }
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}