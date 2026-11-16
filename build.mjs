import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const argv = Object.fromEntries(
    process.argv.slice(2).map(arg => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value === undefined ? true : value];
    }),
);

const DEBUG = !!argv.debug;
const OUT = argv.out || (DEBUG ? 'build/debug.html' : 'build/index.html');

const CONSTANTS = {
    DEBUG: DEBUG ? 'true' : 'false',
    INPUT_MODE_KEYBOARD: '0',
    INPUT_MODE_TOUCH: '1',
    CELL_SIZE: '50',
    BULLET_SPEED: '800',
    HUMAN_VISION_DISTANCE: '500',
    HUMAN_VISION_DIVIDER_TOP: '3',
    HUMAN_VISION_DIVIDER_BOTTOM: '4',
    CAT_BODY_LENGTH: '40',
    CAT_BODY_THICKNESS: '20',
    CAT_LEG_LENGTH: '15',
    CAT_LEG_THICKNESS: '4',
    CAT_TAIL_LENGTH: '30',
    CAT_TAIL_THICKNESS: '5',
    CAT_HEAD_WIDTH: '20',
    CAT_HEAD_HEIGHT: '20',
    CAT_EAR_LENGTH: '10',
    CAT_EAR_WIDTH: '5',
    CAT_ATTACK_ANIMATION_DURATION: '0.2',
    HUMAN_BODY_LENGTH: '40',
    HUMAN_BODY_THICKNESS: '20',
    HUMAN_LEG_LENGTH: '20',
    HUMAN_LEG_THICKNESS: '8',
    HUMAN_HEAD_WIDTH: '15',
    HUMAN_HEAD_HEIGHT: '15',
    HUMAN_NECK_THICKNESS: '8',
    HUMAN_NECK_LENGTH: '4',
    HUMAN_ARM_LENGTH: '25',
    HUMAN_ARM_THICKNESS: '5',
    SONG_VOLUME: '0.5',
    COMMAND_SPACING: '52',
    DEBUG_INFO: 'false',
    DEBUG_HITBOXES: 'false',
    DEBUG_JUMP: 'false',
    DEBUG_VISION: 'false',
};

const Z_LAYERS = [
    'Z_LABEL', 'Z_MEOW', 'Z_SPIKES', 'Z_CAT', 'Z_BULLET', 'Z_PARTICLE',
    'Z_WATER', 'Z_STRUCTURE', 'Z_HUMAN', 'Z_FLASH', 'Z_HUD', 'Z_CLAW',
];

// 加载顺序：工具与输入 → 图形 → 实体 → 界面 → 世界 → 入口
const JS_FILES = [
    'meta.js',
    'difficulty.js',
    'globals.js',

    'input/keys.js',
    'input/keyboard.js',
    'input/touch.js',

    'utils/math.js',
    'utils/easing.js',
    'utils/resizer.js',
    'utils/raycasting.js',
    'utils/rect.js',
    'utils/first-item.js',

    'graphics/wrap.js',
    'graphics/create-canvas.js',
    'graphics/typography.js',
    'graphics/ui.js',
    'graphics/widgets.js',
    'graphics/button.js',
    'graphics/hint.js',
    'graphics/error.js',

    'sound/sonantx.js',
    'sound/ZzFXMicro.js',
    'sound/song.js',
    'sound/sound.js',

    'entity/entity.js',
    'entity/human.js',
    'entity/bullet.js',
    'entity/claw-effect.js',
    'entity/meow-effect.js',
    'entity/flash.js',
    'entity/cat.js',
    'entity/structure.js',
    'entity/particle.js',
    'entity/physical-particle.js',
    'entity/camera.js',
    'entity/hud.js',
    'entity/spikes.js',
    'entity/water.js',
    'entity/label.js',
    'entity/interpolator.js',

    'screen/screen.js',
    'screen/world-screen.js',
    'screen/gameplay-screen.js',
    'screen/story-screen.js',

    'screen/menu/menu-screen.js',
    'screen/menu/settings-screen.js',
    'screen/menu/credits-screen.js',
    'screen/menu/main-menu-screen.js',
    'screen/menu/pause-screen.js',
    'screen/menu/game-over-screen.js',
    'screen/menu/game-complete-screen.js',

    'level/serialization.js',

    'world.js',
    'game.js',
    'main.js',
];

