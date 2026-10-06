export function analyseAudio(
  context: AudioContext,
  source: AudioNode,
  onLevel: (level: number) => void,
) {
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.65;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let animation = 0,
    last = 0;
  function measure(time: number) {
    if (time - last > 60) {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const sample of data) sum += ((sample - 128) / 128) ** 2;
      onLevel(Math.min(1, Math.sqrt(sum / data.length) * 5));
      last = time;
    }
    animation = requestAnimationFrame(measure);
  }
  animation = requestAnimationFrame(measure);
  return () => {
    cancelAnimationFrame(animation);
    source.disconnect(analyser);
    analyser.disconnect();
    onLevel(0);
  };
}
