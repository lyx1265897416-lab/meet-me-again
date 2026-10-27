import {intimacy} from './story.mjs?v=7f1c48fb51';
// Story facts are shared by evening entries and the next morning's readback.
export const dates=Object.freeze({1:'May 16, 2024',2:'May 16, 2024',3:'May 16, 2024',4:'May 16, 2024',5:'May 17, 2024',6:'May 18, 2024',7:'May 20, 2024',8:'May 21, 2024'});
export const p03Record=s=>({chest:'I rested my palm on his sweater. His heart was racing. We did not kiss.',nape:'I touched the hair at his nape. He laughed; it tickled. We did not kiss.',hug:'I drew him into a hug. He held me, then let go when I looked up. We did not kiss.'}[s.p03]||'');
export const p04Record=s=>({handkiss:'Later, he kissed the back of my hand.',hair:'I messed up his hair, then put it right again.',shoulder:'We sat together with my head on his shoulder.',bite:'I asked him to hold me closer. He teased me again. I gently bit his neck, and he laughed and surrendered. I laughed too.'}[s.p04]||'');
export const p02Record=s=>({neck:'I dried the water on his neck.',arm:'I touched his upper arm.',words:'I handed him the towel and teased him.',bite:'He teased me. I gave his arm a playful little nip through his sleeve. He laughed and surrendered.'}[s.p02]||'');
export const conflictRecord=(s,ending=s.i08)=>"We had a small fight. He picked yesterday’s favorite song. I didn’t like it. "+(ending==='space'?'I asked him to leave, and he did. Tomorrow we’ll keep getting ready to open.':'He understood, and we changed it. I want to see him tomorrow.');
export const invitationRecord=s=>s.invitation==='plant'?'I saved a flowering plant for him. Tomorrow, he comes as my customer.':'After breakfast tomorrow, coffee is on me. It’s a date.';
export function eveningRecord(s){return ['The greenhouse reopened today. I checked my orders. Rowan helped put away the last box.',intimacy(s,false),'This is what I wanted today.',p04Record(s),invitationRecord(s),'Tomorrow, if he still feels unfamiliar, that is okay. Finish my own page first.'].filter(Boolean);}
const entry=(date,lines)=>[date,...lines.filter(Boolean)].join('\n\n');
export function recordPages(id,s){
 const episode=Number(id.slice(0,2));
 if(['05-01','06-01','07-01','08-01'].includes(id))return [entry(dates[episode],['New memories do not stay after a night’s sleep. Read my latest notes. Nora is next door.',id==='07-01'?entry(dates[6],[p03Record(s),conflictRecord(s)]):''])];
 if(id==='05-07')return [entry(dates[5],['Today’s page. My plans, my choices.'])];
 if(id==='05-14')return [entry(dates[5],[p02Record(s)])];
 if(id==='06-G2'||id==='06-H2')return [entry(dates[6],[p03Record(s),conflictRecord(s,id==='06-H2'?'space':'stay')])];
 if(id==='07-12'){const a=eveningRecord(s);return [entry(dates[7],[a[0],intimacy(s,false),'This is what I wanted today.']),entry(dates[7],[p04Record(s)||'I chose to stop there. Nothing more happened.',invitationRecord(s)]),entry(dates[7],['Tomorrow, if he still feels unfamiliar, that is okay. Finish my own page first.','I want to give him something to look forward to, too.'])];}
 if(id.startsWith('08-A1'))return [entry(dates[7],['Last night:',intimacy(s,false),'This is what I wanted that day.'])];
 if(id.startsWith('08-A2'))return [entry(dates[7],['Later that evening:',p04Record(s)])];
 return null;
}
