class Flash extends Entity {
    alpha = 1;
    z = Z_FLASH;

    constructor(color) {
        super();
        this.color = color;
    }

    render() {
        this.cancelCamera();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(-1, -1, CANVAS_WIDTH + 2, CANVAS_HEIGHT + 2);
    }
}
