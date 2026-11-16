// 喵叫文本改为中文拟声词，避免玩家界面出现英文
MEOWS = [
    '喵',
    '喵呜',
    '喵噢',
    '呜喵',
    '嗷呜',
    '喵嗷',
    '呼噜',
    '喵喵',
];

class MeowEffect extends Entity {

    z = Z_MEOW;
    affected = new Set();
    textLabel = MEOWS[~~(this.seed * MEOWS.length)];

    textX = rnd(-50, 50);
    textY = rnd(-20, -50);

    get radius() {
        return interpolate(0, 400, this.age / 0.5);
    }

    cycle(elapsed) {
        super.cycle(elapsed);

        for (const human of this.world.category('human')) {
            if (!this.affected.has(human) && distance(this, human) < this.radius) {
                human.hear(this);
            }
        }

        if (this.age > 0.5) {
            this.world?.removeEntity(this);
        }
    }

    render() {
        ctx.translate(this.renderX, this.renderY);
        ctx.globalAlpha = 1 - this.age / 0.5;

        const count = 5;
        const spacing = 10;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for (let r = roundToNearest(this.radius, spacing), i = 0 ; i < count ; r += spacing, i++) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TWO_PI);
            ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = nomangle('middle');
        ctx.font = uiFont(18);
        ctx.fillText(this.textLabel, this.textX, this.textY);
    }
}
