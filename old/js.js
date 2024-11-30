var lineList;
var lineNumber;
let formattedDuration = 0;

// 读取判定线JSON
function ChartFiles(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);
            chartData = json;
            // console.log(json.judgeLineList); 
            // console.log(json.judgeLineList.length)
            lineList = json.judgeLineList;
            lineNumber = lineList.length;
            console.log(lineList);
            console.log(lineNumber);
        } catch (error) {
            console.error("?", error);
        }
    };
    
    reader.readAsText(file);
}
function bgm(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var audio = document.getElementById("audio")
            audio.src = URL.createObjectURL(file);
        } catch (error) {
            console.error("?", error);
        }
    };
    reader.readAsText(file);
}

function BpmToTime(time, bpm) {
    return (time / bpm) * 1.875;
}

function LinearInterpolation(s, e, sT, eT, NowTime) {
    return s + (e - s) * ((NowTime - sT) / (eT - sT));
}

class Lines {
    constructor() {
        this.linesData = {}; 
    }

    CreateLine() {
        var PlaybackWindow = document.getElementById("PlaybackWindow");
        for (var i = 0; i < lineNumber; i++) {
            var newLine = document.createElement('div');
            newLine.className = 'line';
            newLine.innerHTML = i;
            newLine.id = 'line' + i;
            PlaybackWindow.appendChild(newLine);

            this.linesData[i] = {
                index: i,
                element: newLine,
                bpm: lineList[i].bpm,
                lineMoveEventsList: lineList[i].judgeLineMoveEvents,
                lineMoveEventsValueList: Object.values(lineList[i].judgeLineMoveEvents[0]) || [],
                LineMoveNumber: 0,
                LineX: 0,
                LineY: 0,
                lineRotateEventsList: lineList[i].judgeLineRotateEvents,
                lineRotateEventsValueList: Object.values(lineList[i].judgeLineRotateEvents[0]) || [],
                LineRotateumber: 0,
                LineR: 0,
                lineDisappearEventsList: lineList[i].judgeLineDisappearEvents,
                lineDisappearEventsValueList: Object.values(lineList[i].judgeLineDisappearEvents[0]) || [],
                LineDisappearumber: 0,
                LineD: 0,
            };
        }
    }

    GetLineMove() {
        for (let i = 0; i < lineNumber; i++) {
            let lineData = this.linesData[i];
            if (formattedDuration > BpmToTime(lineData.lineMoveEventsValueList[1], lineData.bpm)) {
                lineData.LineX =0- (lineData.lineMoveEventsValueList[3] - 0.5) * 720;
                lineData.LineY =0- (lineData.lineMoveEventsValueList[5] - 0.5) * 540;
                lineData.LineMoveNumber += 1;
                lineData.lineMoveEventsValueList = Object.values(lineData.lineMoveEventsList[lineData.LineMoveNumber]) || [];
                //lineData.element.style.transform = 'translate(' + lineData.LineX + 'px,' + lineData.LineY + 'px)';
                //console.log(lineData.LineX + "?" + lineData.LineY)
            } else if (formattedDuration > BpmToTime(lineData.lineMoveEventsValueList[0], lineData.bpm)) {
                lineData.LineX = 0-LinearInterpolation(
                    (lineData.lineMoveEventsValueList[2] - 0.5) * 720,
                    (lineData.lineMoveEventsValueList[3] - 0.5) * 720,
                    BpmToTime(lineData.lineMoveEventsValueList[0], lineData.bpm),
                    BpmToTime(lineData.lineMoveEventsValueList[1], lineData.bpm),
                    formattedDuration
                );
                lineData.LineY =0- LinearInterpolation(
                    (lineData.lineMoveEventsValueList[4] - 0.5) * 540,
                    (lineData.lineMoveEventsValueList[5] - 0.5) * 540,
                    BpmToTime(lineData.lineMoveEventsValueList[0], lineData.bpm),
                    BpmToTime(lineData.lineMoveEventsValueList[1], lineData.bpm),
                    formattedDuration
                );
                //lineData.element.style.transform = 'translate(' + lineData.LineX + 'px,' + lineData.LineY + 'px)';
                //console.log(lineData.LineX + "?" + lineData.LineY)
            }
        }
    }

