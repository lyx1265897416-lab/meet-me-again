// Timeline revisions preserve a bookmark's position within the original dialogue.
export function migrateEpisode5Timeline(progress, mappings) {
  if (!progress?.history || progress.ep5Transitions === 1 || !mappings) return progress;
  const id = progress.history[progress.at || 0]?.id;
  const mapping = mappings[id]?.[progress.part || 0];
  if (mapping) {
    progress.part = mapping.part;
    progress.time = Math.max(0, (progress.time || 0) + mapping.offset);
  }
  progress.ep5Transitions = 1;
  return progress;
}

// v3 adds a physical arrival after the existing environment insert. Preserve
// the saved dialogue time, choices and all other episode bookmarks.
export function migrateEpisode5Entrances(progress) {
  if (!progress?.history || progress.ep5FlowV3 === 1) return progress;
  const id = progress.history[progress.at || 0]?.id;
  if (['05-02', '05-09'].includes(id) && (progress.part || 0) >= 1) {
    progress.part += 1;
  }
  progress.ep5FlowV3 = 1;
  return progress;
}
