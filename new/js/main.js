// 获取canvas上下文
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// 将原点移动到画布的中心
ctx.translate(canvas.width / 2, canvas.height / 2);

// 定义全局变量及列表
let time = 0
let AllLineInfoList = []
let AllNoteInfoList = []
let AllLineXYRS = {}

// 读取谱面文件函数
function ChartFiles(files) {
    // 获取文件
    var file = files[0];
    // 创建FileReader对象
    var reader = new FileReader();
    // 解析文件数据
    reader.onload = function(e) {
        try{
            var data = JSON.parse(e.target.result);
            // 判断谱面文件类型
            if("formatVersion"in data){
                console.log("喵！官谱格式!")
                ReadFormat(data)
            } else{
                console.error("喵！未知谱面格式")
            }
        }catch(error){
            console.error("喵！读取谱面文件出错",error)
        }
    }
    // 调用readAsText并传入文件内容
    reader.readAsText(file);
}

// 读取谱面文件函数
function BgmFiles(files) {
    // 获取文件
    var file = files[0];
    // 创建FileReader对象
    var reader = new FileReader();
    // 解析文件数据
    reader.onload = function(e) {
        try{
            var audio = document.getElementById("bgm")
            audio.src = URL.createObjectURL(file);
        }catch(error){
            console.error("喵！读取音乐文件出错",error)
        }
    }
    // 调用readAsText并传入文件内容
    reader.readAsText(file);
}

// 读取官谱
function ReadFormat(json){
    var json = json
    AllLineInfoList = json.judgeLineList
    console.log(json)
    console.log(AllLineInfoList)
    for(var i = 0 ; i < AllLineInfoList.length ; i++){
        for(var a = 0 ; a < AllLineInfoList[i].notesAbove.length ; a++){
            AllNoteInfoList.push({
                lineIndex: i,
                r: 1,
                type: AllLineInfoList[i].notesAbove[a].type,
                time: BpmToTime(AllLineInfoList[i].notesAbove[a].time, AllLineInfoList[i].bpm),
                positionX: 0.05625 * canvas.width * AllLineInfoList[i].notesAbove[a].positionX,
                holdTime: AllLineInfoList[i].notesAbove[a].holdTime,
                speed: AllLineInfoList[i].notesAbove[a].speed,
                floorPosition: AllLineInfoList[i].notesAbove[a].floorPosition
            })
        }
        for(var a = 0 ; a < AllLineInfoList[i].notesBelow.length ; a++){
            AllNoteInfoList.push({
                lineIndex: i,
                r: -1,
                type: AllLineInfoList[i].notesBelow[a].type,
                time: BpmToTime(AllLineInfoList[i].notesBelow[a].time, AllLineInfoList[i].bpm),
                positionX: 0.05625 * canvas.width * AllLineInfoList[i].notesBelow[a].positionX,
                holdTime: AllLineInfoList[i].notesBelow[a].holdTime,
                speed: AllLineInfoList[i].notesBelow[a].speed,
                floorPosition: AllLineInfoList[i].notesBelow[a].floorPosition
            })
        }
        // console.log(AllLineInfoList[i].notesAbove)
    }
    console.log(AllNoteInfoList)
}

// 官谱时间转换
function BpmToTime(time, bpm) {
    return (time / bpm) * 1.875;
}

// 线性插值函数
function LinearInterpolation(s, e, sT, eT, NowTime) {
    return s + (e - s) * ((NowTime - sT) / (eT - sT));
}