    GetLineRotate() {
        for (let i = 0; i < lineNumber; i++) {
            let lineData = this.linesData[i];
            //console.log(lineData.lineRotateEventsList);
            //if (lineData.lineRotateEventsList && lineData.lineRotateEventsList.length > lineData.LineRotateumber) {
                if (formattedDuration > BpmToTime(lineData.lineRotateEventsValueList[1], lineData.bpm)) {
                    lineData.LineR = lineData.lineRotateEventsValueList[3];
                    lineData.LineRotateumber += 1;
                    lineData.lineRotateEventsValueList = Object.values(lineData.lineRotateEventsList[lineData.LineRotateumber]) || [];
                    //lineData.element.style.transform = 'rotate(' + lineData.LineR + 'deg)';
                    //console.log('Rotate to ' + lineData.LineR + ' degrees');
                } else if (formattedDuration > BpmToTime(lineData.lineRotateEventsValueList[0], lineData.bpm)) {
                    lineData.LineR =LinearInterpolation(
                        lineData.lineRotateEventsValueList[2],
                        lineData.lineRotateEventsValueList[3],
                        BpmToTime(lineData.lineRotateEventsValueList[0], lineData.bpm),
                        BpmToTime(lineData.lineRotateEventsValueList[1], lineData.bpm),
                        formattedDuration
                    );
                    //lineData.element.style.transform = 'rotate(' + lineData.LineR + 'deg)';
                    //console.log('Current rotation is ' + lineData.LineR + ' degrees');
                }
            //}
        }
    }
    GetLineDisappear() {
        for (let i = 0; i < lineNumber; i++) {
            let lineData = this.linesData[i];
            if (lineData.lineDisappearEventsList && lineData.lineDisappearEventsList.length > lineData.LineDisappearumber) {
                if (formattedDuration > BpmToTime(lineData.lineDisappearEventsValueList[1], lineData.bpm)) {
                    lineData.LineD = lineData.lineDisappearEventsValueList[3];
                    lineData.LineDisappearumber += 1;
                    lineData.lineDisappearEventsValueList = Object.values(lineData.lineDisappearEventsList[lineData.LineDisappearumber]) || [];
                } else if (formattedDuration > BpmToTime(lineData.lineDisappearEventsValueList[0], lineData.bpm)) {
                    lineData.LineD = LinearInterpolation(
                        lineData.lineDisappearEventsValueList[2],
                        lineData.lineDisappearEventsValueList[3],
                        BpmToTime(lineData.lineDisappearEventsValueList[0], lineData.bpm),
                        BpmToTime(lineData.lineDisappearEventsValueList[1], lineData.bpm),
                        formattedDuration
                    );
                }
            }
        }
    }
    UpdateLine(){
        for (let i = 0; i < lineNumber; i++) {
            let lineData = this.linesData[i];
            lineData.LineX -=720
            lineData.element.style.transform = 'translate(' + lineData.LineX + 'px,' + lineData.LineY + 'px) rotate(' + lineData.LineR + 'deg) ';
            lineData.element.style.opacity = lineData.LineD;
            lineData.element.style.width = "2160px";
        }
    }
}
class Note{
    constructor() {
        this.AllNoteData = {};
    }
    CreateUpNote() {
        for (var i = 0; i < lineNumber; i++) {
            for (var a = 0; a < lineList[i].notesAbove.length; a++){
                //console.log(lineList[i].notesAbove)
            }
            // var newNote = document.createElement('div');
            // newNote.className = 'line';
            // newNote.innerHTML = i;
            // newNote.id = 'line' + i;
            // PlaybackWindow.appendChild(newNote);

            // this.AllNoteData[i] = {
            //     index: i,
            //     element: newLine,
            //     bpm: lineList[i].bpm,
            //     lineMoveEventsList: lineList[i].judgeLineMoveEvents,
            //     lineMoveEventsValueList: Object.values(lineList[i].judgeLineMoveEvents[0]) || [],
            //     LineMoveNumber: 0,
            //     LineX: 0,
            //     LineY: 0,
            //     lineRotateEventsList: lineList[i].judgeLineRotateEvents,
            //     lineRotateEventsValueList: Object.values(lineList[i].judgeLineRotateEvents[0]) || [],
            //     LineRotateumber: 0,
            //     LineR: 0,
            //     lineDisappearEventsList: lineList[i].judgeLineDisappearEvents,
            //     lineDisappearEventsValueList: Object.values(lineList[i].judgeLineDisappearEvents[0]) || [],
            //     LineDisappearumber: 0,
            //     LineD: 0,
            // };
        }
    }
}

let startTime = 0
let endTime = 0

