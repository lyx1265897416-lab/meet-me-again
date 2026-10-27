import {shouldDissolve,createSceneDissolver} from './scene-dissolve.mjs?v=b521e09fa1';
import {migrateEpisode5Timeline,migrateEpisode5Entrances} from './timeline-migration.mjs?v=b521e09fa1';
import {recordPages} from './narrative-records.mjs?v=b521e09fa1';
import {mediaForState} from './media-state.mjs?v=b521e09fa1';
import {DramaScore} from './score.mjs?v=b521e09fa1';
import {entryStateForEpisode,episodeHasMedia} from './episode-navigation.mjs?v=b521e09fa1';
import {nodes,initialState,startId,nextOf,choicesOf,applyChoice,episodeTitles,intimacy} from './story.mjs?v=b521e09fa1';
const reviewEpisode=Number(new URLSearchParams(location.search).get('reviewEpisode'))||0;
const reviewMode=Number.isInteger(reviewEpisode)&&reviewEpisode>=1&&reviewEpisode<=8;
const $=s=>document.querySelector(s),systemZh=/^zh/i.test(navigator.language),key=reviewMode?'meet-me-again-review-'+reviewEpisode:'meet-me-again-video-v1';
let zh=systemZh,manifest,state=initialState(),episode=1,history=[],at=0,part=0,active=$('#filmA'),standby=$('#filmB'),playing=false,rate=1,generation=0,choosing=false,completeEpisode=false;
let advancing=false,frameLoop=0,loadingMedia=false,scrubbing=false,failedLoad=null;
const transitionSamples=[];
const sceneDissolver=createSceneDissolver();let presentedClip=null;
let archives={},saved=null;try{saved=JSON.parse(localStorage.getItem(key));archives=saved?.archives||{};}catch{}
// Remove only the retired opening shot from existing progress; keep choices/state.
function migrateOpening(progress){
 if(!progress?.history)return;
 const oldAt=progress.at||0,kept=progress.history.filter(h=>h.id!=='01-01');
 const removedBefore=progress.history.slice(0,oldAt).filter(h=>h.id==='01-01').length;
 const retiredCurrent=progress.history[oldAt]?.id==='01-01';
 progress.history=kept;progress.at=Math.max(0,Math.min(oldAt-removedBefore,kept.length-1));
 if(retiredCurrent){progress.part=0;progress.time=0;}
}
migrateOpening(saved);for(const progress of Object.values(archives))migrateOpening(progress);
// The two written-evidence routes now have two takes instead of three.
// Keep saved story decisions while mapping an old third-take bookmark.
function migrateWrittenEvidence(progress){
 if(!progress?.history||progress.evidenceEdit===2)return;
 const id=progress.history[progress.at||0]?.id;
 if(id==='03-A1'&&progress.part===2){progress.part=1;progress.time=9.28+(progress.time||0);}
 if(id==='03-B1'&&progress.part===2){progress.part=1;progress.time=7.85+(progress.time||0);}
 progress.evidenceEdit=2;
}
migrateWrittenEvidence(saved);for(const progress of Object.values(archives))migrateWrittenEvidence(progress);
// Episode 5 conversations now use single continuous takes. Preserve old bookmarks.
function migrateEpisode5(progress){
 if(!progress?.history||progress.ep5Edit===1)return;
 const id=progress.history[progress.at||0]?.id;
 if(progress.part===1&&['05-02','05-C1'].includes(id)){progress.time=(id==='05-02'?10.1:9.32)+(progress.time||0);progress.part=0;}
 progress.ep5Edit=1;
}
migrateEpisode5(saved);for(const progress of Object.values(archives))migrateEpisode5(progress);
const bgm=new DramaScore();
// Music (~0.9 MB per theme) waits until the playing clip and every preload are fully downloaded, or 60 s at most.
const fullyBuffered=v=>v.readyState>=1&&v.buffered.length>0&&v.buffered.end(v.buffered.length-1)>=(v.duration||Infinity)-.5;
bgm.gate=()=>new Promise(done=>{const t0=Date.now(),iv=setInterval(()=>{if(Date.now()-t0>60000||fullyBuffered(active)&&[...preloads.values()].every(fullyBuffered)){clearInterval(iv);done();}},500);});const preloads=new Map();let zhLines={};
fetch('production/dialogue-zh.json').then(r=>r.ok?r.json():{}).then(x=>zhLines=x).catch(()=>{});
const t=(a,b)=>zh?a:b;const fmt=n=>`${Math.floor(Math.max(0,n)/60)}:${String(Math.floor(Math.max(0,n)%60)).padStart(2,'0')}`;
function selectPlantMedia(){if(!manifest)return;for(const shot of Object.values(manifest.shots)){if(!shot.baseClips){shot.baseClips=shot.clips;shot.baseIdle=shot.idle;}const media=mediaForState(shot,state);shot.clips=media.clips;shot.idle=media.idle;}}
async function refresh(){manifest=await fetch('manifest.json',{cache:'no-store'}).then(r=>r.json());migrateEpisode5Timeline(saved,manifest.timelineMigration);if(manifest.ep5FlowV3)migrateEpisode5Entrances(saved);for(const progress of Object.values(archives)){migrateEpisode5Timeline(progress,manifest.timelineMigration);if(manifest.ep5FlowV3)migrateEpisode5Entrances(progress);}selectPlantMedia();document.querySelectorAll('#episodeList button').forEach((b,i)=>b.disabled=!episodeReady(i+1));$('#availability').textContent=manifest.complete?'':manifest.mediaComplete?t('八集视频已生成，正在审片与修订。当前为预览版。','All eight episodes are generated and under review. Preview version.'):t('剧集正在制作中；完整成片尚未就绪。','Production is in progress; the complete season is not ready.');$('#start').disabled=!episodeReady(1);return manifest;}
function episodeReady(ep){return episodeHasMedia(manifest?.shots,ep);}
function textUI(){document.documentElement.lang=zh?'zh-CN':'en';$('#cover h1').innerHTML=t('今天，<br>再喜欢我一次。','Meet me,<br>again.');$('#tagline').innerHTML=t('一个陌生人，一扇院门。<br>今天的故事，从你的回应开始。','A stranger. A garden gate.<br>Today begins with your answer.');$('#start').textContent=t('开始故事','Begin');$('#replay').textContent=t('重新体验本集','Replay this episode');$('#chapterDialog h2').textContent=t('剧集','Episodes');$('#speedDialog h2').textContent=t('播放速度','Playback speed');$('#language').textContent=zh?'EN':'中文';$('#seek').setAttribute('aria-label',t('整集播放进度','Episode progress'));$('#chapters').textContent=`${String(episode).padStart(2,'0')} / 08 ▾`;$('#episodeLabel').textContent=`${t('第 '+episode+' 集','Episode '+episode)} · ${episodeTitles[episode-1][zh?0:1]}`;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,2300);}
function checkpoint(){archives[episode]={state:structuredClone(state),history:structuredClone(history),at,part,time:relativeTime(),evidenceEdit:2,ep5Edit:1,ep5Transitions:1,ep5FlowV3:manifest.ep5FlowV3?1:0};localStorage.setItem(key,JSON.stringify({episode,state,history,at,part,time:relativeTime(),rate,archives,evidenceEdit:2,ep5Edit:1,ep5Transitions:1,ep5FlowV3:manifest.ep5FlowV3?1:0}));}
function shotDuration(id){const s=manifest.shots[id];return s?.clips.length?s.clips.reduce((a,c)=>a+c.duration,0):s?.seconds||0;}
function projected(){let total=history.reduce((a,h)=>a+shotDuration(h.id),0),s=structuredClone(history.at(-1)?.before||state),id=history.at(-1)?.id,guard=0;if(!id)return {total:0,estimated:true};while(id&&guard++<90){const choices=choicesOf(id,s);if(choices.length){const c=choices[choices.length-1];s=applyChoice(s,c);id=c.next;}else id=nextOf(id,s);if(id)total+=shotDuration(id);}return {total,estimated:!completeEpisode};}
function currentClip(){return manifest.shots[history[at]?.id]?.clips[part];}
function relativeTime(){return choosing?currentClip()?.duration||0:Math.max(0,Math.min(currentClip()?.duration||0,active.currentTime-(currentClip()?.in||0)));}
function watchFrames(){cancelAnimationFrame(frameLoop);const token=generation;const step=()=>{if(token!==generation||loadingMedia)return;tick();if(token===generation&&!loadingMedia)frameLoop=requestAnimationFrame(step);};frameLoop=requestAnimationFrame(step);}
function elapsed(){return history.slice(0,at).reduce((a,h)=>a+shotDuration(h.id),0)+(manifest.shots[history[at]?.id]?.clips||[]).slice(0,part).reduce((a,c)=>a+c.duration,0)+relativeTime();}
function preloadClip(c){if(!c||preloads.has(c.file)||active.currentSrc===new URL(c.file,location.href).href)return;const v=document.createElement('video');v.preload='auto';if(c.in>0)v.addEventListener('loadedmetadata',()=>{v.currentTime=c.in;},{once:true});v.src=c.file;v.load();preloads.set(c.file,v);while(preloads.size>6){const [k,v]=preloads.entries().next().value;v.removeAttribute('src');v.load();preloads.delete(k);}}
function preload(id){const cs=manifest.shots[id]?.clips;preloadClip(cs?.[0]);if(cs?.[0]?.transition)preloadClip(cs[1]);}
// Slow links: the playing clip gets the bandwidth first. Only the next clip of this shot preloads at once;
// the following shot / every branch waits until the playing clip is fully buffered.
let preloadTimer=0;
function preloadNext(){clearInterval(preloadTimer);const id=history[at].id,clips=manifest.shots[id]?.clips||[],nx=clips[part+1];if(nx){preloadClip(nx);if(nx.transition)preloadClip(clips[part+2]);return;}const idle=manifest.shots[id]?.idle;if(idle&&choicesOf(id,state).length)preloadClip({file:idle,in:0});const v=active,run=()=>{clearInterval(preloadTimer);const cs=choicesOf(id,state);if(cs.length)cs.forEach(c=>preload(c.next));else{const n=nextOf(id,state);if(n)preload(n);}};preloadTimer=setInterval(()=>{if(v!==active||history[at]?.id!==id)return clearInterval(preloadTimer);const b=v.buffered;if(v.readyState>=3&&b.length&&b.end(b.length-1)>=(v.duration||0)-.3)run();},1000);}
async function load(id,index=0,time=0,autoplay=true){sceneDissolver.finish();const previousPicture=presentedClip;selectPlantMedia();failedLoad=null;
// Consecutive narrative nodes may share one unbroken native take. Advance only
// story bookkeeping at that boundary: no pause, seek, reload or video-element swap.
const continuousClip=manifest.shots[id]?.clips[index];
if(autoplay&&time===0&&continuousClip&&active.currentSrc===new URL(continuousClip.file,location.href).href&&Math.abs(active.currentTime-(continuousClip.in||0))<.12&&active.readyState>=2){
 presentedClip=continuousClip;++generation;part=index;choosing=false;completeEpisode=false;loadingMedia=false;advancing=false;playing=true;
 document.body.classList.remove('choosing');$('#decision').hidden=true;$('#ending').hidden=true;
 active.onended=ended;active.ontimeupdate=tick;if(active.paused)await active.play();
 transitionSamples.push({id,index,continuous:true,ms:0});if(transitionSamples.length>20)transitionSamples.shift();$('#stage').dataset.transitions=JSON.stringify(transitionSamples);
 watchFrames();musicFor(id);propFor(id);preloadNext();checkpoint();return true;
}
const loadStarted=performance.now();const token=++generation;loadingMedia=true;advancing=true;playing=false;cancelAnimationFrame(frameLoop);active.pause();active.onended=null;active.ontimeupdate=null;choosing=false;document.body.classList.remove('choosing');$('#decision').hidden=true;$('#ending').hidden=true;completeEpisode=false;const s=manifest.shots[id];if(!s?.ready){$('#busy').textContent=t('这一段仍在制作中，尚未交付。','This scene is still in production.');$('#busy').hidden=false;playing=false;return false;}const clip=s.clips[index];part=index;standby.pause();standby.onended=null;standby.ontimeupdate=null;standby.loop=false;standby.muted=false;standby.volume=1;
// Promote the already-buffered element, instead of discarding its decoded media.
const warmed=preloads.get(clip.file);
if(warmed){preloads.delete(clip.file);const oldStandby=standby;warmed.id=oldStandby.id;warmed.hidden=true;warmed.playsInline=true;oldStandby.replaceWith(warmed);standby=warmed;oldStandby.removeAttribute('src');oldStandby.load();}
standby.loop=false;standby.muted=false;standby.volume=1;standby.playbackRate=rate;standby.preload='auto';
if(!warmed){standby.src=clip.file;standby.load();}const loading=setTimeout(()=>{bgm.pause();$('#busy').hidden=false;$('#busy').textContent=t('正在载入下一段…','Loading the next scene…');},400);
try{await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(new Error('media timeout')),20000);const ready=()=>{clearTimeout(deadline);resolve();};standby.onloadeddata=ready;standby.onerror=()=>{clearTimeout(deadline);reject(new Error('media'));};if(standby.readyState>=2)ready();});if(token!==generation)return false;const seekTime=(clip.in||0)+Math.min(time,Math.max(0,clip.duration-.05));
if(Math.abs(standby.currentTime-seekTime)>.025){await new Promise((resolve,reject)=>{const video=standby;const timer=setTimeout(()=>{cleanup();reject(new Error('seek timeout'));},8000);const done=()=>{cleanup();resolve();};const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);};video.addEventListener('seeked',done,{once:true});video.currentTime=seekTime;});}
if(token!==generation)return false;if(autoplay)await standby.play();if(token!==generation)return false;active.pause();[active,standby]=[standby,active];sceneDissolver.show(active,standby,shouldDissolve(previousPicture,clip,autoplay,time));presentedClip=clip;transitionSamples.push({id,index,preloaded:!!warmed,ms:Math.round(performance.now()-loadStarted)});if(transitionSamples.length>20)transitionSamples.shift();$('#stage').dataset.transitions=JSON.stringify(transitionSamples);playing=autoplay;loadingMedia=false;advancing=false;active.onended=ended;active.ontimeupdate=tick;watchFrames();active.onclick=()=>{if(!choosing)toggle();};$('#toggle').textContent=playing?'Ⅱ':'▶';$('#toggle').setAttribute('aria-label',t(playing?'暂停':'继续',playing?'Pause':'Play'));musicFor(id);propFor(id);preloadNext();checkpoint();if(autoplay&&nodes[id].choiceOnEnter&&!history[at].chosen)await showChoices({keepVideo:true});return true;}catch(e){if(token===generation){failedLoad={id,index,time,autoplay};playing=false;bgm.pause();$('#toggle').textContent='↻';$('#toggle').setAttribute('aria-label',t('重新加载视频','Retry video'));toast(t('视频未能载入，点重试继续。','Could not load this scene. Tap retry to continue.'));}return false;}finally{clearTimeout(loading);if(token===generation){loadingMedia=false;advancing=false;$('#busy').hidden=true;}}}
async function enter(id){history.push({id,before:structuredClone(state)});at=history.length-1;return load(id);}
async function ended(){if(choosing||advancing||loadingMedia)return;advancing=true;const id=history[at].id,s=manifest.shots[id];if(part+1<s.clips.length)return load(id,part+1);if(at+1<history.length){at++;state=structuredClone(history[at].before);return load(history[at].id);}if(nodes[id].choice){active.pause();return showChoices();}if(nodes[id].endEpisode){active.pause();return endEpisode();}const next=nextOf(id,state);if(next)return enter(next);}
async function showChoices({keepVideo=false}={}){const choiceToken=generation;advancing=false;choosing=true;playing=true;document.body.classList.add('choosing');$('#decision').hidden=false;$('#decision>p').textContent=t(nodes[history[at].id].choice.prompt,nodes[history[at].id].choice.en);$('#options').replaceChildren();$('#spots').replaceChildren();const node=nodes[history[at].id],spatial=node.hotspotsVerified&&node.hotspotSha===manifest.shots[history[at].id].clips.at(-1)?.sha256;$('#decision').classList.toggle('spatial',spatial);const cs=choicesOf(history[at].id,state);cs.forEach((c,i)=>{const select=async()=>{if(!choosing)return;choosing=false;$('#options').querySelectorAll('button').forEach(b=>b.disabled=true);for(const k of Object.keys(archives))if(Number(k)>episode)delete archives[k];history=history.slice(0,at+1);state=applyChoice(structuredClone(history[at].before),c);history[at].chosen=c.next;await enter(c.next);};const button=document.createElement('button');button.textContent=t(c.label,c.en);button.onclick=select;$('#options').append(button);if(spatial&&c.spot){button.hidden=true;const spot=document.createElement('button');spot.className='spot';spot.style.left=c.x+'%';spot.style.top=c.y+'%';spot.setAttribute('aria-label',button.textContent);const label=document.createElement('span');label.className='spot-label';label.textContent=t(c.spotLabel,c.spotEn);spot.append(label);spot.onclick=select;$('#spots').append(spot);}});
const idle=manifest.shots[history[at].id]?.idle;if(keepVideo){active.loop=true;active.muted=true;active.onended=null;active.ontimeupdate=null;playing=!active.paused;}else if(nodes[history[at].id].choiceTail){
 const clip=currentClip(),tailStart=clip.out,tailEnd=clip.mediaDuration-.06;
 active.loop=false;active.muted=true;
 const repeat=()=>{if(choiceToken!==generation||!choosing)return;if(active.currentTime>=tailEnd){active.currentTime=tailStart;if(playing)active.play().catch(()=>{});}};
 active.ontimeupdate=repeat;active.onended=repeat;
 if(active.currentTime>=tailEnd)active.currentTime=tailStart;
 await active.play();playing=true;
}else if(idle){standby.pause();const warm=preloads.get(idle);if(warm){preloads.delete(idle);const old=standby;warm.id=old.id;warm.hidden=true;warm.playsInline=true;old.replaceWith(warm);standby=warm;old.removeAttribute('src');old.load();}else{standby.src=idle;standby.load();}standby.loop=true;standby.muted=true;standby.onended=null;standby.ontimeupdate=null;
 // Hold the last frame until the loop can play through: a half-loaded loop freezes mid-motion on slow links.
 try{if(standby.readyState<4)await new Promise(r=>{const d=setTimeout(r,15000);standby.addEventListener('canplaythrough',()=>{clearTimeout(d);r();},{once:true});});if(choiceToken!==generation||!choosing)return;await standby.play();if(choiceToken!==generation||!choosing)return;active.pause();[active,standby]=[standby,active];active.hidden=false;standby.hidden=true;}catch{if(choiceToken===generation)playing=false;}}else{playing=false;active.pause();}$('#en').textContent='';$('#zh').textContent='';if(playing){bgm.duck(false,true);bgm.play(history[at].id,elapsed());}checkpoint();}
