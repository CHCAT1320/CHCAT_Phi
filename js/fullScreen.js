// 请求全屏
function requestFullscreen() {
    // 获取元素
    const element = document.getElementById("canvas");
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari & Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("fullScreenButton");
    button.addEventListener("click", requestFullscreen);
});
// // 退出全屏
// function exitFullscreen() {
//   if (document.exitFullscreen) {
//     document.exitFullscreen();
//   } else if (document.webkitExitFullscreen) {
//     document.webkitExitFullscreen();
//   } else if (document.msExitFullscreen) {
//     document.msExitFullscreen();
//   } else if (document.mozCancelFullScreen) {
//     document.mozCancelFullScreen();
//   }
// }