function StartPlay() {
    let linesInstance = new Lines();
    linesInstance.CreateLine();
    let notesInstance = new Note();
    notesInstance.CreateUpNote();
    
    var audio = document.getElementById("audio")
    audio.play()
    let AudioIntervalId = setInterval(function () {
        if (audio.currentTime > 0) {
            startTime = performance.now();
            clearInterval(AudioIntervalId)
        }
    },1)
    
    let intervalId = setInterval(function () {
        if (audio.currentTime > 0) {
            linesInstance.GetLineMove();
            linesInstance.GetLineRotate();
            linesInstance.GetLineDisappear();
            linesInstance.UpdateLine();
            endTime = performance.now();
            let duration = endTime - startTime;
            formattedDuration = (duration / 1000).toFixed(3);
            document.getElementById("chartTime").innerHTML = `谱面时间：${formattedDuration}s`;
        }
        
    }, 1);
    chartAudio = audio;
    initCanvas();
    start();
}

const Res_Tap = document.querySelector(".res.tap");
const Res_TapDub = document.querySelector(".res.tapDub");
const Res_Drag = document.querySelector(".res.drag");
const Res_DragDub = document.querySelector(".res.dragDub");
const Res_Flick = document.querySelector(".res.flick");
const Res_FlickDub = document.querySelector(".res.flickDub");
const Res_HoldHead = document.querySelector(".res.holdHead");
const Res_HoldHeadDub = document.querySelector(".res.holdHeadDub");
const Res_HoldBody = document.querySelector(".res.holdBody");
const Res_HoldBodyDub = document.querySelector(".res.holdBodyDub");
const Res_HoldEnd = document.querySelector(".res.holdEnd");
const Res_HoldEndDub = document.querySelector(".res.holdEndDub");
const Res_TapSound = document.querySelector(".res.tapSound");
const Res_DragSound = document.querySelector(".res.dragSound");
const Res_FlickSound = document.querySelector(".res.flickSound");
const Res_HoldSound = document.querySelector(".res.holdSound");
const ClickEffectNum = 30;
const ClickEffects = new Array(ClickEffectNum);

for (let i = 0; i < ClickEffectNum; i++) {
    let img = new Image();
    img.src = `./resources/Note_Click_Effect/Frames/${(i + 1)}.png`;
    img.loading = "eager";
    img._n = i;
    img.onload = (e) => {
        let procsCv = document.createElement("canvas");
        procsCv.width = e.target.width;
        procsCv.height = e.target.height;
        let procsCtx = procsCv.getContext("2d");
        procsCtx.filter = "url(#clickEffectColorFilter)";
        procsCtx.drawImage(e.target, 0, 0);
        ClickEffects[e.target._n] = procsCv;
    };
}

function initCanvas() {
    cv = document.createElement("canvas");
    cv.className = "mainCanvas";
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    cv.width = window.innerWidth * window.devicePixelRatio;
    cv.height = window.innerHeight * window.devicePixelRatio;
    w = cv.width;
    h = cv.height;
    Note_width = w * 0.1234375;
    Note_MaxSize = Math.sqrt(Note_width ** 2 * 2);
}

function linearInterpolation(sv, ev, st, et, t) {
    return (t - st) / (et - st) * (ev - sv) + sv;
}

function rotatePoint(x, y, deg, r) {
    return [
        x + r * Math.cos(deg / 180 * Math.PI),
        y + r * Math.sin(deg / 180 * Math.PI)
    ];
}

function start() {
    chartAudio.play();
    NOTE_DUB_FIXSCALE = Res_HoldBodyDub.width / Res_HoldBody.width;
    if (cv.requestFullscreen) cv.requestFullscreen();

    if (chartData.formatVersion) {
        phiInit();
        phiRender();
    }
    else {
        rpeInit();
        rpeRender();
    }
}

function getPhiFP(line, t) {
    let result = 0.0;
    for (let e of line.speedEvents) {
        if (e.endTime <= t) {
            result += (e.endTime - e.startTime) * e.value;
        }
        else if (e.startTime <= t && t <= e.endTime) {
            result += (t - e.startTime) * e.value;
        }
    }
    return result * h * 0.6 * line.T;
}

function is_intersect(line_1, line_2) {
    return ! (
        Math.max(line_1[0][0], line_1[1][0]) < Math.min(line_2[0][0], line_2[1][0]) ||
        Math.max(line_2[0][0], line_2[1][0]) < Math.min(line_1[0][0], line_1[1][0]) ||
        Math.max(line_1[0][1], line_1[1][1]) < Math.min(line_2[0][1], line_2[1][1]) ||
        Math.max(line_2[0][1], line_2[1][1]) < Math.min(line_1[0][1], line_1[1][1])
    )
}