// 判定线类
class Line {
    constructor(){
        this.lineInfo = {}
    }
    CreateLine() {
        for(var i = 0 ; i < AllLineInfoList.length ; i++){
            this.lineInfo[i] = {
                index: i,
                bpm: AllLineInfoList[i].bpm,
                lineMoveEventsList: AllLineInfoList[i].judgeLineMoveEvents,
                LineMoveNumber: 0,
                LineX: 0,
                LineY: 0,
                lineRotateEventsList: AllLineInfoList[i].judgeLineRotateEvents,
                LineRotateNumber: 0,
                LineR: 0,
                lineDisappearEventsList: AllLineInfoList[i].judgeLineDisappearEvents,
                LineDisappearNumber: 0,
                LineD: 0,
                lineSpeedEventList: AllLineInfoList[i].speedEvents,
                LineSpeedNumber: 0,
                LineS: 0,
                SpeedFP: 0,
                SpeedFP0: 0,
                LineFP: 0
            }
            
        }
        console.log(this.lineInfo)
    }
    GetLineMove() {
        for (let i = 0; i < AllLineInfoList.length; i++) {
            let lineInfo = this.lineInfo[i];
            if (time > BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].endTime, lineInfo.bpm)) {
                lineInfo.LineX = 
                (lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].end - 0.5) * canvas.width
                lineInfo.LineY = 
                0-(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].end2 - 0.5) * canvas.height

                lineInfo.LineMoveNumber += 1
            } else if (time > BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].startTime, lineInfo.bpm)) {
                lineInfo.LineX = LinearInterpolation((lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].start - 0.5) * canvas.width,
                    (lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].end - 0.5) * canvas.width,
                    BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].startTime, lineInfo.bpm),
                    BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].endTime, lineInfo.bpm),
                    time
                )
                lineInfo.LineY = 0-LinearInterpolation((lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].start2 - 0.5) * canvas.height,
                    (lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].end2 - 0.5) * canvas.height,
                    BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].startTime, lineInfo.bpm),
                    BpmToTime(lineInfo.lineMoveEventsList[lineInfo.LineMoveNumber].endTime, lineInfo.bpm),
                    time
                )
                
            }
        }
    }
    GetLineRotate() {
        for (let i = 0; i < AllLineInfoList.length; i++) {
            let lineInfo = this.lineInfo[i];
            if (time > BpmToTime(lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].endTime, lineInfo.bpm)) {
                lineInfo.LineR = 0-lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].end;
                lineInfo.LineRotateNumber += 1
            } else if (time > BpmToTime(lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].startTime, lineInfo.bpm)) {
                lineInfo.LineR = 0-LinearInterpolation(lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].start,
                    lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].end,
                    BpmToTime(lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].startTime, lineInfo.bpm),
                    BpmToTime(lineInfo.lineRotateEventsList[lineInfo.LineRotateNumber].endTime, lineInfo.bpm),
                    time
                )
        
            }
        }

    }
    GetLineDisappear() {
        for (let i = 0; i < AllLineInfoList.length; i++) {
            let lineInfo = this.lineInfo[i];
            if (time > BpmToTime(lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].endTime, lineInfo.bpm)) {
               lineInfo.LineD = lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].end;
               lineInfo.LineDisappearNumber += 1
            } else if (time > BpmToTime(lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].startTime, lineInfo.bpm)) {
               lineInfo.LineD = LinearInterpolation(lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].start, 
                    lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].end,
                    BpmToTime(lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].startTime, lineInfo.bpm),
                    BpmToTime(lineInfo.lineDisappearEventsList[lineInfo.LineDisappearNumber].endTime, lineInfo.bpm),
                    time
               )
            }
        }
    }
    GetLineSpeed(){
        for (var i = 0; i < AllLineInfoList.length; i++) {
            let lineInfo = this.lineInfo[i];
            if (lineInfo.LineSpeedNumber <= lineInfo.lineSpeedEventList.length){
                if (time > BpmToTime(lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].endTime, lineInfo.bpm)){
                    lineInfo.LineS = lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].value;
                    lineInfo.SpeedFP0 = lineInfo.SpeedFP;
                    // console.log(lineInfo.LineS)
                    lineInfo.LineSpeedNumber += 1;
                }else if (time > BpmToTime(lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].startTime, lineInfo.bpm)){
                    if (lineInfo.LineSpeedNumber > 0){
                        lineInfo.SpeedFP = lineInfo.SpeedFP0 + lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber - 1].value * (BpmToTime(lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].startTime , lineInfo.bpm) - BpmToTime(lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber - 1].startTime , lineInfo.bpm))
                    }else {
                        lineInfo.SpeedFP = 0
                    }
                    lineInfo.LineS = lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].value;
                    // console.log(lineInfo.LineS)
                    lineInfo.LineFP = lineInfo.SpeedFP + lineInfo.LineS * (time - BpmToTime(lineInfo.lineSpeedEventList[lineInfo.LineSpeedNumber].startTime , lineInfo.bpm))
                }
            }
            // console.log(lineInfo.LineFP)
        }
    }
    drawLine() {
        for (var i = 0; i < AllLineInfoList.length; i++) {
            let lineInfo = this.lineInfo[i];
            AllLineXYRS[i] = {
                x: lineInfo.LineX,
                y: lineInfo.LineY,
                r: lineInfo.LineR,
                s: lineInfo.LineS,
                fp: lineInfo.LineFP,
                
            }
            ctx.strokeStyle = "rgba(255,255,170," + lineInfo.LineD + ")";
            ctx.lineWidth = 5;
    
            ctx.beginPath();
            ctx.moveTo(lineInfo.LineX + 1080 * Math.cos(lineInfo.LineR / 180 * Math.PI), lineInfo.LineY + 1080 * Math.sin(lineInfo.LineR / 180 * Math.PI));
            ctx.lineTo(lineInfo.LineX + 1080 * Math.cos((lineInfo.LineR + 180) / 180 * Math.PI), lineInfo.LineY + 1080 * Math.sin((lineInfo.LineR + 180) / 180 * Math.PI));
            ctx.stroke();
    
            // 保存当前的绘图状态
            ctx.save();
    
            // 将原点移动到线的中心
            ctx.translate(lineInfo.LineX, lineInfo.LineY);
    
            // 角度
            ctx.rotate(lineInfo.LineR / 180 * Math.PI);
    
            // 设置文本样式
            ctx.fillStyle = "rgba(0,0,0)";
            ctx.font = "24px serif";
    
            // 计算文本的宽度
            let text = i.toString();
            let textWidth = ctx.measureText(text).width;
    
            // 将文本移动到中心位置
            ctx.translate(-textWidth / 2, 0);
    
            // 绘制文本
            ctx.fillText(text, 0, 0);
    
            // 恢复之前的绘图状态
            ctx.restore();
        }
    }
}

