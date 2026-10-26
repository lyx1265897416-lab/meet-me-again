export function mediaForState(shot,state){
  if(shot.id==='08-04'&&state.invitation!=='plant'&&shot.stateVariants?.coffee)return shot.stateVariants.coffee;
  return shot.variants?.[state.plant]||{clips:shot.baseClips||shot.clips,idle:Object.hasOwn(shot,'baseIdle')?shot.baseIdle:shot.idle};
}
