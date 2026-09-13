import React from 'react';
import { Composition } from 'remotion';
import { OpenlineDemo } from './OpenlineDemo';

export const RemotionRoot = () => (
  <Composition
    id="OpenlineDemo"
    component={OpenlineDemo}
    durationInFrames={3300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
  />
);
