// A direct jump may inherit real earlier choices, never choices from a later episode.
export function entryStateForEpisode(target,archives,initialState){
 const previous=Object.keys(archives).map(Number).filter(n=>n<target&&archives[n]?.history?.length).sort((a,b)=>b-a)[0];
 return structuredClone(previous?archives[previous].state:initialState());
}
export function episodeHasMedia(shots,target){
 const entries=Object.values(shots||{}).filter(s=>s.episode===target);
 return entries.length>0&&entries.every(s=>s.ready&&s.clips?.length);
}
