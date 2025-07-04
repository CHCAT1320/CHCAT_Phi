// 获取 canvas 元素
const canvas = document.getElementById("canvas");
// 获取 canvas 上下文
const ctx = canvas.getContext("2d");
// 设置 canvas 宽高
canvas.width = 720;
canvas.height = 540;
// 改为原点在中心
ctx.translate(canvas.width / 2, canvas.height / 2);

// 全局变量/常量
var chart;
const audio = document.getElementById("audio");
let frameCount = 0;
let lastTime = 0;
var linesI = [];
var hitI = [];
var hitImg = [];
var noteI = [];
var noteImg = [];
noteImg[1] = new Image();
noteImg[1].src = "img/tap.png";
noteImg[2] = new Image();
noteImg[2].src = "img/drag.png";
noteImg[3] = new Image();
noteImg[3].src = "img/hold.png";
noteImg[4] = new Image();
noteImg[4].src = "img/flick.png";
noteImg[5] = new Image();
noteImg[5].src = "img/holdHead.png";
noteImg[6] = new Image();
noteImg[6].src = "img/holdEnd.png";
var combo = 0;
var comboText = "CATPLAY";
var score = 0;
var bg;
var pauseImg = new Image();
pauseImg.src = "img/pause.png";
var timerLineImg = new Image();
timerLineImg.src = "img/timerLine.png";
var speedEventSpeed = 1;

// 创建音频上下文
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
var hitAudioBuffers = [];