const LEVEL_FILES = [
    'blank.js',
    'tutorial-v2.js',
    'medium.js',
    'tutorial-wall-jump.js',
    'first-level.js',
    'tutorial-roll.js',
    'random.js',
    'second-level.js',
    'stuff.js',
    'green.js',
    'dunno.js',
    'vertical.js',
    'climb.js',
    'cramped.js',
];

const encodeMatrix = (matrix) => matrix.map(row => row.join('')).join('|');

const minifyLevel = (levelJson) => '[' + levelJson.map(entity => {
    const properties = [];
    for (const key in entity) {
        const value = entity[key];
        if (key === 'matrix') {
            properties.push(`${JSON.stringify(key)}: decodeMatrix(${JSON.stringify(encodeMatrix(value))})`);
        } else if (value === 0) {
            continue;
        } else if (key === 'angle') {
            const degrees = Math.round(value * 180 / Math.PI);
            properties.push(`${JSON.stringify(key)}: ${degrees} * PI / 180`);
        } else {
            properties.push(`${JSON.stringify(key)}: ${JSON.stringify(value)}`);
        }
    }
    return '{' + properties.join(',') + '}';
}).join(',') + ']';

const main = async () => {
    const constants = { ...CONSTANTS };
    Z_LAYERS.forEach((name, index) => constants[name] = String(index));

    const segments = [];
    for (const file of JS_FILES) {
        const content = await fs.readFile(path.join(ROOT, 'src', file), 'utf-8');
        segments.push(`/* ${file} */\n${content}`);
    }

    let levels = 'decodeMatrix = (encoded) => encoded.split("|").map(row => row.split("").map(Number));\n';
    levels += 'ALL_LEVELS = [\n';
    for (const file of LEVEL_FILES) {
        const json = JSON.parse(await fs.readFile(path.join(ROOT, 'src/level/levels', file), 'utf-8'));
        levels += minifyLevel(json) + ',\n';
    }
    levels += '];\n';
    levels += 'INTRO_LEVEL = ' + minifyLevel(
        JSON.parse(await fs.readFile(path.join(ROOT, 'src/level/levels/intro.js'), 'utf-8')),
    ) + ';\n';
    segments.push(levels);

    let code = segments.join('\n');
    const constantPattern = new RegExp('\\b(' + Object.keys(constants).join('|') + ')\\b', 'g');
    code = code.replace(constantPattern, name => `(${constants[name]})`);

    // 原始工程用 nomangle 标记不能被压缩的字符串，这里直接去掉标记
    code = code.replace(/(^|[^\w$.])nomangle\(/g, '$1(');

    const result = await build({
        stdin: {
            contents: code,
            resolveDir: path.join(ROOT, 'src'),
            sourcefile: 'game.js',
            loader: 'js',
        },
        write: false,
        target: 'es2019',
        minify: !DEBUG,
        format: 'iife',
        legalComments: 'none',
        logLevel: 'warning',
    });

    const js = result.outputFiles[0].text;
    const html = await fs.readFile(path.join(ROOT, 'src/index.html'), 'utf-8');
    const css = await fs.readFile(path.join(ROOT, 'src/style.css'), 'utf-8');

    const outputHtml = html
        .replace('{{{ CSS_INJECTION_SITE }}}', css)
        .replace('{{{ JS_INJECTION_SITE }}}', js);

    const outPath = path.join(ROOT, OUT);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, outputHtml);

    console.log(`${OUT} -> ${(Buffer.byteLength(outputHtml) / 1024).toFixed(1)} KB`);
};

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
