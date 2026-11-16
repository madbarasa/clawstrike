class WorldScreen extends Screen {
    absorb = true;

    constructor(serializedWorld) {
        super();

        this.serializedWorld = serializedWorld;

        if (DEBUG) {
            this.debugValues = () => {
                const vals = [`Entities: ${this.world.entities.length}`];
                for (const camera of this.world.category('camera')) {
                    vals.push(`Camera: ${camera.x.toFixed(0)},${camera.y.toFixed(0)}`);
                }
                for (const cat of this.world.category('cat')) {
                    vals.push(`Cat: ${cat.x.toFixed(0)},${cat.y.toFixed(0)}`);
                }
                return vals;
            };
        }

        this.world = deserializeWorld(this.serializedWorld);

        const camera = this.world.addEntity(new Camera());
        const cat = firstItem(this.world.category('cat'));
        if (cat) {
            this.world.addEntity(new HUD(cat));

            camera.target = cat;
            camera.x = camera.previousX = cat.x;
            camera.y = camera.previousY = cat.y - 200;
        }
    }

    // 只有游戏界面在最上层时才绘制 HUD 与虚拟按键
    get showsHud() {
        return this.isForeground();
    }

    cycle(elapsed) {
        super.cycle(elapsed);

        let remaining = elapsed;
        while (remaining > 0) {
            const advance = min(remaining, 1 / 120);
            remaining -= advance;
            this.world.cycle(advance);
        }
    }

    render() {
        super.render();
        ctx.wrap(() => this.world.render());

        if (this.showsHud) ctx.wrap(() => this.renderHud());
    }

    renderHud() {
        const camera = firstItem(this.world.category('camera'));

        ctx.scale(UIScale, UIScale);

        for (const hud of this.world.category('hud')) {
            ctx.wrap(() => hud.render(camera));
        }
    }
}
