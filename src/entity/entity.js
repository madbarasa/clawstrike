class Entity {
    categories = [];
    seed = random();

    previousX = 0;
    previousY = 0;

    constructor() {
        this.x = this.y = this.previousX = this.previousY = this.age = 0;
        this.z = 0;
    }

    get hitbox() {
        this.cachedHitbox ||= new Rect();
        this.cachedHitbox.x = this.x;
        this.cachedHitbox.y = this.y;
        return this.cachedHitbox;
    }

    // 渲染插值：逻辑以固定步长推进，渲染在两个状态之间插值，杜绝帧率抖动带来的顿挫
    get renderX() {
        return interpolate(this.previousX ?? this.x, this.x, G?.alpha ?? 1);
    }

    get renderY() {
        return interpolate(this.previousY ?? this.y, this.y, G?.alpha ?? 1);
    }

    cycle(elapsed) {
        this.age += elapsed;

        this.previousX = this.x;
        this.previousY = this.y;
    }

    renderBackground() {

    }

    render() {

    }

    cancelCamera() {
        const camera = firstItem(this.world.category('camera'));
        const zoom = camera.renderZoom;
        ctx.translate(
            camera.renderX - (1 / zoom) * CANVAS_WIDTH / 2,
            camera.renderY - (1 / zoom) * CANVAS_HEIGHT / 2,
        );
        ctx.scale(1 / zoom, 1 / zoom);
    }

    renderDebug() {
        if (!DEBUG) return;

        if (DEBUG_HITBOXES) this.hitbox.render();

        if (DEBUG_HITBOXES) ctx.wrap(() => {
            this.cancelCamera();

            const cornerRadius = 10;
            ctx.fillStyle = '#fff';
            ctx.fillRect(-cornerRadius, -cornerRadius, cornerRadius * 2, cornerRadius * 2);
            ctx.fillRect(CANVAS_WIDTH - cornerRadius, -cornerRadius, cornerRadius * 2, cornerRadius * 2);
            ctx.fillRect(-cornerRadius, CANVAS_HEIGHT - cornerRadius, cornerRadius * 2, cornerRadius * 2);
            ctx.fillRect(CANVAS_WIDTH - cornerRadius, CANVAS_HEIGHT - cornerRadius, cornerRadius * 2, cornerRadius * 2);
        });
    }

    interp(
        interpProperty,
        fromValue,
        toValue,
        interpDuration,
        easing = linear,
    ) {
        return this.world.addEntity(new Interpolator(
            this,
            interpProperty,
            fromValue,
            toValue,
            interpDuration,
            easing,
        )).awaitCompletion();
    }
}