function batch_is_intersect(linesGroup1, linesGroup2) {
    let results = [];
    for (let i of linesGroup1) {
        for (let j of linesGroup2) {
            results.push(is_intersect(i, j));
        }
    }
    return results;
}

function noteCanRender_Hold(x, y, holdBodyRange) {
    for (let point of holdBodyRange) {
        if (noteCanRender_Note(...point)) return true;
    }

    return batch_is_intersect(
        [
            [holdBodyRange[0], holdBodyRange[1]],
            [holdBodyRange[1], holdBodyRange[2]],
            [holdBodyRange[2], holdBodyRange[3]],
            [holdBodyRange[3], holdBodyRange[0]]
        ],
        [
            [[0, 0], [w, 0]], [[0, 0], [0, h]],
            [[w, 0], [w, h]], [[0, h], [w, h]]
        ]
    ).some((e) => e);
}

function noteCanRender_Note(x, y) {
    return (
        -Note_MaxSize / 2 <= x &&
        x <= w + Note_MaxSize / 2 &&
        -Note_MaxSize / 2 <= y &&
        y <= h + Note_MaxSize / 2
    );
}

class phiGetDataVar {
    _findEvent(es, curBTime, skey, ekey) {
        for (let e of es) {
            if (e.startTime <= curBTime && curBTime <= e.endTime) {
                return linearInterpolation(e[skey], e[ekey], e.startTime, e.endTime, curBTime);
            }
        }
        return 0.0;
    }

    getRotate(line, curBTime) {
        return - this._findEvent(line.judgeLineRotateEvents, curBTime, "start", "end");
    }
    
    getAlpha(line, curBTime) {
        return this._findEvent(line.judgeLineDisappearEvents, curBTime, "start", "end");
    }

    getX(line, curBTime) {
        return this._findEvent(line.judgeLineMoveEvents, curBTime, "start", "end") * w;
    }

    getY(line, curBTime) {
        return (1.0 - this._findEvent(line.judgeLineMoveEvents, curBTime, "start2", "end2")) * h;
    }
}

class rpeGetDataVar {

}

function phiInit() {
    let noteTimes = {};
    let notes = [];

    _countNote = (n) => {
        if (n.time in noteTimes) noteTimes[n.time]++;
        else noteTimes[n.time] = 1;
    };

    for (line of chartData.judgeLineList) {
        line.T = 1.875 / line.bpm;
        notes = notes.concat(line.notesAbove);
        notes = notes.concat(line.notesBelow);
        for (n of line.notesAbove.concat(line.notesBelow)) {
            n.master = line;
        }
    }
    
    notes.forEach(_countNote);
    for (n of notes) {
        n.morebets = noteTimes[n.time] >= 2;

        n.effectRandomBlocks = [Math.random() * 90, Math.random() * 90, Math.random() * 90, Math.random() * 90];
        n.effectTimes = [];
        let holdStartTime = n.time * n.master.T;
        let holdEffectBlockTime = 1 / n.master.bpm * 30;
        while (true) {
            holdStartTime += holdEffectBlockTime;
            if (!(holdStartTime < (n.time + n.holdTime) * n.master.T)) break;
            n.effectTimes.push([holdStartTime, [Math.random() * 90, Math.random() * 90, Math.random() * 90, Math.random() * 90]]);
        }

        n.clicked = false;
    }

    dataGetter = new phiGetDataVar();
}

function phiProcsEffect(curTime, note, t, effectRandomBlocks) {
    let p = (curTime - t * note.master.T) / (0.5 * chartAudio.playbackRate);
    if (! (0.0 <= p <= 1.0)) return;
    let effectLineX = dataGetter.getX(note.master, t);
    let effectLineY = dataGetter.getY(note.master, t);
    let effectRotate = dataGetter.getRotate(note.master, t);
    let [effectX, effectY] = rotatePoint(effectLineX, effectLineY, effectRotate, note.positionX * w * 0.05625);
    let effectImg = ClickEffects[parseInt(p * (ClickEffectNum - 1)) + 1];
    let beforedeg = 0;
    let blockAlpha = (1.0 - p) * 0.85;
    let randomBlockR = Note_width * 1.375 * (1.0 - 2 ** (-10 * p)) / 1.35;
    let blockSize = w * 0.1234375 / 5.5 * (0.4 * Math.sin(p * Math.PI) + 0.6)
    for (let deg of effectRandomBlocks) {
        let [effectRandomX, effectRandomY] = rotatePoint(effectX, effectY, beforedeg + deg, randomBlockR);
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = `rgba(254, 255, 169, ${blockAlpha})`;
        ctx.fillRect(
            effectRandomX - blockSize / 2,
            effectRandomY - blockSize / 2,
            blockSize, blockSize
        );
        ctx.restore();
        beforedeg += 90;
    }
    ctx.drawImage(
        effectImg,
        effectX - Note_width * 1.375 / 2,
        effectY - Note_width * 1.375 / 2,
        Note_width * 1.375, Note_width * 1.375
    );
}