// 预加载音效
function preloadSounds() {
    return new Promise((resolve, reject) => {
        const soundUrls = [
            'audio/tap.wav',
            'audio/drag.wav',
            'audio/tap.wav',
            'audio/flick.wav'
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

        const frameWidth = 256;
        const frameHeight = 256;
        const columns = 6;
        const rows = 5;
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
    };
    
    img.onerror = function () {
        console.error("图像加载失败");
    };
    
    img.src = "img/hit.png";
}

// 金色效果函数
function applyGoldenEffect(data) {
    const intensity = 3; // 金色强度
    for (let i = 0; i < data.length; i += 4) {
        const grayValue = data[i]; // 红色通道作为亮度基准
        data[i] = Math.min(255, grayValue + intensity * 100);       // 红色增加
        data[i + 1] = Math.min(255, grayValue + intensity * 80);    // 绿色增加
        data[i + 2] = Math.max(0, grayValue - intensity * 20);      // 蓝色减少
    }
}
// 调用打击特效切图
hitImgInit();

// 解析谱面
function readChart(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            console.log(data);
            if ("formatVersion" in data) {
                console.log("已知谱面格式formatVersion = " + data.formatVersion);
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

// 加载曲绘
function bgFiles(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log("背景文件");
            bg = new Image();
            bg.src = URL.createObjectURL(file);
            bg.onload = function() {
                console.log("背景加载完成");
                const bgCvs = document.createElement("canvas");
                const bgCtx = bgCvs.getContext("2d");
                bgCvs.width = canvas.width;
                bgCvs.height = canvas.height;
                bgCtx.filter = 'blur(10px) brightness(0.5)';
                bgCtx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, canvas.width, canvas.height);
                bg = bgCvs;
            }
        } catch(error) {
            console.log(error);
        }
    };
    reader.readAsText(file);
}

/**
 * 把秒转换成phi谱面时间
 * @param {number} time 
 * @param {number} bpm 
 * @returns {number}
 */
function bpmToTime(time, bpm) {
    return time * bpm / 1.875;
}

/**
 * 线性插值
 * @param {number} s 
 * @param {number} e 
 * @param {number} sT 
 * @param {number} eT 
 * @param {number} NowTime 
 * @returns {number}
 */
function linearInterpolation(s, e, sT, eT, NowTime) {
    return s + (e - s) * ((NowTime - sT) / (eT - sT));
}

// 判定线类
class lines {
    constructor (ln){
        this.lineNumber = ln;
        this.bpm = chart.judgeLineList[this.lineNumber].bpm;
        this.lineMoveEvent = chart.judgeLineList[this.lineNumber].judgeLineMoveEvents;
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.d = 0;
        this.lineRotateEvent = chart.judgeLineList[this.lineNumber].judgeLineRotateEvents;
        this.lineDisappearEvent = chart.judgeLineList[this.lineNumber].judgeLineDisappearEvents;
        this.speedEvent = chart.judgeLineList[this.lineNumber].speedEvents;
        this.setSpeedEventFp();
        this.fp = 0;
    }
    // 查找并计算事件
    findEvent(es, timer, skey, ekey) {
        let left = 0;
        let right = es.length - 1;
        let result = 0.0;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            let currentEvent = es[mid];

            if (timer >= currentEvent.startTime && timer <= currentEvent.endTime) {
                result = linearInterpolation(currentEvent[skey], currentEvent[ekey], currentEvent.startTime, currentEvent.endTime, timer);
                break;
            } else if (timer < currentEvent.startTime) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return result;
    }
    // 获取判定线坐标
    getLineMove(timer) {
        timer = bpmToTime(timer, this.bpm);
        this.x = (this.findEvent(this.lineMoveEvent, timer, "start", "end") - 0.5) * canvas.width;
        this.y = -(this.findEvent(this.lineMoveEvent, timer, "start2", "end2") - 0.5) * canvas.height;
    }
    // 获取判定线旋转角度
    getLineR(timer) {
        timer = bpmToTime(timer, this.bpm);
        this.r = -this.findEvent(this.lineRotateEvent, timer, "start", "end");
    }
    // 获取判定线消失事件
    getLineD(timer) {
        timer = bpmToTime(timer, this.bpm);
        this.d = this.findEvent(this.lineDisappearEvent, timer, "start", "end");
    }
    // 计算每个速度事件的fp
    setSpeedEventFp() {
        for (let i = 0; i < this.speedEvent.length; i++) {
            this.speedEvent[i].startTime = this.speedEvent[i].startTime / this.bpm * 1.875;
            this.speedEvent[i].endTime = this.speedEvent[i].endTime / this.bpm * 1.875;
            if(i === 0){
                this.speedEvent[i].fp = 0;
            }else{
                this.speedEvent[i].fp = this.speedEvent[i-1].fp + this.speedEvent[i-1].value * (this.speedEvent[i].startTime - this.speedEvent[i-1].startTime);
            }
        }
    }
    // 查找并计算速度事件
    findSpeedEvent(es, timer) {
        let left = 0;
        let right = es.length - 1;
        let result = 0.0;
        let lastFp = 0;

        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            let currentEvent = es[mid];

            if (timer >= currentEvent.startTime && timer <= currentEvent.endTime) {
                if (mid !== 0) lastFp = es[mid-1].fp + es[mid-1].value * (timer - es[mid-1].startTime);
                result = currentEvent.fp + (currentEvent.value * (timer - currentEvent.startTime))// + lastFp;
                break;
            } else if (timer < currentEvent.startTime) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return result;
    }
    // 获取判定线Fp
    getLineFp(timer) {
        this.fp = this.findSpeedEvent(this.speedEvent, timer);
    }
    // 绘制判定线
    drawLine() {
        ctx.save();
        ctx.strokeStyle = `rgba(255,255,170,${this.d})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        
        ctx.rotate(this.r * Math.PI / 180);
        ctx.moveTo(-1080,0);
        ctx.lineTo(1080,0);
        ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0)";
        ctx.font = "24px serif";
        let text = this.lineNumber.toString();
        let textWidth = ctx.measureText(text).width;
        ctx.translate(-textWidth / 2, 0);
        //ctx.fillText(text, 0, 0);
        ctx.restore();
    }
}

// note类
class note {
    constructor (index, info, ln, r) {
        this.index = index;
        this.info = info;
        this.ln = ln;
        this.type = info.type;
        this.time = info.time / chart.judgeLineList[ln].bpm * 1.875;
        this.holdTime = info.holdTime / chart.judgeLineList[ln].bpm * 1.875;
        this.x = (info.positionX * 0.05625 * canvas.width)-5;
        this.r = r;
        this.fp = info.floorPosition;
        this.speed = info.speed * speedEventSpeed;
        this.ht = this.time;
        this.isComboANDHold = false;
        this.isHoldHit = false;
    }
    // 绘制note
    drawNote(timer) {
        // 计算 note 的y坐标
        let y = this.r * -(this.fp - linesI[this.ln].fp) * 0.6 * canvas.height * speedEventSpeed;
        if (Math.abs(y) > 1620){
            if (this.time - timer > 5){
                return;
            }
        }
        // 如果 timer >= 打击时间，且 note 类型不是 Hold，则播放打击特效
        if (timer >= this.time) {
            if(this.type !== 3) {
                hitI.push(new hit(this.ln, this.x, timer));
                // 使用 Web Audio API 播放音效
                if (this.type <= hitAudioBuffers.length) {
                    playSound(hitAudioBuffers[this.type - 1]);
                }
            }
        }
        // 如果 timer >= 打击时间，且 note 类型不是 Hold，则combo++、score++
        if (timer >= this.time) {
            if(this.type !== 3) {
                combo += 1;
                score += 1000000 / noteI.length;
            } else {  // 如果 Hold 的combo没有增加，且 timer >= Hold 结束时间 - 0.1，则combo++、score++
                if(this.isComboANDHold === false) {
                    if (timer >= this.time + this.holdTime - 0.1) {
                        // 将 Hold 标记为已经combo++过
                        this.isComboANDHold = true;
                        combo += 1;
                        score += 1000000 / noteI.length;
                    }
                }
            }
        }
        // 如果音符是 Hold，且 timer >= Hold 打击时间，则播放打击特效
        if (this.type === 3 && timer >= this.time) {
            // 如果 timer >= 打击特效生成间隔，则播放打击特效
            if (timer >= this.ht) {
                hitI.push(new hit(this.ln, this.x, timer));
                // 计算下一次打击特效生成时间
                this.ht = timer + (60 / chart.judgeLineList[this.ln].bpm / 2);
                if (this.isHoldHit === false) {
                    // 使用 Web Audio API 播放音效
                    if (this.type <= hitAudioBuffers.length) {
                        playSound(hitAudioBuffers[this.type - 1]);
                    }
                    this.isHoldHit = true;
                }
            }
        }
        // 如果 timer >= note 打击时间 + 持续时间，则删除该 note
        if (timer >= this.time + this.holdTime) {
            noteI[this.index] = null;
            return;
        }
        if (this.fp - linesI[this.ln].fp < -0.001){
            if (this.type !== 3) return;
            else if (this.isHoldHit === false) return;
        }
        if (this.type === 3) if (this.speed === 0) return;
        ctx.save();
        ctx.beginPath();
        // 将画布坐标原点移到判定线中心
        ctx.translate(linesI[this.ln].x, linesI[this.ln].y);
        // 旋转画布坐标系
        ctx.rotate(linesI[this.ln].r * Math.PI / 180);

        // 如果 note 是Tap
        if (this.type === 1) {
            ctx.drawImage(noteImg[1], this.x - 45, y - 100 / noteImg[1].width * noteImg[1].height / 2, 100, 100 / noteImg[1].width * noteImg[1].height);
        }
        // 否则如果 note 是Drag
        else if (this.type === 2) {
            ctx.drawImage(noteImg[2], this.x - 45, y - 100 / noteImg[2].width * noteImg[2].height / 2, 100, 100 / noteImg[2].width * noteImg[2].height);
        }
        // 否则如果 note 是Hold
        else if (this.type === 3) {
            if (this.r === -1){
                ctx.rotate(180 * Math.PI / 180);
                y = y * -1
            }
            // 计算 hold 的 h
            let d = (0.6 * canvas.height * this.speed * this.holdTime) / 1.9;
            // 如果 timer >= Hold 打击时间，则绘制 hold 的尾巴
            if (timer >= this.time) {
                y = 0;
                d = 0.6 * canvas.height * this.speed * (this.time - timer) / 1.9 + (0.6 * canvas.height * this.speed * this.holdTime / 1.9);
                ctx.drawImage(noteImg[6], this.x - 45, (y - (d * 1.9) - 5), 100, 100 / noteImg[6].width * noteImg[6].height);
            }
            // 如果 timer < Hold 打击时间，则绘制 hold 的头和尾巴
            else {
                ctx.drawImage(noteImg[5], this.x - 45, y, 100, 100 / noteImg[5].width * noteImg[5].height);
                ctx.drawImage(noteImg[6], this.x - 45, (y - (d * 1.9) - 5), 100, 100 / noteImg[6].width * noteImg[6].height);
            }
            // 绘制 Hold 身
            ctx.drawImage(noteImg[3], this.x - 45, y, 100, -d / noteImg[3].width * noteImg[3].height);
        }
        // 否则如果 note 是 Flick
        else if (this.type === 4) {
            ctx.drawImage(noteImg[4], this.x - 45, y - 100 / noteImg[4].width * noteImg[4].height / 2, 100, 100 / noteImg[4].width * noteImg[4].height);
        }
        ctx.restore();
    }   
}

// 打击特效类
class hit {
    constructor(ln, offsetX, ht) {
        this.ln = ln;
        this.offsetX = offsetX; // hit 相对于 line 的 x 轴偏移量
        this.y = linesI[ln].y - (256 / 3) + 5;
        this.x = linesI[ln].x - (256 / 4) - 5;
        this.r = linesI[ln].r * Math.PI / 180;
        this.ht = ht;
        // 随机生成 3 个 hit 的 block 初始角度
        this.blockR = [Math.random() * 360 * Math.PI / 180, Math.random() * 360 * Math.PI / 180, Math.random() * 360 * Math.PI / 180];
        this.blockOffset = 0;
        this.blockD = 1;
        this.blockSize = 15;
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
            256 / 1.7,
            256 / 1.7
        );
        ctx.restore();
        // 绘制 hit 的 block
        this.drawBlock(timer, hitX + (256 / 4), hitY + (256 / 3));
    }
    drawBlock(timer, x, y) {
        // 如果 timer < hit 生成时间 + 0.5，则不绘制 block
        if (timer >= this.ht + 0.5) return;
        // 缓动库计算 block 的偏移、透明度、大小
        this.blockOffset = easeFuncs[7]((timer - this.ht) / 0.5) * 100;
        this.blockD = 1 - easeFuncs[8]((timer - this.ht) / 0.5);
        this.blockSize = 15 * 1 - easeFuncs[11]((timer - this.ht) / 0.5);
        
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,135,${this.blockD})`;
        // 绘制 3 个 block
        for (let i = 0; i < 3; i++) {
            const blockX = x + this.blockOffset * Math.cos(this.blockR[i]);
            const blockY = y + this.blockOffset * Math.sin(this.blockR[i]);
            ctx.fillRect(blockX, blockY, this.blockSize, this.blockSize);
        }
        ctx.restore();
    }
}

/**
 * 绘制当前的combo
 * @returns {any}
 */
function drawCombo() {
    if (combo <= 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.font = "32px Phigros";
    ctx.fillStyle = "rgb(255,255,255)";
    const text = combo.toString();
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(combo, -textWidth / 2, -canvas.height / 2 + 35);
    ctx.font = "24px Phigros";
    const ComboText = comboText.toString();
    const ComboTextWidth = ctx.measureText(ComboText).width;
    ctx.fillText(ComboText, -ComboTextWidth / 2, -canvas.height / 2 + 60);
    ctx.restore();
}

/**
 * 把分数转换为字符串，并在前面补零
 * @returns {string}
 */
function scoreToText(score) {
    if (combo >= noteI.length) return "1000000";
    const scoreText = Math.floor(score).toString().padStart(7, '0');
    return scoreText;
}

/**
 * 绘制当前的分数
 * @returns {any}
 */
function drawScore() {
    ctx.save();
    ctx.beginPath();
    ctx.font = "24px Phigros";
    ctx.fillStyle = "rgb(255,255,255)";
    const scoreText = scoreToText(score);
    const textWidth = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, canvas.width / 2 - textWidth - 25, -canvas.height / 2 + 35);
    ctx.restore();
}

/**
 * 绘制暂停按钮
 * @returns {any}
 */
function drawPause() {
    ctx.save();
    ctx.beginPath();
    ctx.drawImage(pauseImg, -canvas.width / 2 + 20, -canvas.height / 2 + 20, 20, 20);
    ctx.restore();
}

// 当图片加载完成后，绘制暂停按钮
pauseImg.onload = function() { drawPause(); };

/**
 * 绘制进度条
 * @param {number} timer
 * @returns {any}
 */
function drawTimerLine(timer) {
    ctx.save();
    ctx.beginPath();
    const x = linearInterpolation(0, canvas.width, 0, audio.duration, timer);
    ctx.drawImage(timerLineImg, x - timerLineImg.width - canvas.width - 115, -canvas.height / 2, timerLineImg.width * 1.5, timerLineImg.height * 1.5);
    ctx.restore();
}

// 当图片加载完成后，绘制进度条
timerLineImg.onload = function() { drawTimerLine(audio.currentTime); };

/**
 * 绘制水印
 * @returns {any}
 */
function drawShuiYin() {
    ctx.save();
    ctx.beginPath();
    ctx.font = "12px Phigros";
    ctx.fillStyle = "rgb(255,255,255)";
    const shuiYin = "chp-phi All code by CHCAT1320";
    const textWidth = ctx.measureText(shuiYin).width;
    ctx.fillText(shuiYin, canvas.width / 2 - textWidth - 10, canvas.height / 2 - 5);
    ctx.restore();
}

function notePretreatment(notes) {
    let notesList = notes
    notesList.sort((a, b) => a.time - b.time)
    const holdList = []
    for (let i = 0; i < notesList.length; i++) {
        if (notesList[i].type === 3) {
            const hold = notesList[i]
            notesList.splice(i, 1)
            holdList.push(hold)
            i--
        }
    }
    for (let i = 0; i < holdList.length; i++) {
        const hold = holdList[i]
        notesList.splice(0, 0, hold)
    }
    for (let i = 0; i < notesList.length; i++) {
        notesList[i].index = i
    }
    console.log(notesList)
    return notesList
}

 /**
 * 开始播放谱面
 * @returns {any}
 */
function start() {
    // 创建判定线
    for (let i = 0; i < chart.judgeLineList.length; i++) {
        linesI.push(new lines(i));
    }
    // 创建note
    let noteIndex = 0;
    for (let i = 0; i < chart.judgeLineList.length; i++) {
        for (let j = 0; j < chart.judgeLineList[i].notesAbove.length; j++) {
            let noteInfo = chart.judgeLineList[i].notesAbove[j];
            noteI.push(new note(noteIndex, noteInfo, i, 1));
            noteIndex++;
        }
        for (let j = 0; j < chart.judgeLineList[i].notesBelow.length; j++) {
            let noteInfo = chart.judgeLineList[i].notesBelow[j];
            noteI.push(new note(noteIndex, noteInfo, i, -1));
            noteIndex++;
        }
    }
    noteI = notePretreatment(noteI)

    // 预加载音效
    preloadSounds()
        .then(sounds => {
            hitAudioBuffers = sounds;
            audio.play();
            cilick();
            requestAnimationFrame(update);
        })
        .catch(error => {
            console.error('音效加载失败:', error);
            // 如果音效加载失败，仍然尝试启动游戏
            audio.play();
            cilick();
            requestAnimationFrame(update);
        });
}

function cilick() {
}

function update() {
    let timer = audio.currentTime;
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    // 如果 bg 存在，则绘制背景
    if (bg !== null && bg !== undefined) ctx.drawImage(bg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    // 更新判定线
    for (let i = 0; i < linesI.length; i++) {
        linesI[i].getLineMove(timer);
        linesI[i].getLineR(timer);
        linesI[i].getLineD(timer);
        linesI[i].getLineFp(timer);
        linesI[i].drawLine();
    }
    // 更新 note
    for (let i = 0; i < noteI.length; i++) {
        if (noteI[i] !== null) {
            noteI[i].drawNote(timer);
        }
    }
    // 更新 hit
    for (let i = 0; i < hitI.length; i++) {
        if (hitI[i] !== null) {
            if (timer >= hitI[i].ht + 0.5) hitI[i] = null;
            if (hitI[i] !== null) hitI[i].drawHit(timer);
        }
    }
    // 绘制其他
    drawCombo();
    drawScore();
    drawPause();
    drawTimerLine(timer);
    drawShuiYin();

    // 更新 FPS
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        document.getElementById('fps').textContent = 'FPS: ' + frameCount;
        frameCount = 0;
        lastTime = now;
    }

    requestAnimationFrame(update);
}

// canvas.addEventListener('mousedown', (e) => {
//     ctx.arc(e.clientX, e.clientY, 10, 0, 2 * Math.PI);
//     ctx.fill();
// });