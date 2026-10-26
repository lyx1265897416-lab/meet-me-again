// Composite two original decoded pictures. Never fade through black, filter,
// rescale, encode, or alter the audio/playback rate to conceal a cut.
export function shouldDissolve(from, to, autoplay, time = 0) {
  return !!(autoplay && time === 0 && from && to &&
    from.file !== to.file && (from.transition || to.transition));
}
export function createSceneDissolver() {
  let finishPrevious = null;
  return {
    finish() { finishPrevious?.(); },
    show(incoming, outgoing, enabled) {
      finishPrevious?.();
      incoming.hidden = false;
      if (!enabled || typeof incoming.animate !== 'function') {
        outgoing.hidden = true;
        return;
      }
      outgoing.hidden = false;
      outgoing.style.zIndex = '1';
      incoming.style.zIndex = '2';
      const animation = incoming.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 220, easing: 'ease-in-out', fill: 'both' });
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        outgoing.hidden = true;
        animation.cancel();
        incoming.style.removeProperty('z-index');
        outgoing.style.removeProperty('z-index');
        if (finishPrevious === finish) finishPrevious = null;
      };
      finishPrevious = finish;
      animation.finished.then(finish, finish);
    }
  };
}
