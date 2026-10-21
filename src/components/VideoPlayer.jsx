import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, videoRef: externalRef }) {
    const ownRef = useRef(null);
    const videoRef = externalRef || ownRef;

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: true,
                enableWorker: false,
                lowLatencyMode: false,
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.log('HLS ERROR:', data.type, data.details, data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('Fatal error, destroying hls');
                            hls.destroy();
                            break;
                    }
                }
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('MANIFEST PARSED — levels:', hls.levels.length);
                video.play().catch(e => console.log('play() rejected:', e));
            });

            hls.loadSource(src);
            hls.attachMedia(video);

            return () => hls.destroy();
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }
    }, [src, videoRef]);

    return (
        <video
            ref={videoRef}
            controls
            autoPlay
            muted
            className="w-full h-full object-contain bg-black"
        />
    );
}
