export const episodeTitles=[['请勿给陌生男人浇水','Please Don’t Water the Stranger'],['你的推销有点过头','A Little Too Familiar'],['这不是我们的第一次见面','Not Our First Meeting'],['如果明天我又不喜欢你','What If Tomorrow Is Different?'],['同一个人，新的坏主意','Same Man, New Bad Ideas'],['别把昨天的我搬回来','Meet Me Today'],['我今天是真的喜欢你','I Like You. Today.'],['初次见面，今天我请','My Turn to Say Hello']];
export const initialState=()=>({plant:null,activity:null,p01:null,p02:null,p03:null,i08:null,i09:null,i10:null,k:null,p04:null,invitation:null,final:null,evidence:[],questions:[]});
export const nodes={};
const n=(id,next,extra={})=>nodes[id]={id,next,...extra};
const chain=(ids,next)=>ids.forEach((id,i)=>n(id,ids[i+1]??next));
const c=(label,en,next,set={},x=50,y=65)=>({label,en,next,set,x,y});
const choice=(id,prompt,en,choices)=>{nodes[id].choice={prompt,en,choices};nodes[id].next=null;};
const patch=(id,extra)=>Object.assign(nodes[id],extra);
chain(['01-02','01-03','01-04']);
choice('01-04','先确认一下','Check him out first',[
c('看看工具袋','Show me the tools','01-A1',{i01:'tools'},27,73),c('先在门外说','Explain from there','01-B1',{i01:'outside'},52,46),c('问问诺拉','Ask Nora','01-C1',{i01:'nora'},80,43)]);
chain(['01-A1','01-A2'],'01-05-confirm');chain(['01-B1','01-B2'],'01-05-confirm');n('01-C1','01-05');n('01-05-confirm','01-05');chain(['01-05','01-06'],null);patch('01-06',{endEpisode:1});
chain(['02-01','02-02','02-03','02-04','02-05','02-06','02-07']);
choice('02-07','挑一盆给他','A plant for his office',[c('迷迭香 · 学着照顾','Rosemary · Learn to care','02-A1',{plant:'rosemary'},23,72),c('薄荷 · 能泡茶','Mint · Make tea','02-B1',{plant:'mint'},50,72),c('仙人掌 · 适合你','Cactus · Seems fitting','02-C1',{plant:'cactus'},77,72)]);
['02-A1','02-B1','02-C1'].forEach(id=>n(id,'02-08'));chain(['02-08','02-09','02-10'],null);patch('02-10',{endEpisode:2});
chain(['03-01','03-02','03-03','03-04']);
const evidenceChoices=[c('翻开自己的本子','My own handwriting','03-A1',{evidence:'notebook'},24,66),c('播放自己的语音','My own recording','03-B1',{evidence:'voice'},53,68),c('向诺拉核对','Check with Nora','03-C1',{evidence:'nora'},79,43)];
choice('03-04','先看哪一份？','What do you want to check first?',evidenceChoices);
// The table is already readable on its first frame; no silent waiting shot.
nodes['03-04'].choiceOnEnter=true;
['03-A1','03-B1','03-C1'].forEach(id=>{n(id,null);choice(id,'还想核对什么？','Anything else you want to check?',s=>[...evidenceChoices.filter(c=>!s.evidence.includes(c.set.evidence)),c('我想问他','Talk to Rowan','03-05')]);});
chain(['03-05','03-06','03-07','03-08'],null);patch('03-08',{endEpisode:3});
chain(['04-01','04-02','04-03']);
const questions=[c('你背过能逗笑我的话？','Have you memorized the answers?','04-A1',{questions:'answers'}),c('我们以前是什么关系？','What exactly were we?','04-B1',{questions:'relationship'}),c('明天我又不喜欢你呢？','What if I don’t like you tomorrow?','04-C1',{questions:'tomorrow'})];
choice('04-03','有些事，我想说清楚','There are things I need to ask',questions);
['04-A1','04-B1','04-C1'].forEach(id=>{n(id,null);choice(id,'还有一个问题…','One more thing…',s=>[...questions.filter(c=>!s.questions.includes(c.set.questions)),c('说说以后的约定','Set our ground rules',s.questions.includes('relationship')?'04-04':'04-04-facts')]);});
n('04-04-facts','04-04');n('04-04',null);choice('04-04','今天呢？','And today?',[c('进来坐一会儿','Come sit for a minute','04-A2',{i05:'stay'}),c('明天，早饭以后','Tomorrow, after breakfast','04-B2',{i05:'tomorrow'})]);['04-A2','04-B2'].forEach(id=>n(id,'04-05'));n('04-05',null,{endEpisode:4});
chain(['05-01','05-02','05-03']);choice('05-03','今天的安排，由我来选','Today’s plan is mine',[c('咖啡卡','The coffee card','05-A1',{activity:'tea'},25,70),c('海边卡','The seaside card','05-B1',{activity:'sea'},50,70),c('陪我整理温室','Help me get ready to open','05-C1',{activity:'work'},75,70)]);
chain(['05-A1','05-A2'],'05-04');chain(['05-B1','05-B2'],'05-04');n('05-C1','05-04');n('05-04',null);
choice('05-04','他的手，还在等我的回应','His hand is waiting for my answer',[c('把手放进他掌心','Take his hand','05-D1',{p01:'hand'},48,69),c('先勾住小指','Just his little finger','05-E1',{p01:'pinky'},60,72),c('拉袖口 · 让他说清楚','Tug his sleeve · Say it','05-F1',{p01:'words'},34,63)]);
n('05-D1','05-05');n('05-E1',null);choice('05-E1','试用装，要升级吗？','Upgrade the free sample?',[c('摊开手，握住','Open my hand','05-D2',{p01:'hand'}),c('就先勾着','Just the little finger','05-05')]);n('05-D2','05-05');n('05-F1','05-05');chain(['05-05','05-07','05-08','05-09','05-10','05-11','05-12']);
choice('05-12','毛巾拿到了。然后呢？','You have the towel. Now…',[c('替他擦颈侧','Dry his neck','05-G1',{p02:'neck'},55,40),c('搭到肩上，碰一下手臂','Touch his arm','05-H1',{p02:'arm'},75,57),c('递毛巾，嘴上逗他','Hand it over · Tease him','05-J1',{p02:'words'},40,68),c('再问，我可会咬人','Ask again and I’ll bite','05-K1',{p02:'bite'},25,56)]);
['05-G1','05-H1','05-J1'].forEach(id=>n(id,'05-13'));chain(['05-K1','05-K2','05-K3'],'05-13');chain(['05-13','05-06','05-14'],null);patch('05-14',{endEpisode:5});
n('06-01',s=>s.p02==='bite'?'06-A0':'06-02');n('06-A0','06-02');n('06-02',null);choice('06-02','工间休息','A little break',[c('接住他的手','Take his hand','06-A1',{i07:'dance'},48,66),c('先让他示范','Let him demonstrate','06-B1',{i07:'demo'},72,64),c('递杯水，坐着听','Sit and listen','06-C1',{i07:'sit'},27,72)]);
n('06-A1',null);choice('06-A1','舞停了，我还想…','The music slows. I want…',[c('留在近处','Stay close','06-A2'),c('回桌边坐','Sit back down','06-A3')]);n('06-A2',null);choice('06-A2','看看他有多镇定','How composed is he, really?',[c('轻贴胸前衣料','Touch his sweater','06-D1',{p03:'chest'},50,61),c('碰后颈发际','Touch his nape','06-E1',{p03:'nape'},69,34),c('拉近衣料，抱一会儿','Draw him into a hug','06-F1',{p03:'hug'},29,52)]);
['06-A3','06-B1','06-C1','06-D1','06-E1','06-F1'].forEach(id=>n(id,'06-03'));chain(['06-03','06-04','06-05','06-06']);choice('06-06','今天这页，由我来写','This page is mine to write',[c('留下，重新认识今天的我','Stay. Meet today’s me','06-G1',{i08:'stay'}),c('我需要安静，明天再见','I need quiet. See you tomorrow','06-H1',{i08:'space'})]);chain(['06-G1','06-G2'],null);chain(['06-H1','06-H2'],null);['06-G2','06-H2'].forEach(id=>patch(id,{endEpisode:6}));
n('07-01',s=>s.plant==='mint'?'07-02-mint':s.plant==='cactus'?'07-02-cactus':'07-02');['07-02','07-02-mint','07-02-cactus'].forEach(id=>n(id,'07-03'));chain(['07-03','07-04','07-05','07-06']);choice('07-06','今天的奖金，再多一点','A little extra bonus',[c('拿掉帽子','Take off his cap','07-A1',{i09:'hat'},50,22),c('把草莓给他','Give him the strawberry','07-B1',{i09:'cake'},28,73),c('让他坐近','Ask him to sit closer','07-C1',{i09:'chair'},76,66),c('理头发，碰颈侧','Brush his hair, touch his neck','07-D1',{i09:'neck'},67,34)]);['07-A1','07-B1','07-C1','07-D1'].forEach(id=>n(id,'07-07'));chain(['07-07','07-08']);choice('07-08','我今天的回答','My answer, today',[c('轻拉领边 · 来吧','Draw him closer · Come here','07-E1',{i10:'kiss'},40,52),c('走进他的拥抱','Step into his arms','07-J1',{i10:'hug'},55,66),c('握住手，慢一点','Take his hand. Slowly','07-K1',{i10:'hand'},72,74)]);
chain(['07-E1','07-E2']);choice('07-E2','那句聪明话，可以晚点再说','The clever line can wait',[c('再靠近','Kiss him again','07-F1',{k:'again'},50,40),c('留在怀里','Stay in his arms','07-G1',{k:'hug'},38,62),c('松开，缓一缓','A moment to breathe','07-H1',{k:'pause'},76,72)]);n('07-F1','07-09');n('07-G1',null);choice('07-G1','抱得舒服吗？','Comfortable?',[c('很舒服','Very','07-G2',{k:'hug'}),c('有一点热','A little hot','07-G3',{k:'hot'})]);n('07-G2','07-09');n('07-G3','07-10');n('07-H1','07-10');n('07-J1','07-09');n('07-K1','07-10');n('07-09',null);choice('07-09','再待一小会儿','A little longer',[c('递出手背','Offer my hand','07-L1',{p04:'handkiss'},40,69),c('揉乱他的头发','Mess up his hair','07-M1',{p04:'hair'},51,22),c('靠着肩坐一会儿','Rest on his shoulder','07-N1',{p04:'shoulder'},30,46),c('靠近，轻轻咬一下','Closer. A playful little bite','07-P1',{p04:'bite'},70,40),c('今天到这里','That’s enough for today','07-10',{p04:null},50,83)]);['07-L1','07-M1','07-N1'].forEach(id=>n(id,'07-10'));chain(['07-P1','07-P2','07-P3','07-P4'],'07-10');chain(['07-10','07-11']);choice('07-11','给明天留一个邀请','Leave an invitation for tomorrow',[c('明天的咖啡，我请','Coffee is on me','07-Q1',{invitation:'coffee'}),c('做我的第一位客人','Be my first customer','07-R1',{invitation:'plant'})]);['07-Q1','07-R1'].forEach(id=>n(id,'07-12'));n('07-12',null,{endEpisode:7});
chain(['08-01','08-02']);patch('08-02',{next:s=>s.i10==='hug'?'08-A1-hugonly':s.i10==='hand'?'08-A1-handonly':s.k==='hug'?'08-A1-hug':s.k==='hot'?'08-A1-hot':s.k==='pause'?'08-A1-pause':'08-A1'});
const addition=s=>s.p04?({handkiss:'08-A2',hair:'08-A2-hair',shoulder:'08-A2-shoulder',bite:'08-A2-bite'}[s.p04]):'08-03';
['08-A1','08-A1-hugonly','08-A1-handonly','08-A1-hug','08-A1-hot','08-A1-pause'].forEach(id=>n(id,addition));['08-A2','08-A2-hair','08-A2-shoulder','08-A2-bite'].forEach(id=>n(id,'08-03'));n('08-03',s=>s.invitation==='plant'?'08-C1':'08-B1');n('08-B1','08-04');n('08-C1','08-04');n('08-04',s=>s.invitation==='plant'?'08-E1':'08-D1');chain(['08-D1','08-D2'],'08-05');chain(['08-E1','08-E2','08-E3'],'08-05');n('08-05',null);choice('08-05','新的一天，一起进去','A new day. Together',[c('牵住他的手','Take his hand','08-F1',{final:'hand'},45,70),c('并肩往里走','Walk beside him','08-G1',{final:'side'},72,62)]);['08-F1','08-G1'].forEach(id=>n(id,'08-06'));n('08-06',null,{endEpisode:8});
export const startId=episode=>Number(episode)===1?'01-02':`${String(episode).padStart(2,'0')}-01`;
export const nextOf=(id,s)=>typeof nodes[id].next==='function'?nodes[id].next(s):nodes[id].next;
export const choicesOf=(id,s)=>typeof nodes[id].choice?.choices==='function'?nodes[id].choice.choices(s):nodes[id].choice?.choices||[];
export function applyChoice(s,c){const copy=structuredClone(s);for(const [k,v] of Object.entries(c.set||{})){if(k==='evidence'||k==='questions'){if(!copy[k].includes(v))copy[k].push(v);}else copy[k]=v;}return copy;}
export function intimacy(s,zh=true){const m=zh?{again:'我们吻了两次，第二次是我拉他回来的。',hug:'我们吻了一次，后来我不想放开他的拥抱。',hot:'我们吻了一次，抱了一会儿。我说热，他就松开了。',pause:'我们吻了一次。我说想缓一会儿，他退开让我休息。'}:{again:'We kissed twice. I pulled him back for the second.',hug:'We kissed once. Then I didn’t want to leave his arms.',hot:'We kissed once and hugged. I said I was warm; he let go.',pause:'We kissed once. I needed a moment, and he gave me space.'};return s.i10==='hug'?(zh?'我先让他抱了我，没有吻。':'I asked him to hold me. We didn’t kiss.'):s.i10==='hand'?(zh?'我们只牵了手。他没有催我。':'We only held hands. He didn’t rush me.'):m[s.k]||'';}

