// 设计基准 1600x900：整帧按 UIScale 缩放到实际画布
UIScale = 1;

DESIGN_WIDTH = 1600;
DESIGN_HEIGHT = 900;

onresize = () => {
    const windowWidth = max(1, innerWidth);
    const windowHeight = max(1, innerHeight);

    const designRatio = DESIGN_WIDTH / DESIGN_HEIGHT;
    const screenRatio = windowWidth / windowHeight;

    let renderWidth;
    let renderHeight;

    if (screenRatio < designRatio) {
        renderWidth = windowWidth;
        renderHeight = renderWidth / designRatio;
    } else {
        renderHeight = windowHeight;
        renderWidth = renderHeight * designRatio;
    }

    // 画布像素对齐屏幕，整帧缩放只发生在绘制阶段
    let pixelRatio = min(window.devicePixelRatio || 1, 2);
    const maxPixels = 2560 * 1440;
    if (renderWidth * renderHeight * pixelRatio * pixelRatio > maxPixels) {
        pixelRatio = sqrt(maxPixels / (renderWidth * renderHeight));
    }

    CANVAS_WIDTH = round(renderWidth * pixelRatio);
    CANVAS_HEIGHT = round(renderHeight * pixelRatio);

    can.width = CANVAS_WIDTH;
    can.height = CANVAS_HEIGHT;

    UIScale = CANVAS_WIDTH / DESIGN_WIDTH;

    const containerStyle = document.getElementById(nomangle('t')).style;
    containerStyle.width = renderWidth + 'px';
    containerStyle.height = renderHeight + 'px';
};
