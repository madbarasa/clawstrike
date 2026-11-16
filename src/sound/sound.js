// 音效与背景音乐统一出口，开关状态实时生效
SOUND_VOLUME = 0.3;

songLevel = 1;
songGainNode = null;

playSong = () => {
    if (songStarted) return;
    songStarted = true;

    new MusicGenerator(SONG).createAudioBuffer(buffer => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        songGainNode = audioCtx.createGain();
        songGainNode.connect(audioCtx.destination);
        source.connect(songGainNode);
        source.start();
        applySongVolume();
    });
};

songStarted = false;

setSongLevel = (x) => {
    songLevel = x;
    applySongVolume();
};

applySongVolume = () => {
    if (!songGainNode) return;
    songGainNode.gain.value = SETTINGS.sound ? songLevel * SONG_VOLUME : 0;
};

applySoundVolume = () => {
    zzfxV = SETTINGS.sound ? SOUND_VOLUME : 0;
};
