var lineList;
var lineNumber;
let formattedDuration = 0;

// 读取判定线JSON
function ChartFiles(files) {
    // 获取文件
    var file = files[0];
    
    // 创建FileReader对象
    var reader = new FileReader();
    
    // 文件读取完毕
    reader.onload = function(e) {
        // 解析JSON
        try {
            var json = JSON.parse(e.target.result);
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
    
    // 读取文件内容
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
        this.linesData = {}; // 创建一个对象来存储每条线的数据
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
                lineData.LineX = 0-(lineData.lineMoveEventsValueList[3] - 0.5) * 720;
                lineData.LineY = 0-(lineData.lineMoveEventsValueList[5] - 0.5) * 540;
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
                lineData.LineY = 0-LinearInterpolation(
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
                    lineData.LineR = LinearInterpolation(
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

}
