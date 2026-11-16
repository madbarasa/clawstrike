class World {

    entities = [];
    categories = {};

    cycle(elapsed) {
        for (const entity of this.entities.slice()) {
            if (DEBUG && this.editorMode && entity.type) continue;
            entity.cycle(elapsed);
        }
    }

    render() {
        this.entities.sort((a, b) => a.z - b.z);

        const camera = firstItem(this.category('camera'));
        const zoom = camera.renderZoom;

        ctx.wrap(() => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, can.width, can.height);

            ctx.scale(zoom, zoom);
            ctx.translate(
                CANVAS_WIDTH / 2 / zoom - camera.renderX,
                CANVAS_HEIGHT / 2 / zoom - camera.renderY,
            );

            for (const entity of this.entities) {
                ctx.wrap(() => entity.renderBackground());
            }

            for (const entity of this.entities) {
                // HUD 由世界界面单独绘制，这里不重复绘制
                if (entity.categories.includes('hud')) continue;
                ctx.wrap(() => entity.render());
            }

            if (DEBUG) {
                for (const entity of this.entities) {
                    ctx.wrap(() => entity.renderDebug());
                }
            }
        });
    }

    addEntity(entity) {
        entity.world = this;
        this.entities.push(entity);

        for (const categoryId of entity.categories) {
            this.categories[categoryId] ||= new Set();
            this.categories[categoryId].add(entity);
        }

        return entity;
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index >= 0) {
            this.entities.splice(index, 1);
        }

        for (const category of entity.categories) {
            this.categories[category]?.delete(entity);
        }
    }

    category(categoryId) {
        return this.categories[categoryId] || EMPTY_CATEGORY;
    }
}

EMPTY_CATEGORY = new Set();
