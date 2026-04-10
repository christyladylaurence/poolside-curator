import React, { useEffect, useRef } from 'react';

interface BackgroundVideoProps {
  videoUrl: string | null;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.onloadeddata = () => {
        videoRef.current?.classList.add('loaded');
      };
    } else if (videoRef.current) {
      videoRef.current.classList.remove('loaded');
    }
  }, [videoUrl]);

  return (
    <>
      <video
        ref={videoRef}
        className="bg-video"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="overlay" />
      <div className="grain" />
    </>
  );
};

export default BackgroundVideo;
