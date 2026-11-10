import { useEffect } from 'react';
import Banner from '../sections/Banner';
import VideoStage from '../sections/VideoStage';
import Intro from '../sections/Intro';
import Reality from '../sections/Reality';
import Story from '../sections/Story';
import Platform from '../sections/Platform';
import Build from '../sections/Build';
import Proof from '../sections/Proof';
import ProveIt from '../sections/ProveIt';
import Close from '../sections/Close';
import Sources from '../sections/Sources';
import { startSmoothScroll } from '../lib/scroll';
import { useApp } from '../context/AppContext';
import { site } from '../lib/content';

export default function Home() {
  const { reducedMotion } = useApp();
  useEffect(() => startSmoothScroll(reducedMotion), [reducedMotion]);
  useEffect(() => {
    document.title = site.meta.title;
  }, []);
  return (
    <>
      <Banner />
      <main id="main">
        <VideoStage />
        <Intro />
        <Reality />
        <Story />
        <Platform />
        <Build />
        <Proof />
        <ProveIt />
        <Close />
      </main>
      <Sources />
    </>
  );
}