class Note {

    drawNote() {
        for (var i = 0; i < AllNoteInfoList.length; i++) {
            if (time > AllNoteInfoList[i].time){
                AllNoteInfoList.splice(i ,1)
                if(AllNoteInfoList[i].type === 1){
                    console.log("tap")
                }else if(AllNoteInfoList[i].type === 2){
                    console.log("drag")
                }else if(AllNoteInfoList[i].type === 3){
                    console.log("hold")
                }else{
                    console.log("flick")
                }
                // var tapA = document.getElementById('tapA');
                // // 使用Howler.js
                // var sound = new Howl({
                //     src: [tapA.src]
                // }).play();
            }else{
                ctx.lineWidth = 20;
                if(AllNoteInfoList[i].type === 2){
                    ctx.strokeStyle = "rgba(255,255,190,1)";
                }else if(AllNoteInfoList[i].type === 4){
                    ctx.strokeStyle = "rgba(255,0,0,1)";
                }else{
                    ctx.strokeStyle = "rgba(85,176,255,1)";
                }
                if (AllNoteInfoList[i].type === 3){
                    var fp = -1*0.6 * canvas.height * 1 * (AllNoteInfoList[i].floorPosition - AllLineXYRS[AllNoteInfoList[i].lineIndex].fp)
                }else {
                    var fp = -1*0.6 * canvas.height * AllNoteInfoList[i].speed * (AllNoteInfoList[i].floorPosition - AllLineXYRS[AllNoteInfoList[i].lineIndex].fp)
                }
                if (AllNoteInfoList[i].r != 1){
                    fp = fp * -1
                }
                ctx.beginPath()
                // ctx.moveTo(AllLineXYRS[AllNoteInfoList[i].lineIndex].x + AllNoteInfoList[i].positionX + 40 * Math.cos(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI), AllLineXYRS[AllNoteInfoList[i].lineIndex].y + fp + 40 * Math.sin(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI))
                // ctx.lineTo(AllLineXYRS[AllNoteInfoList[i].lineIndex].x + AllNoteInfoList[i].positionX + 40 * Math.cos((AllLineXYRS[AllNoteInfoList[i].lineIndex].r + 180) / 180 * Math.PI), AllLineXYRS[AllNoteInfoList[i].lineIndex].y + fp + 40 * Math.sin((AllLineXYRS[AllNoteInfoList[i].lineIndex].r - 180) / 180 * Math.PI))
                ctx.moveTo(AllLineXYRS[AllNoteInfoList[i].lineIndex].x + AllNoteInfoList[i].positionX + 
                    (40 * 
                    Math.cos(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI) + 
                    -1*fp * 
                    Math.sin(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI)), 
                    AllLineXYRS[AllNoteInfoList[i].lineIndex].y + 
                    (40 * 
                    Math.sin(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI) - 
                    -1*fp * 
                    Math.cos(AllLineXYRS[AllNoteInfoList[i].lineIndex].r / 180 * Math.PI))
                )
                ctx.lineTo(AllLineXYRS[AllNoteInfoList[i].lineIndex].x + AllNoteInfoList[i].positionX + 
                    (40 * 
                    Math.cos((AllLineXYRS[AllNoteInfoList[i].lineIndex].r + 180) / 180 * Math.PI) + 
                    fp * 
                    Math.sin((AllLineXYRS[AllNoteInfoList[i].lineIndex].r - 180) / 180 * Math.PI)), 
                    AllLineXYRS[AllNoteInfoList[i].lineIndex].y + 
                    (40 * 
                    Math.sin((AllLineXYRS[AllNoteInfoList[i].lineIndex].r - 180) / 180 * Math.PI) - 
                    fp * 
                    Math.cos((AllLineXYRS[AllNoteInfoList[i].lineIndex].r + 180) / 180 * Math.PI))
                )
                ctx.stroke()
            }
            
        }
    }
}
// 谱面时间计算变量
let startTime = performance.now();
let endTime = 0;
// 定义计时器
let intervalId = null;

