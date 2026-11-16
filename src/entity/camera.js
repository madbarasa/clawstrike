class Camera extends Entity {

    zoom = 1.3;
    previousZoom = 1.3;
    categories = ['camera'];

    get shakeFactor() {
        return (this.age < this.shakeEndAge) * (this.shakePower || 0);
    }

    get renderZoom() {
        return interpolate(this.previousZoom, this.zoom, G?.alpha ?? 1);
    }

    get renderX() {
        const factor = this.shakeFactor;
        return interpolate(this.previousX, this.x, G?.alpha ?? 1) + sin(this.age * TWO_PI * 10) * factor;
    }

    get renderY() {
        const factor = this.shakeFactor;
        return interpolate(this.previousY, this.y, G?.alpha ?? 1) + cos(this.age * TWO_PI * 15) * factor;
    }

    // 供渲染层读取的抖动后坐标
    get actual() {
        this.cachedActual ||= {};
        this.cachedActual.x = this.renderX;
        this.cachedActual.y = this.renderY;
        return this.cachedActual;
    }

    cycle(elapsed) {
        this.previousZoom = this.zoom;

        super.cycle(elapsed);

        this.hitbox.width = CANVAS_WIDTH / this.zoom;
        this.hitbox.height = CANVAS_HEIGHT / this.zoom;

        if (!this.target) return;

        const distanceToTarget = distance(this, this.target);
        const angle = angleBetween(this, this.target);
        const appliedDistance = min(distanceToTarget, distanceToTarget * min(1, elapsed * 8));
        this.x += appliedDistance * cos(angle);
        this.y += appliedDistance * sin(angle) * 0.5;
    }

    shake(duration, shakePower) {
        this.shakeEndAge = this.age + duration;
        this.shakePower = shakePower;
    }
}
