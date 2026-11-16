// 运行期异常提示：黑底红字，标明中文标题与第一行错误信息
renderFatalError = (error) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    ctx.textAlign = nomangle('left');
    ctx.textBaseline = nomangle('top');

    ctx.font = uiFont(44);
    ctx.fillStyle = '#ff5a5f';
    ctx.fillText(error.title, 60, 60);

    ctx.font = uiFont(20, 'normal');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';

    let y = 140;
    for (const line of String(error.message).split('\n').slice(0, 12)) {
        ctx.fillText(line.slice(0, 120), 60, y);
        y += 30;
    }
};
