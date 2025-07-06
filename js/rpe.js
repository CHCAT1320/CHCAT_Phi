const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");
cvs.width = 720;
cvs.height = 540;
ctx.translate(cvs.width / 2, cvs.height / 2);

// 全局变量/常量
var chart;
var bpm = 120;
var LineI = [];
const audio = document.getElementById("audio");
let frameCount = 0;
let lastTime = 0;

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

function timerToBeat (timer) {
    if (timer[1] === 0){
        return 60 / bpm * timer[0]
    }else{
        return 60 / bpm * (timer[0] + (timer[1] / timer[2]))
    }
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
        this.prepareSpeedEvents();
        console.log(this.sEvents)
        console.log(this.judgeLine)
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.d = 0;
    }
    prepareSpeedEvents() {
        const bpm = 120; // 假设 BPM 为 120
        let floorPosStart = 0;
        for (let i = 0; i < this.sEvents.length; i++) {
            const event = this.sEvents[i];
            // 转换时间
            event.startTime = timerToBeat(event.startTime);
            event.endTime = timerToBeat(event.endTime);
            if (i === 0) {
                event.fp = {
                    start: 0,
                    end: 0
                };
            } else {
                const prevEvent = this.sEvents[i - 1];
                const deltaTime = event.startTime - prevEvent.startTime;
                const value = prevEvent.start;
                event.fp = {
                    start: prevEvent.fp.end,
                    end: prevEvent.fp.end + (deltaTime * value / bpm) * 1.875
                };
            }
            // 计算当前事件的结束位置
            const deltaTimeCurrent = event.endTime - event.startTime;
            event.fp.end = event.fp.start + (deltaTimeCurrent * event.start / bpm) * 1.875;
            floorPosStart = event.fp.end;
        }
    }
    // 填充事件
    fillEvents(events) {
        //events.sort((a, b) => timerToBeat(a.startTime) - timerToBeat(b.startTime));
        for (let i = 0; i < events.length - 1; i++) {
            const event = events[i];
            const nextEvents = events[i + 1]
            if (event.endTime !== nextEvents.startTime) {
                const fillEvent = { ...event };
                fillEvent.startTime = event.endTime;
                fillEvent.endTime = nextEvents.startTime;
                fillEvent.start = event.end;
                fillEvent.end = event.end;
                fillEvent.easingType = 1;
                events.splice(i + 1, 0, fillEvent);
            }
        }
        // console.log(events)
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

            if (timer >= timerToBeat(currentEvent.startTime) && timer <= timerToBeat(currentEvent.endTime)) {
                result = easeFuncs[currentEvent.easingType - 1]((timer - timerToBeat(currentEvent.startTime)) / (timerToBeat(currentEvent.endTime) - timerToBeat(currentEvent.startTime)))
                result = result * ((currentEvent[ekey] - currentEvent[skey])) + currentEvent[skey];
                break;
            } else if (timer < timerToBeat(currentEvent.startTime)) {
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
    }
    drawLine(){
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(255,255,170,${this.d})`;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.moveTo(-10000, 0);
        ctx.lineTo(10000, 0);
        ctx.stroke();
        ctx.font = "24px serif";
        const text = this.index.toString();
        const textWidth = ctx.measureText(text).width;
        ctx.translate(-textWidth / 2, 0);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }
}

function start() {
    for (let i = 0; i < chart.judgeLineList.length; i++) {
        LineI.push(new lines(i));
    }
    audio.play();
    function update() {
        ctx.clearRect(-cvs.width / 2, -cvs.height / 2, cvs.width, cvs.height);
        const timer = audio.currentTime;
        for (let i = 0; i < LineI.length; i++) {
            LineI[i].getLineEvent(timer);
            LineI[i].drawLine();
        }
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
    requestAnimationFrame(update);
}