// 开始播放的函数
function StartPlay() {
    // 验证是否添加了谱面
    if (AllLineInfoList.length === 0) {
        console.error("未添加谱面，请先添加谱面");
    } else {
        // 获取audio标签
        var audio = document.getElementById("bgm");
        audio.play();
        // 实例化类
        let linesInstance = new Line();
        let notesInstance = new Note();
        // 创建线
        linesInstance.CreateLine();
        // 如果已经有一个定时器在运行，先清除它
        if (intervalId !== null) {
            clearInterval(intervalId);
        }


        linesInstance.drawLine();
        // 调用帧率检测函数
        // updateFPS()

        // 使用setInterval定期检查audio的currentTime
        intervalId = setInterval(function () {
            // 检查audio是否已经开始播放
            if (audio.currentTime > 0) {
                // 谱面时间计算变量
                let startTime = performance.now();
                // linesInstance.GetLineMove();
                // linesInstance.GetLineRotate();
                // linesInstance.GetLineDisappear();

                // ctx.clearRect(0 - (canvas.width / 2), 0 - (canvas.height / 2), canvas.width, canvas.height);
                // // 绘制线
                // linesInstance.drawLine();
                // // 计算谱面现在时间
                // endTime = performance.now();
                // let duration = endTime - startTime;
                // time = (duration / 1000).toFixed(3);
                // document.getElementById("chartTime").innerHTML = `谱面时间：${time}s`;

                // 一旦开始播放，就不再需要这个检查，可以清除这个setInterval
                clearInterval(intervalId);
                intervalId = setInterval(function () {
                    // // 谱面时间计算变量
                    // let startTime = performance.now();
                    linesInstance.GetLineMove();
                    linesInstance.GetLineRotate();
                    linesInstance.GetLineDisappear();
                    linesInstance.GetLineSpeed();

                    ctx.clearRect(0 - (canvas.width / 2), 0 - (canvas.height / 2), canvas.width, canvas.height);
                    // 绘制线
                    notesInstance.drawNote()
                    linesInstance.drawLine();
                    
                    
                    // 计算谱面现在时间
                    endTime = performance.now();
                    let duration = endTime - startTime;
                    time = (duration / 1000).toFixed(3);
                    document.getElementById("chartTime").innerHTML = `谱面时间：${time}s`;
                }, 0);
            }
        }, 1);
    }
}

// 率检测函数
let lastTime = 0;
let frameCount = 0;

function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        document.getElementById('fps').textContent = 'FPS: ' + frameCount;
        frameCount = 0;
        lastTime = now;
    }
    requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);