function refreshChoiceText(){if(!choosing||!history[at])return;const id=history[at].id,choice=nodes[id].choice,cs=choicesOf(id,state);$('#decision>p').textContent=t(choice.prompt,choice.en);const buttons=$('#options').querySelectorAll('button');cs.forEach((c,i)=>{if(buttons[i])buttons[i].textContent=t(c.label,c.en);});const spots=$('#spots').querySelectorAll('.spot');cs.filter(c=>c.spot).forEach((c,i)=>{if(spots[i]){spots[i].setAttribute('aria-label',t(c.label,c.en));spots[i].querySelector('.spot-label').textContent=t(c.spotLabel,c.spotEn);}});}
function musicFor(id){if(playing){bgm.duck(!!currentClip()?.subtitles.some(c=>active.currentTime>=c.start&&active.currentTime<c.end));bgm.play(id,elapsed());}active.muted=false;}
function tick(){if(choosing||loadingMedia)return;const id=history[at]?.id,c=manifest.shots[id]?.clips[part],cue=c?.subtitles.find(x=>active.currentTime>=x.start&&active.currentTime<x.end);$('#en').textContent=cue?.en||'';$('#zh').textContent=zh?(cue?.zh||zhLines[id]?.[cue?.en]||''):'';bgm.duck(!!cue?.en);const bridge=$('#sceneBridge');const back=!!c?.transition&&!!c?.label;bridge.hidden=!back;if(back)bridge.textContent=c.label;const p=projected(),now=elapsed();$('#time').textContent=`${fmt(now)} / ${p.estimated?'≈ ':''}${fmt(p.total)}`;if(!scrubbing)$('#seek').value=Math.min(1000,now/Math.max(1,p.total)*1000);if(c&&playing&&!advancing&&active.currentTime>=c.out-.03)ended();}
function toggle(){bgm.unlock();if(loadingMedia)return;if(failedLoad){const f=failedLoad;return load(f.id,f.index,f.time,f.autoplay);}if(choosing){if(active.paused){active.play().then(()=>{playing=true;bgm.duck(false,true);bgm.play(history[at].id,elapsed());$('#toggle').textContent='Ⅱ';$('#toggle').setAttribute('aria-label',t('暂停','Pause'));});}else{active.pause();bgm.pause();playing=false;$('#toggle').textContent='▶';$('#toggle').setAttribute('aria-label',t('继续','Play'));}return;}if(!playing){active.play().then(()=>{playing=true;musicFor(history[at].id);$('#toggle').textContent='Ⅱ';$('#toggle').setAttribute('aria-label',t('暂停','Pause'));}).catch(()=>load(history[at].id,part,relativeTime()));}else{active.pause();bgm.pause();playing=false;$('#toggle').textContent='▶';$('#toggle').setAttribute('aria-label',t('继续','Play'));}checkpoint();}
function endEpisode(){advancing=false;completeEpisode=true;playing=false;$('#toggle').textContent='▶';$('#toggle').setAttribute('aria-label',t('继续','Play'));$('#toggle').setAttribute('aria-label',t('继续','Play'));bgm.finish();$('#ending').hidden=false;$('#endSmall').textContent=t('第 '+episode+' 集 · 完','EPISODE '+episode+' · END');$('#endTitle').textContent=episodeTitles[episode-1][zh?0:1];$('#nextEpisode').textContent=episode===8?t('回到第一天','Begin again'):t('下一集','Next episode');$('#nextEpisode').disabled=episode<8&&!episodeReady(episode+1);checkpoint();tick();$('#prop').hidden=true;$('#sceneBridge').hidden=true;$('#zh').textContent='';$('#en').textContent='';}
async function startEpisode(ep,reset=false){bgm.unlock();bgm.reset();if(!episodeReady(ep)){toast(t('本集素材仍在制作，完整版本尚未就绪。','This episode is still in production.'));return;}episode=ep;history=[];at=0;part=0;if(reset||ep===1)state=initialState();$('#cover').hidden=true;$('footer').hidden=false;$('#ending').hidden=true;textUI();await enter(startId(ep));}
function propFor(id){const t=(_zh,en)=>en;const p=$('#prop');p.hidden=true;if(completeEpisode||currentClip()?.transition)return;let text='';const f=t('今天的日期请先核对。\n新发生的事，睡过一夜就留不住。\n先读最新一页。诺拉在隔壁。','Check today’s date first.\nNew memories do not stay after a night’s sleep.\nRead the latest page. Nora is next door.');if(['05-01','05-07','06-01','07-01','08-01'].includes(id))text=f;if(id==='03-A1'&&!nodes[id].writtenPages)text=t('麦溪，这是你的本子。\n先看日期，再看最新一页。\n\n他把标签贴反了。我笑得咖啡都洒了。\n\n今天不想聊天。他修完就走，没有追问。','Maisie, this is your notebook.\nCheck the date, then the newest page.\n\nHe put a label on upside down. I laughed and spilled my coffee.\n\nDidn’t feel like talking today. He finished and left. Didn’t push.');if(id==='05-06')text=t('今天，我选了','Today I chose ')+({tea:t('喝茶','tea'),sea:t('海边散步','a seaside walk'),work:t('一起整理温室','working on the greenhouse')}[state.activity]||'')+t('。他跟着改了计划。\n','; he changed his plans.\n')+({hand:t('我们牵了手。','We held hands.'),pinky:t('只勾了小指。','Just our little fingers.'),words:t('我让他把想牵手说出来，没有牵。','He said he wanted to hold my hand. We didn’t.')}[state.p01]||'');if(id==='05-14')text=({neck:t('我替他擦了颈侧的水。','I dried the water on his neck.'),arm:t('我碰了他的上臂。','I touched his upper arm.'),words:t('我递了毛巾，只在嘴上逗他。','I handed him the towel and teased him.'),bite:t('他开玩笑，我轻咬了一下他的手臂。他笑着认输。','He teased me. I gave his arm a playful little nip. He laughed and surrendered.')}[state.p02]||'');if(id==='07-12')text=t('今天，温室重新开门了。\n','The greenhouse reopened today.\n')+intimacy(state,false)+'\n'+t('这是我今天想做的。','This is what I wanted today.')+'\n'+(state.invitation==='coffee'?t('明天的咖啡，我请。','Tomorrow, coffee is on me.'):t('我为他留了一盆花，等本人来领。','I saved a plant for him to collect.'));if(id==='07-Q1')text=t('我：明天早饭以后，换我请你。你喝什么？\n洛温：美式。谢谢老板。\n洛温：不算员工福利吧？\n我：约会。\n洛温：那我会提前开始高兴。','Me: After breakfast tomorrow, my treat. What do you drink?\nRowan: Americano. Thanks, boss.\nRowan: Not an employee benefit, right?\nMe: A date.\nRowan: Then I’ll start being happy early.');if(id==='07-R1')text=t('我：明天以顾客身份来，别带工具。\n洛温：我的同事有意见，觉得自己要失宠。\n我：带它来复查。\n洛温：全员出席。','Me: Come as a customer tomorrow. No tools.\nRowan: My coworker objects. Feels replaced.\nMe: Bring it for a checkup.\nRowan: Full team attending.');const pages=recordPages(id,state);if(pages)text=pages[Math.min(part,pages.length-1)];if(id==='07-Q1'||id==='08-E3')text='';if(text){p.textContent=text;p.hidden=false;}}
$('#start').onclick=async()=>{bgm.unlock();if(!manifest?.static)await refresh();if(reviewMode&&!saved?.history?.length){return startEpisode(reviewEpisode,true);}if(saved?.history?.length&&!episodeReady(saved.episode)){toast(t('本集正在更新，进度已保留，请稍后重试。','This episode is updating. Your progress is saved; please retry shortly.'));return;}if(saved?.history?.length&&episodeReady(saved.episode)){episode=saved.episode;state=saved.state;history=saved.history;at=saved.at;rate=saved.rate||1;$('#cover').hidden=true;$('footer').hidden=false;textUI();await load(history[at].id,saved.part,saved.time);saved=null;}else{archives={};startEpisode(1,true);}};$('#toggle').onclick=toggle;$('#nextEpisode').onclick=()=>startEpisode(episode===8?1:episode+1);$('#replay').onclick=()=>{state=structuredClone(history[0].before);startEpisode(episode);};$('#language').hidden=!systemZh;$('#language').onclick=()=>{zh=!zh;textUI();refreshChoiceText();if(history[at]){propFor(history[at].id);tick();}};
$('#seek').onpointercancel=()=>{scrubbing=false;tick();};
$('#seek').oninput=()=>{scrubbing=true;if(history.length){active.pause();bgm.pause();playing=false;$('#time').textContent=fmt(Number($('#seek').value)/1000*projected().total)+' / ≈ '+fmt(projected().total);}};
$('#seek').onchange=async()=>{bgm.unlock();bgm.seek();scrubbing=false;if(!history.length)return;const target=Number($('#seek').value)/1000*projected().total;let remaining=target;for(let i=0;i<history.length;i++){const clips=manifest.shots[history[i].id].clips;for(let j=0;j<clips.length;j++){if(remaining<clips[j].duration){at=i;state=structuredClone(history[i].before);return load(history[i].id,j,remaining);}remaining-=clips[j].duration;}}toast(t('请先完成当前选择，再继续后面的故事。','Make this choice before moving further ahead.'));active.play().then(()=>{playing=true;musicFor(history[at].id);$('#toggle').textContent='Ⅱ';$('#toggle').setAttribute('aria-label',t('暂停','Pause'));}).catch(()=>{});tick();};
$('#chapters').onclick=()=>{
 const list=$('#episodeList');list.replaceChildren();
 episodeTitles.forEach((title,i)=>{
  const target=i+1,b=document.createElement('button');
  b.textContent=String(target).padStart(2,'0')+' · '+title[zh?0:1];
  b.disabled=!episodeReady(target);
  b.onclick=async()=>{
   $('#chapterDialog').close();bgm.unlock();
   if(target===episode&&history.length&&$('#cover').hidden)return;
   if(history.length)checkpoint();
   const archive=archives[target];
   saved=null;bgm.reset();$('#cover').hidden=true;$('footer').hidden=false;$('#ending').hidden=true;
   if(archive?.history?.length){
    episode=target;state=structuredClone(archive.state);history=structuredClone(archive.history);
    at=archive.at;part=archive.part;textUI();await load(history[at].id,part,archive.time);
   }else{
    state=entryStateForEpisode(target,archives,initialState);await startEpisode(target);
   }
  };list.append(b);
 });$('#chapterDialog').showModal();
};
$('#speed').onclick=()=>{$('#speeds').replaceChildren();[.75,1,1.25,1.5].forEach(r=>{const b=document.createElement('button');b.textContent=r+'×'+(rate===r?' ✓':'');b.onclick=()=>{rate=r;active.playbackRate=r;$('#speed').textContent=r+'×';$('#speedDialog').close();checkpoint();};$('#speeds').append(b);});$('#speedDialog').showModal();};document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.parentElement.close());document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)toggle();bgm.pause();}});
active.poster='poster.jpg';$('#start').disabled=true;try{await refresh();}catch{$('#availability').textContent=t('连接暂时中断，请点重试。','Connection interrupted. Tap retry.');$('#start').disabled=false;$('#start').onclick=()=>location.reload();}textUI();if(!manifest)$('#start').textContent=t('重试连接','Retry connection');else if(saved?.history?.length)$('#start').textContent=t('继续故事','Continue');
// Warm the clip that Start will play while the cover is still showing (each request costs 1-5 s on slow links).
if(manifest){if(saved?.history?.length){const h=saved.history[saved.at];preloadClip(manifest.shots[h?.id]?.clips[saved.part||0]);}else preload(startId(reviewMode?reviewEpisode:1));}active.poster='poster.jpg';setInterval(()=>{if(!manifest?.complete&&!manifest?.static)refresh().catch(()=>{});},15000);