function phiRender() {
    let curTime = chartAudio.currentTime;
    let lineRotate, lineAlpha, lineX, lineY;
    let curBTime = null;

    if (curTime > 0.0 && chartAudio.paused) {
        setTimeout(start, 0);
        return;
    }

    ctx.clear();

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    
    for (let line of chartData.judgeLineList) {
        curBTime = curTime / line.T;

        lineRotate = dataGetter.getRotate(line, curBTime);
        lineAlpha = dataGetter.getAlpha(line, curBTime);
        lineX = dataGetter.getX(line, curBTime);
        lineY = dataGetter.getY(line, curBTime);

        let [lineX1, lineY1] = rotatePoint(lineX, lineY, lineRotate, h * 5.76 / 2);
        let [lineX2, lineY2] = rotatePoint(lineX, lineY, lineRotate + 180, h * 5.76 / 2);
        ctx.drawLineEx(lineX1, lineY1, lineX2, lineY2, h * 0.0075, `rgba(254, 255, 169, ${lineAlpha})`);

        let lineFPosition = getPhiFP(line, curBTime);

        _rnotes = (notes, above) => {
            for (let note of notes) {

                if (!note.clicked && note.time < curBTime) {
                    note.clicked = true;
                    eval(`Res_${["Tap", "Drag", "Hold", "Flick"][note.type - 1]}Sound`).cloneNode(true).play();
                }

                if ((note.time < curBTime && note.type != 3) || ((note.time + note.holdTime) < curBTime && note.type == 3)) continue;

                let noteFloorPosition = note.floorPosition * h * 0.6 - (
                    (!(note.type == 3 && note.time < curBTime)) ? lineFPosition : (
                        getPhiFP(line, note.time) + linearInterpolation(
                            note.speed * (note.holdTime * line.T) * h * 0.6, 0.0,
                            0.0, note.holdTime,
                            note.time + note.holdTime - curBTime,
                        )
                    )
                );

                if (noteFloorPosition > h * 2) continue;

                let [noteAtLineX, noteAtLineY] = rotatePoint(lineX, lineY, lineRotate, note.positionX * w * 0.05625);
                let lineToNoteRotateDeg = (above ? -90 : 90) + lineRotate;
                let [x, y] = rotatePoint(noteAtLineX, noteAtLineY, lineToNoteRotateDeg, noteFloorPosition);

                let holdDrawLength, holdEndX, holdEndY, holdHeadX, holdHeadY, holdBodyRange;
                if (note.type == 3) {
                    holdDrawLength = noteFloorPosition + note.speed * (note.holdTime * line.T) * h * 0.6;
                    [holdEndX, holdEndY] = rotatePoint(noteAtLineX, noteAtLineY, lineToNoteRotateDeg, holdDrawLength);
                    if (note.time < curBTime) [holdHeadX, holdHeadY] = [noteAtLineX, noteAtLineY];
                    else [holdHeadX, holdHeadY] = [x, y];
                    holdBodyRange = [
                        rotatePoint(holdHeadX, holdHeadY, lineToNoteRotateDeg - 90, Note_width / 2),
                        rotatePoint(holdEndX, holdEndY, lineToNoteRotateDeg - 90, Note_width / 2),
                        rotatePoint(holdEndX, holdEndY, lineToNoteRotateDeg + 90, Note_width / 2),
                        rotatePoint(holdHeadX, holdHeadY, lineToNoteRotateDeg + 90, Note_width / 2)
                    ];
                }
                
                if (note.type == 3 ? noteCanRender_Hold(x, y, holdBodyRange) : noteCanRender_Note(x, y)) {
                    let noteRotate = lineToNoteRotateDeg + 90;

                    let noteImg = eval(`Res_${["Tap", "Drag", "HoldHead", "Flick"][note.type - 1]}${note.morebets ? "Dub" : ""}`);
                    let noteBodyImg, noteEndImg;
                    if (note.type == 3) {
                        noteBodyImg = note.morebets ? Res_HoldBodyDub : Res_HoldBody;
                        noteEndImg = note.morebets ? Res_HoldEndDub : Res_HoldEnd;
                    }

                    let thisNoteWidth = Note_width * 1.0 * (note.morebets ? NOTE_DUB_FIXSCALE : 1.0);
                    let thisNoteHeight = Note_width / noteImg.width * noteImg.height;

                    if (!(note.type == 3 && note.time < curBTime)) {
                        ctx.drawRotateImage(
                            noteImg,
                            x, y, thisNoteWidth, thisNoteHeight,
                            noteRotate, 1.0
                        );
                    }

                    if (note.type == 3) {
                        let noteEndHeight = Note_width / noteEndImg.width * noteEndImg.height;

                        let holdBodyX, holdBodyY, holdBodyLength;
                        if (note.time < curBTime) {
                            [holdBodyX, holdBodyY] = [noteAtLineX, noteAtLineY];
                            holdBodyLength = holdDrawLength - noteEndHeight / 2;
                        }
                        else {
                            [holdBodyX, holdBodyY] = rotatePoint(
                                holdHeadX, holdHeadY,
                                lineToNoteRotateDeg, thisNoteHeight / 2
                            );
                            holdBodyLength = note.speed * (note.holdTime * line.T) * h * 0.6 - (thisNoteHeight + noteEndHeight) / 2;
                        }

                        ctx.drawRotateImage(
                            noteEndImg,
                            holdEndX, holdEndY,
                            thisNoteWidth, noteEndHeight,
                            noteRotate, 1.0
                        );

                        if (holdBodyLength > 0.0) {
                            ctx.drawAnchorESRotateImage(
                                noteBodyImg,
                                holdBodyX, holdBodyY,
                                thisNoteWidth, holdBodyLength,
                                noteRotate, 1.0
                            );
                        }
                    }
                }
            }
        };

        _rnotes(line.notesAbove, true);
        _rnotes(line.notesBelow, false);
    }

    let clickEffectTime = (0.5 * chartAudio.playbackRate);
    for (let line of chartData.judgeLineList) {
        for (let note of line.notesAbove.concat(line.notesBelow)) {
            let noteTimeSec = note.time * line.T;
            if (note.type != 3 && noteTimeSec < curTime - clickEffectTime) continue;

            if (note.time < curBTime) {
                if (curTime - noteTimeSec < clickEffectTime) {
                    phiProcsEffect(curTime, note, note.time, note.effectRandomBlocks);
                }
                
                if (note.type == 3) {
                    let effectEndTime = (note.time + note.holdTime) * line.T + clickEffectTime;
                    if (effectEndTime >= curTime) {
                        for (let item of note.effectTimes) {
                            [tempTime, effectRandomBlocks] = item;
                            if (tempTime < curTime && curTime - tempTime <= clickEffectTime) {
                                phiProcsEffect(curTime, note, tempTime / line.T, effectRandomBlocks);
                            }
                        }
                    }
                }
            }
        }
    }

    requestAnimationFrame(phiRender);
}

function rpeInit() {

}

function rpeRender() {

}

CanvasRenderingContext2D.prototype.drawLineEx = function (x1, y1, x2, y2, width, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

CanvasRenderingContext2D.prototype.drawRotateImage = function(im, x, y, width, height, deg, alpha) { // draw at the position center
    this.save();
    this.globalAlpha *= alpha;
    if (!!deg){
        this.translate(x,y);
        this.rotate(deg * Math.PI / 180);
        this.drawImage(im, -width / 2, -height / 2, width, height);
    }
    else {
        this.drawImage(im, x - width / 2, y - height / 2, width, height);
    }
    this.restore();
}

CanvasRenderingContext2D.prototype.drawAnchorESRotateImage = function(im, x, y, width, height, deg, alpha) {
    this.save();
    this.globalAlpha *= alpha;
    if (!!deg){
        this.translate(x,y);
        this.rotate(deg * Math.PI / 180);
        this.drawImage(im, -width / 2, -height, width, height);
    }
    else {
        this.drawImage(im, x - width / 2, y - height, width, height);
    }
    this.restore();
}

CanvasRenderingContext2D.prototype.clear = function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
}