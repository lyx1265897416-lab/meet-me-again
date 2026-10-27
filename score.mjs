// Music remains a separate track: the native videos and locked dialogue are untouched.
export function themeFor(id){
  const ep=Number(id.slice(0,2)), shot=id.slice(3);
  if(ep===1)return 'daylight';
  if(ep===2)return ['08','09','10'].includes(shot)?'memory':'daylight';
  if(ep===3)return 'memory';
  if(ep===4)return ['01','02','03','A1','B1'].includes(shot)?'memory':'again';
  if(ep===5)return /^(04|D1|D2|E1|F1|12|G1|H1|J1|K1|K2|K3|13)$/.test(shot)?'close':'daylight';
  if(ep===6)return /^(03|04|05|06|H1|H2)$/.test(shot)?'memory':/^(G1|G2)$/.test(shot)?'again':'close';
  if(ep===7)return /^(01|02.*|03|04|05|06|A1|B1)$/.test(shot)?'daylight':/^(10|11|12|Q1|R1)$/.test(shot)?'again':'close';
  return 'again';
}

export class DramaScore{
  constructor(){
    this.context=null;this.buffers=new Map();this.current=null;this.voices=new Set();
    this.pending=new Map();this.gate=()=>Promise.resolve();this.token=0;this.ducked=true;this.waiting=false;this.resync=false;this.stopped=true;
  }
  unlock(){
    // Called directly inside the normal start/play gesture, before any fetch/await.
    if(!this.context){const C=window.AudioContext||window.webkitAudioContext;this.context=new C();this.context.onstatechange=()=>{document.documentElement.dataset.musicContext=this.context.state;};}
    if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }
  buffer(name){
    if(this.buffers.has(name))return Promise.resolve(this.buffers.get(name));
    if(!this.pending.has(name)){
      // Video has priority on slow links: the player's gate resolves once no video is downloading.
      const p=this.gate().then(()=>fetch(`voices/music/${name}.mp3`)).then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer();})
        .then(data=>this.context.decodeAudioData(data)).then(b=>{this.buffers.set(name,b);return b;})
        .catch(e=>{this.pending.delete(name);throw e;});this.pending.set(name,p);
    }
    return this.pending.get(name);
  }
  level(){return this.waiting?.23:this.ducked?.22:.37;}
  report(status){
    document.documentElement.dataset.musicState=status;
    document.documentElement.dataset.musicTheme=this.current?.name||'';
    document.documentElement.dataset.musicGain=String(this.level());
  }
  ramp(voice,value,seconds=.55){
    const p=voice.gain.gain,now=this.context.currentTime;
    if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(now);else{p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);}
    p.linearRampToValueAtTime(value,now+seconds);
  }
  duck(speech,waiting=false){
    if(this.ducked===speech&&this.waiting===waiting)return;
    this.ducked=speech;this.waiting=waiting;
    this.report(this.stopped?'paused':'playing');
    if(this.current&&!this.stopped)this.ramp(this.current,this.level(),speech?.18:.65);
  }
  seek(){this.resync=true;}
  async play(id,position=0){
    if(!this.context)this.unlock();
    this.stopped=false;const name=themeFor(id),token=++this.token;
    if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    if(this.current?.name===name&&!this.resync){this.ramp(this.current,this.level(),.35);this.report('playing');return;}
    try{
      const buffer=await this.buffer(name);
      if(token!==this.token||this.stopped)return;
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.context.destination);gain.gain.value=0;
      const voice={name,source,gain};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();};
      source.start(0,Math.max(0,position)%buffer.duration);
      const previous=this.current;this.current=voice;this.resync=false;this.ramp(voice,this.level(),1.1);
      this.report('playing');
      if(previous){this.ramp(previous,0,1.1);try{previous.source.stop(this.context.currentTime+1.15);}catch{}}
      // Other themes load on first use only: warming all four (~8 MB) starved video on slow links.
    }catch(e){this.report('unavailable');console.warn('Background music could not load:',name,e.message);}
  }
  pause(){this.token++;this.stopped=true;if(this.context)this.context.suspend().catch(()=>{});this.report('paused');}
  finish(){
    this.token++;this.stopped=true;
    for(const voice of this.voices){this.ramp(voice,0,1.8);try{voice.source.stop(this.context.currentTime+1.85);}catch{}}
    this.current=null;
    this.report('ending');
  }
  reset(){
    this.token++;for(const voice of this.voices){try{voice.source.stop();}catch{}}
    this.current=null;this.resync=true;
  }
}
