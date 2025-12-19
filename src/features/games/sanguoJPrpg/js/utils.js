// 工具函数文件

// 检测是否为移动设备
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
}

// 获取缩放比例（移动端可能需要缩放）
function getScale() {
    if (isMobile()) {
        const width = window.innerWidth;
        // iPhone 12: 390px, 需要将800px的游戏区域适配到390px
        return Math.min(width / 800, 1);
    }
    return 1;
}

// 将秒数转换为00:00:00格式
function secondsToTime(sec) {
    if (sec <= 0) return "00:00:00";
    const hour = Math.floor(sec / 3600);
    const minute = Math.floor(sec % 3600 / 60);
    const second = Math.floor(sec % 3600 % 60);
    const h = hour < 10 ? "0" + hour : hour.toString();
    const m = minute < 10 ? "0" + minute : minute.toString();
    const s = second < 10 ? "0" + second : second.toString();
    return h + ":" + m + ":" + s;
}

// 缩放游戏数据
function scaleGameData(data, scale, minSize = 20) {
    return {
        x: data.x * scale,
        y: data.y * scale,
        w: Math.max(data.w * scale, minSize),
        h: Math.max(data.h * scale, minSize)
    };
}

// 批量缩放数据数组
function scaleDataArray(dataArray, scale, minSize = 20) {
    return dataArray.map(data => scaleGameData(data, scale, minSize));
}

// 计算商店物品位置（根据屏幕尺寸）
function calculateShopPositions(shopTemplate, scale) {
    const maxX = Math.min(window.innerWidth - 20, 600);
    const startX = isMobile() ? maxX - 150 : 600;
    
    return shopTemplate.map((item) => {
        return {
            x: startX + item.x * scale,
            y: item.y * scale,
            w: Math.max(item.w * scale, 30),
            h: Math.max(item.h * scale, 30),
            type: item.type
        };
    });
}