// Hotspots measured against the current native decision-end frames.
nodes["02-07"].hotspotsVerified=true;nodes["02-07"].hotspotSha="a22fdedd438773e946cb7f210713a7ae674d367d52494a71d77d09fdfff87030";
Object.assign(nodes["02-07"].choice.choices[0],{"x": 18, "y": 62, "spot": true, "spotLabel": "迷迭香", "spotEn": "Rosemary"});
Object.assign(nodes["02-07"].choice.choices[1],{"x": 51, "y": 62, "spot": true, "spotLabel": "薄荷", "spotEn": "Mint"});
Object.assign(nodes["02-07"].choice.choices[2],{"x": 87, "y": 62, "spot": true, "spotLabel": "仙人掌", "spotEn": "Cactus"});
nodes["03-04"].hotspotsVerified=true;nodes["03-04"].hotspotSha="0aeee4a5b8dc28790ab2144d082c9c64de97bc8ee95af100d4d72f864b2595b9";
Object.assign(nodes["03-04"].choice.choices[0],{"x": 21, "y": 59, "spot": true, "spotLabel": "翻开本子", "spotEn": "Read my notes"});
Object.assign(nodes["03-04"].choice.choices[1],{"x": 48, "y": 59, "spot": true, "spotLabel": "播放语音", "spotEn": "Play recording"});
nodes["07-06"].hotspotsVerified=true;nodes["07-06"].hotspotSha="128f08e5d7ca761171bffc8373cfd4e775fc346c94cb0d72f6931755f8fd7d9d";
Object.assign(nodes["07-06"].choice.choices[0],{"x": 43, "y": 13, "spot": true, "spotLabel": "拿掉帽子", "spotEn": "Take off cap"});
Object.assign(nodes["07-06"].choice.choices[1],{"x": 44, "y": 69, "spot": true, "spotLabel": "递给他草莓", "spotEn": "Offer strawberry"});
Object.assign(nodes["07-06"].choice.choices[3],{"x": 59, "y": 43, "spot": true, "spotLabel": "碰颈侧", "spotEn": "Touch his neck"});

// Revised written evidence: choices arrive at speech end, native quiet tail stays alive.
for (const id of ["03-A1","03-B1"]) nodes[id].choiceTail=true;
nodes["03-A1"].writtenPages=true;
