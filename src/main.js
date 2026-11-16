onload = () => {
    can = document.getElementById(nomangle('g'));
    ctx = can.getContext('2d', {
        alpha: false,
        desynchronized: true,
    });

    if (window.__forceTouchMode) inputMode = INPUT_MODE_TOUCH;

    onresize();

    applySoundVolume();
    applySongVolume();

    G = new Game();
    G.boot();
}
