// @ts-nocheck
// Kagemi frame engine. Generated from the Frame Atelier prototype. Pure JS, no dependencies, SSR-safe.
const DEFS=[];
const document={getElementById:(id)=>id==='df'?{insertAdjacentHTML:(_,h)=>DEFS.push(h),appendChild:(e)=>DEFS.push(e)}:null,createElementNS:()=>({id:'',innerHTML:''})};

const PI=Math.PI,cs=a=>Math.cos(a*PI/180),sn=a=>Math.sin(a*PI/180),f1=n=>n.toFixed(1);
const PAL={gold:['#ffe28a','#e0a02c','#fff4c8'],silver:['#f2f6ff','#9aa8c4','#ffffff'],ruby:['#ff6b7d','#b3122e','#ffc2cb'],cyan:['#6df3ff','#1f8fd6','#d6fbff'],jade:['#8bf5b0','#1e9a5e','#d6ffe4'],rose:['#ffa9d1','#e0508f','#ffe0ee'],violet:['#c59bff','#6a2fd6','#eadbff'],ember:['#ffb347','#e8441a','#fff0c2'],ice:['#c9f1ff','#58a8e8','#ffffff'],void:['#8a63ff','#2a1450','#ff4f7b'],brass:['#f0c26a','#9a5a22','#ffe9b0'],copper:['#ffa56a','#a8431f','#ffd9bf'],lime:['#c8ff6a','#3f9a2c','#f2ffd0'],mint:['#9ff5e3','#4cb7c9','#f0fffb'],sun:['#fff07a','#ff9a1f','#ffffff'],night:['#5b7bff','#1c1f6b','#b8c6ff'],blood:['#ff3b57','#4a0714','#ffb0bc']};
const M={leaf:'M0-11C8-4 8 6 0 11C-8 6-8-4 0-11Z',dia:'M0-10L6 0L0 10L-6 0Z',spike:'M0-13L3.5 5L-3.5 5Z',petal:'M0 2C-9-5-7-14 0-12C7-14 9-5 0 2Z',star:'M0-11Q1.5-1.5 11 0Q1.5 1.5 0 11Q-1.5 1.5-11 0Q-1.5-1.5 0-11Z',flame:'M0-13C6-6 9 0 6 6C4 11-4 11-6 6C-9 0-3-4 0-13Z',heart:'M0 9C-13-2-8-11 0-5C8-11 13-2 0 9Z',moon:'M3-10A10 10 0 1 0 3 10A8 8 0 1 1 3-10Z',paw:'M0 1C-6 1-7 9 0 9C7 9 6 1 0 1ZM-8-1a2.3 3 0 1 0 .1 0ZM-3-6a2.3 3 0 1 0 .1 0ZM3-6a2.3 3 0 1 0 .1 0ZM8-1a2.3 3 0 1 0 .1 0Z',orb:'M-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z',blade:'M0-14L3-6V6L0 10L-3 6V-6Z',fang:'M-3 10Q0 0 0-10Q3 0 3 10Z',cross:'M-2-10H2V-2H10V2H2V10H-2V2H-10V-2H-2Z',bolt:'M2-12L-6 2H0L-3 12L7-3H1Z',
r0:'M-3-9V9M-3-3L5-9M-3 1L5-5',r1:'M-4-9V9L4 3',r2:'M0-9V9M-5-4L0 0L5-4',r3:'M-4-9L4 9M4-9L-4 9',r4:'M-4-9V9M4-9V9M-4-3L4 3',r5:'M0-9L5 0L0 9L-5 0ZM0-9V9',r6:'M-4 9L0-9L4 9M-3 3H3',r7:'M-4-9L4-3L-4 3L4 9'};
const AT={
ear:'<path d="M126 54L153 12L163 68Z"/><path d="M134 52L151 26L156 60Z" fill="#0005" stroke="none"/>',
bun:'<path d="M120 48C106 16 116-8 132 0C148 8 144 36 136 58Z"/><path d="M125 42C118 22 124 6 131 8C138 12 136 32 133 48Z" fill="#0005" stroke="none"/>',
horn:'<path d="M128 52C126 28 146 10 172 6C160 20 158 36 150 60Z"/>',
antler:'<path d="M130 56C136 38 142 22 150 2M139 30L164 22M145 14L162 2M133 44L156 42" fill="none" stroke-width="3.5" stroke-linecap="round"/>',
wing:'<path d="M146 98C166 70 190 62 216 34C214 64 206 88 186 102C198 100 208 100 218 102C206 118 180 124 148 118Z"/><path d="M152 102C170 88 190 82 206 68M152 110C172 102 192 102 208 102M154 96C172 80 192 70 208 52M154 114C172 110 194 112 210 112" fill="none" stroke="#0007" stroke-width="1.5"/>',
wing2:'<path d="M146 100L190 44L182 80L212 66L198 98L218 98L192 120L146 112Z"/>',
sword:'<path d="M62 164L170 34L180 42L70 172Z"/><path d="M162 26L186 46L182 52L156 32Z"/>',
pipe:'<path d="M148 76C172 72 184 56 180 28" fill="none" stroke-width="6" stroke-linecap="round"/><circle cx="180" cy="26" r="5"/>',
crown:'<path d="M70 38L78 6L92 26L100-6L108 26L122 6L130 38Z"/><circle cx="100" cy="6" r="3.5" fill="#fff" stroke="none"/><circle cx="78" cy="6" r="2.5" fill="#fff" stroke="none"/><circle cx="122" cy="6" r="2.5" fill="#fff" stroke="none"/>',
halo:'<ellipse cx="100" cy="6" rx="30" ry="7" fill="none" stroke-width="3.5"/>',
gem:'<path d="M100 4L112 22L100 46L88 22Z"/><path d="M100 4V46M88 22H112" fill="none" stroke="#fff6" stroke-width="1"/>'};
const SGL={crown:1,halo:1,gem:1},BK={wing:1,wing2:1,sword:1,pipe:1};
document.getElementById('df').insertAdjacentHTML('beforeend',Object.entries(M).map(([k,d])=>`<path id="m-${k}" d="${d}"/>`).join('')+Object.entries(AT).map(([k,v])=>`<g id="A-${k}">${v}</g>`).join(''));
const FXT={sakura:['petal','#ffb3d1',1],ember:['flame','#ff8a3a',-1],snow:['orb','#ffffff',1],spark:['star','#ffe9a0',-1],fly:['orb','#dfff7a',-.3],steam:['orb','#d9d2c0',-1],heart:['heart','#ff8fc2',-1],leaf:['leaf','#79d46c',1],rune:['r2','#9fd0ff',-1],soul:['flame','#9b6bff',-1],bolt:['bolt','#bfe8ff',0],feather:['petal','#ffffff',1],star:['star','#ffffff',0],bubble:['orb','#b8f0ff',-1]};
const C=(id,col)=>/^r\d/.test(id)?`fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`:`fill="${col}"`;
const R=(n,r,id,sc,col,off=0,cl='',cx=100,cy=100)=>Array.from({length:n},(_,k)=>{const a=off+k*360/n,d=typeof id=='function'?id(k):id,u=`<use href="#m-${d}" transform="translate(${f1(cx+r*cs(a))} ${f1(cy+r*sn(a))}) rotate(${f1(a+90)}) scale(${sc})" ${C(d,col)}/>`;return cl?`<g class="${cl}" style="--d:${2+k%3}s;animation-delay:-${(k*.37).toFixed(2)}s">${u}</g>`:u}).join('');
let SB_ON=0;
const S=(d,x,rv,cx=100,cy=100)=>SB_ON?SBS(d,x,rv,cx,cy):`<g><animateTransform attributeName="transform" type="rotate" from="${rv?360:0} ${cx} ${cy}" to="${rv?0:360} ${cx} ${cy}" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;
const O=(r,w,s,x='')=>`<circle cx="100" cy="100" r="${f1(r)}" fill="none" stroke="${s}" stroke-width="${w}" ${x}/>`;
const pt=(r,a)=>f1(100+r*cs(a))+','+f1(100+r*sn(a)),pg=(n,r,o=0,s=1)=>Array.from({length:n},(_,k)=>pt(r,o+(k*s%n)*360/n)).join(' ');
const gear=(n,r1,r2,rh,cx=100,cy=100)=>{let d='';const s=2*PI/n;for(let k=0;k<n;k++){const a=k*s;[[0,r1],[.12,r2],[.38,r2],[.5,r1]].forEach(([u,r],j)=>{d+=(k+j?'L':'M')+f1(cx+r*Math.cos(a+u*s))+' '+f1(cy+r*Math.sin(a+u*s))})}return `${d}ZM${f1(cx+rh)} ${cy}a${rh} ${rh} 0 1 0 ${-2*rh} 0a${rh} ${rh} 0 1 0 ${2*rh} 0Z`};
const wv=(r,a,fq,ph=0)=>'M'+Array.from({length:73},(_,k)=>{const t=k*5,q=r+a*sn(t*fq+ph);return f1(100+q*cs(t))+' '+f1(100+q*sn(t))}).join('L')+'Z';
const mk=s=>()=>(s=s*16807%2147483647)/2147483647;
const sp=(r,sw,o)=>'M'+Array.from({length:30},(_,k)=>{const a=o+k*sw/29,q=r-k*.35;return f1(100+q*cs(a))+' '+f1(100+q*sn(a))}).join('L');
const pd=(n,r,o)=>'M'+pg(n,r,o).split(' ').join('L')+'Z';
const RP=(d,w,A)=>{const s=`d="${d}" fill="none" stroke-linejoin="round"`;return `<path ${s} stroke="#000" stroke-width="${w+2}" opacity=".45" transform="translate(0 2.5)"/><path ${s} stroke="${A}" stroke-width="${w}"/><path ${s} stroke="url(#sh)" stroke-width="${w}"/><path ${s} stroke="#fff" stroke-opacity=".6" stroke-width="1"/>`};
const RG=(v,r,w,A)=>[()=>O3(r,w,A),()=>RP(pd(6,r*1.1,-90),w,A),()=>RP(pd(8,r*1.05,-67.5),w,A),()=>RP(wv(r,2.6,12),w,A),()=>RP(wv(r,2.2,6),w*.7,A)+RP(wv(r,2.2,6,180),w*.7,A)][v]();
const EM=['heart','star','moon','flame','cross','blade','leaf','fang','paw','petal','bolt','dia','spike','orb'];
const Y=(z,x)=>`<g class="ly" style="--z:${z}"><g transform="translate(100 100) scale(.84) translate(-100 -100)">${x}</g></g>`;
const O3=(r,w,A)=>O(r+1,w+2,'#000','opacity=".45" transform="translate(0 2.5)"')+O(r,w,A)+O(r,w,'url(#sh)')+O(r-w/2+.8,1,'#fff','opacity=".65"')+O(r+w/2-.8,1,'#000','opacity=".35"')+O(r,Math.max(1,w/3),'#fff','stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".55"');
const EL={
fire:(c,rr,T)=>`<g filter="url(#fl)">${R(14+T,rr+7,'flame',1.9+.25*T,'#d62b0c')}${R(14+T,rr+7,'flame',1.3+.2*T,'#ff8a1f',12,'p')}${R(14+T,rr+7,'flame',.7+.15*T,'#fff3a0',6,'p')}</g>`,
water:(c,rr,T)=>S(34,`<path d="${wv(rr+9,3.5,7)}" fill="none" stroke="${c[0]}" stroke-width="1.8"/>`)+S(26,`<path d="${wv(rr+14,3,10,90)}" fill="none" stroke="${c[2]}" stroke-width="1.2" opacity=".8"/>`,1)+S(20,R(6+T,rr+11,'orb',1.2,c[2],0,'b')+R(6+T,rr+11,'orb',.45,'#fff',0,'b'),1),
earth:(c,rr,T)=>S(50,R(6+T,rr+14,'dia',2+.2*T,'#6b4f33',0,'b')+R(6+T,rr+14,'dia',1.2+.1*T,'#b08d5e',0,'b')+R(6+T,rr+14,'dia',.5,c[2],0,'tw'))+R(14,rr+3,'spike',.9,'#5e4630',10),
steam:(c,rr,T,rd)=>`<g filter="url(#bl)">${Array.from({length:3+T},()=>{const a=rd()*360,d=rr+rd()*14;return `<g class="rise" style="--d:${(3+rd()*2).toFixed(1)}s;--y:-45px;--x:${Math.round(rd()*20-10)}px;animation-delay:-${(rd()*4).toFixed(1)}s"><circle cx="${f1(100+d*cs(a))}" cy="${f1(100+d*sn(a))}" r="${Math.round(6+rd()*5)}" fill="#f2efe6" fill-opacity=".75"/></g>`}).join('')}</g>`,
light:(c,rr,T)=>`<g opacity=".5">${S(70,R(24,rr+10,'spike',2.4+.2*T,'#fff6c0'))}</g>`+S(45,R(12,rr+12,'spike',1.6,c[0]),1)+R(4,rr+8,'star',2+.2*T,'#fff',45,'p'),
thunder:(c,rr,T,rd)=>Array.from({length:4+T},(_,j)=>{const a=j*360/(4+T)+rd()*20,n=5,p=Array.from({length:n+1},(_,q)=>pt(rr+2+q*(24+4*T)/n,a+(q?(rd()-.5)*24:0))).join(' ');return `<g class="fk" style="--d:${(1.4+rd()*1.6).toFixed(1)}s;animation-delay:-${(rd()*3).toFixed(2)}s"><polyline points="${p}" fill="none" stroke="${c[0]}" stroke-width="4" opacity=".5" stroke-linejoin="round"/><polyline points="${p}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>`}).join(''),
elec:(c,rr,T,rd)=>[0,1].map(j=>{const v=[0,1,2].map(()=>'M'+Array.from({length:48},(_,k)=>{const a=k*7.5,q=rr+8+j*7+(rd()-.5)*(7+T);return f1(100+q*cs(a))+' '+f1(100+q*sn(a))}).join('L')+'Z');return `<path d="${v[0]}" fill="none" stroke="${j?'#fff':c[0]}" stroke-width="${j?1:2}" stroke-linejoin="round"><animate attributeName="d" values="${v.join(';')};${v[0]}" dur="${(.5+j*.2).toFixed(1)}s" repeatCount="indefinite"/></path>`}).join('')+R(6,rr+13,'bolt',.9,'#fff',0,'tw'),
wind:(c,rr,T)=>[0,1,2].map(j=>S(9+j*6,`<path d="${sp(rr+6+j*7,150+j*30,0)}${sp(rr+6+j*7,150+j*30,180)}" fill="none" stroke="${j?c[2]:c[0]}" stroke-width="${(2.6-j*.6).toFixed(1)}" stroke-linecap="round" opacity=".8"/>`,j%2)).join('')
};

function build(s,i){
const [nm,ct,t,pn,m,a0,fk]=s.split('|'),at=a0=='horn'?(ct=='em'?'crown':'an kn sa da'.includes(ct)?'fin':'crest'):a0,T=+t,c=PAL[pn],rr=62+2*T,k=rr/68,v=(i*3)%5,L=2*PI*rr,A=`url(#a${i})`,B=`url(#b${i})`,rd=mk(i*97+13);
const att=id=>(SGL[id]?[1]:[1,-1]).map(sx=>{const tf=`translate(100 100) scale(${sx*k} ${k}) translate(-100 -100)`;return `<use href="#A-${id}" transform="translate(0 3) ${tf}" fill="#000" stroke="#000" opacity=".4"/><use href="#A-${id}" transform="${tf}" fill="${A}" stroke="${c[2]}" stroke-width="1.3"/><use href="#A-${id}" transform="${tf}" fill="url(#sh)" stroke="none"/>`}).join('');
let g='',post='';
if(ct=='st'){
 g=S(45,`<path fill-rule="evenodd" d="${gear(12+2*T,rr+2,rr+8,rr-3)}" fill="${A}" stroke="${c[2]}" stroke-width=".8"/>`+R(12,rr+5,'orb',.5,'#2a1306'))
 +[40,220].map((a,j)=>`<g transform="translate(${f1(100+(rr+14)*cs(a))} ${f1(100+(rr+14)*sn(a))})">${S(45*8/(12+2*T),`<path fill-rule="evenodd" d="${gear(8,7,11,3,0,0)}" fill="${c[1]}" stroke="${c[2]}" stroke-width=".8"/>`,1,0,0)}</g>`).join('')
 +(T>2?`<g transform="translate(100 ${100+rr+10})"><circle r="9" fill="#1b1209" stroke="${c[0]}" stroke-width="2"/><path d="M0 0V-6" stroke="#ff5a3c" stroke-width="1.8" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-55;55;-55" dur="3s" repeatCount="indefinite"/></path></g>`:'');
}else if(ct=='me'){
 const rv=rr+8;
 g=S(30,O(rv,4+T*.5,A,`stroke-dasharray="${f1(2*PI*rv/6-5)} 5"`))+S(20,O(rr+17,1.5,c[2],'stroke-dasharray="2 5"'),1)+S(4+T/2,O(rr-3,2.5,c[2],`stroke-dasharray="${f1(L/9)} ${f1(L)}" stroke-linecap="round"`))
 +(T>2?S(26,`<polygon points="${pg(6,rr+23)}" fill="none" stroke="${c[0]}" stroke-width="1.2"/>`,1)+R(6,rr+23,'orb',.6,c[2],0,'tw'):'');
}else if(ct=='ru'){
 const sn_=[5,5,7,7,8][T-1],ss=[2,2,3,3,3][T-1];
 g=S(60,`<polygon points="${pg(sn_,rr-7,-90,ss)}" fill="none" stroke="${c[1]}" stroke-width="1.3"/>`)+O(rr+4,1,c[2],'stroke-dasharray="1 4"')
 +S(80,R(10+T,rr+13,j=>'r'+((j+i)%8),.95,c[0],0,'tw'))+(T>3?S(40,R(14,rr+27,j=>'r'+((j*3+i)%8),.8,c[2],0,'tw'),1):'');
}else if(ct=='ju'){
 g=`<path d="${wv(rr+4,3.5,9)}" fill="none" stroke="${c[1]}" stroke-width="3.2"/><path d="${wv(rr+4,3.5,9,180)}" fill="none" stroke="${c[0]}" stroke-width="1.4" opacity=".8"/>`+R(12+2*T,rr+5,'leaf',.9,A,0,'b')
 +(T>1?Array.from({length:2+T},(_,j)=>{const a=j*360/(2+T)+20,x=100+(rr+5)*cs(a),y=100+(rr+5)*sn(a);return R(5,6,'petal',.75,c[2],0,'',x,y)+`<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="${c[1]}"/>`}).join(''):'');
}else if(ct=='cu'){
 g=R(12+T,rr+1,'orb',1.9,'#fff')+R(12+T,rr+1,'orb',1.1,c[0])+R(6+T,rr+14,m,.95,c[1],0,'b')+R(6,rr+24,'star',.5,'#fff',15,'tw')
 +(T>2?`<g transform="translate(${f1(100+rr*cs(50))} ${f1(100+rr*sn(50))})"><use href="#m-petal" transform="translate(-6 0) rotate(-90) scale(1.1)" fill="${c[1]}"/><use href="#m-petal" transform="translate(6 0) rotate(90) scale(1.1)" fill="${c[1]}"/><circle r="3" fill="${c[2]}"/></g>`:'');
}else if(ct=='an'){
 g=R(28+4*T,rr+2,'spike',.55,c[1])+R(4,rr+12,'paw',.75,c[2],45)+(T>3?S(18,O(rr+20,2,A,`stroke-dasharray="${f1(L/3)} ${f1(L/6)}" stroke-linecap="round"`),1):'');
}else if(ct=='da'){
 const ey=100-rr-12,e=`<path d="M78 ${ey}Q90 ${ey-9} 98 ${ey+2}Q88 ${ey+5} 78 ${ey}Z" fill="${c[2]}"`;
 g=`<g filter="url(#fl)">`+O(rr+3,7,c[1],'opacity=".7"')+O(rr+9,4,c[0],'opacity=".5"')+R(10+2*T,rr+8,'flame',1.4+.2*T,c[1],0,'p')+`</g>`
 +(T>2?`<g class="p" style="--d:2.4s">${e}/>${e} transform="matrix(-1 0 0 1 200 0)"/></g>`:'');
}else if(ct=='kn'){
 g=O(rr+4,6+T*.6,A,`stroke-dasharray="${f1(2*PI*(rr+4)/8-3)} 3"`)+O(rr-4,2,c[2])+R(8,rr+4,'orb',.7,'#1d1a2b',22.5)
 +`<path d="M-9-9H9V2Q9 10 0 15Q-9 10-9 2Z" transform="translate(100 ${100+rr+10})" fill="${A}" stroke="${c[2]}" stroke-width="1.4"/><use href="#m-cross" transform="translate(100 ${100+rr+8}) scale(.6)" fill="#fff"/>`;
}else if(ct=='em'){
 g=`<g opacity=".55">${S(70,R(16,rr+12,'spike',1.5+.2*T,c[1]))}</g>`+(T>3?`<g opacity=".4">${S(55,R(12,rr+16,'spike',2.2,c[0]),1)}</g>`:'')+O(rr+7,2,c[0])+R(24,rr+3.5,'petal',.55,c[2]);
 post=R(8,rr,'dia',1.3,c[2],22.5,'tw');
}else if(ct=='lo'){
 g=R(18+T,rr+3,'spike',1,c[1])+S(30,`<polygon points="${pg(3,rr+9,-90)}" fill="none" stroke="${c[0]}" stroke-width="1.3"/><polygon points="${pg(3,rr+9,90)}" fill="none" stroke="${c[0]}" stroke-width="1.3"/>`);
 post=S(14,R(T>3?6:3,rr+17,'blade',1.5,c[0]))+(T>3?S(26,R(4,rr+27,'moon',1,c[2],0,'b'),1):'');
}else if(ct=='el'){
 g=S(35,`<path d="${wv(rr+6,4,12)}" fill="none" stroke="${c[1]}" stroke-width="2.5"/>`,1)
 +`<circle cx="100" cy="100" r="${rr+15}" fill="none" stroke="${c[2]}" stroke-width="1.8" stroke-dasharray="3 7 14 5"><animate attributeName="stroke-dashoffset" from="0" to="-58" dur="2s" repeatCount="indefinite"/></circle>`;
}else if(ct=='ce'){
 const r2=mk(i*31+5),n=6+T,pp=Array.from({length:n},(_,j)=>{const a=j*360/n+r2()*30,d=rr+10+r2()*18;return[100+d*cs(a),100+d*sn(a)]});
 g=`<g filter="url(#bl)" opacity=".6">${O(rr+8,12,c[1])}</g><polyline points="${pp.concat([pp[0]]).map(q=>f1(q[0])+','+f1(q[1])).join(' ')}" fill="none" stroke="${c[2]}" stroke-width=".9" opacity=".7"/>`
 +pp.map(q=>`<g class="tw" style="--d:${(2+r2()*2)|0}s;animation-delay:-${(r2()*3).toFixed(1)}s"><use href="#m-star" transform="translate(${f1(q[0])} ${f1(q[1])}) scale(.7)" fill="${c[2]}"/></g>`).join('');
 post=S(20,R(T>3?2:1,rr+14,'moon',1.4,c[0]))+S(5,O(rr+4,3,c[2],`stroke-dasharray="${f1(L/10)} ${f1(L)}" stroke-linecap="round" opacity=".9"`));
}else if(ct=='cw'){
 const clk=v%2==0,n1=10+2*T;
 g=TK(60,rr+9,3,c[2],.9)+R(12,rr+8,'dia',.5,c[0])+S(48,`<path fill-rule="evenodd" d="${gear(n1,rr+1,rr+7,rr-4)}" fill="${A}" stroke="${c[2]}" stroke-width=".7"/>`)
 +(clk?S(44,`<path d="M100 ${100-rr-6}V${100-rr-20}" stroke="${c[2]}" stroke-width="2.2" stroke-linecap="round"/>`)+S(9,`<path d="M100 ${100-rr-6}V${100-rr-27}" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`)+(T>3?S(3,`<path d="M100 ${100-rr-6}V${100-rr-30}" stroke="#ff6a5a" stroke-width=".8"/>`):''):[90,210,330].slice(0,T>2?3:T>1?2:1).map(a=>`<g transform="translate(${f1(100+(rr+10)*cs(a))} ${f1(100+(rr+10)*sn(a))})">${S(48*8/n1,`<path fill-rule="evenodd" d="${gear(8,4.5,7.5,2,0,0)}" fill="${c[1]}" stroke="${c[2]}" stroke-width=".6"/>`,1,0,0)}</g>`).join(''));
}else if(ct=='as'){
 const el=a=>`<ellipse cx="100" cy="100" rx="${rr+11}" ry="${(rr+11)*.34}" fill="none" stroke="${c[0]}" stroke-width=".8" opacity=".85" transform="rotate(${a} 100 100)"/>`;
 g=S(90,el(0)+(T>1?el(60):'')+(T>2?el(120):''))+R(12,rr+6,k=>'r'+(k%8),.55,c[2],0,'tw')+O(rr+17,.6,c[2],'stroke-dasharray="1 4" opacity=".7"')+S(14,R(1,rr+10,'orb',.8,c[2]))+(T>1?S(22,R(1,rr+17,'orb',1.2,c[0],120),1):'')+(T>3?S(40,R(1,rr+24,'orb',.9,'#fff',240)):'');
}else if(ct=='sg'){
 g=R(8+2*T,rr+6,'flame',.8+.06*T,'#7fd0ff',0,'p')+R(8+2*T,rr+6,'flame',.45+.04*T,'#fff',9,'p')+R(16+T,rr+3,'fang',.45,c[0])+(T>3?S(40,O(rr+16,.8,c[2],'stroke-dasharray="3 7"'),1):'');
}else if(ct=='to'){
 g=O(rr+4,5+T*.6,A)+TK(28,rr+4,5+T*.6,'#2a0000',.85)+S(18-T,R(3,rr+4,'tm',1.05+.05*T,'#150000'))+(T>3?S(30,R(3,rr+14,'blade',1.1,'#150000',60),1)+O(rr+11,.8,c[2],'opacity=".8"'):'')+(T>4?S(9,R(6,rr+22,'tm',.8,c[0])):'');
}else if(ct=='sa'){
 g=S(40,`<path d="${wv(rr+4,3.5,10)}" fill="none" stroke="${c[1]}" stroke-width="3"/>`,1)+R(14+T,rr+5,'leaf',.8,c[2],0,'b')+S(60,O(rr+13,1.4,c[0],'stroke-dasharray="2 6"'));
 post=R(8,rr,'orb',1.4,'#fff',22.5)+R(8,rr,'orb',.55,c[0],22.5);
}else if(ct=='ho'){
 g=O(rr+9,1.5,c[2],'stroke-dasharray="1 4"')+S(60,R(16,rr+5,'petal',1.3,'#fff'))+R(4,rr+17,'cross',.9,c[0],45,'p')+S(40,O(rr+14,1.2,c[0],'stroke-dasharray="10 6"'),1);
}else{
 g=R(16,rr+3,'petal',1.1,c[2],0,'p')+S(22,R(5,rr+17,'orb',1.5,c[0]),1)+S(22,R(5,rr+17,'orb',.7,'#fff'),1)
 +(T>2?`<use href="#m-moon" transform="translate(${f1(100+(rr+22)*cs(-45))} ${f1(100+(rr+22)*sn(-45))}) scale(1.8)" fill="${c[0]}"/>`:'');
}
const mo=S(44-5*T,R(6+2*T+v,rr+8+v*1.5,m,.7+T*.07,c[0]),v%2)+(T>2?S(30,R(8+T,rr,['dia','orb','star'][v%3],.85,c[2])+R(8+T,rr,['dia','orb','star'][v%3],.35,'#fff'),1):'')+(T>3?R(10,rr+25,'star',.55,c[2],0,'tw'):'');
const rays=T>3&&ct!='em'?`<g opacity=".35">${S(80,R(20,rr+20,'spike',1.2+.25*T,c[0]),1)}</g>`:'';
const eb=EM[(i*3)%14],emb=T>1&&ct!='st'&&ct!='kn'?`<g transform="translate(100 ${f1(100+rr)})"><circle r="${5+T}" fill="#150f2a" stroke="${A}" stroke-width="2"/><use href="#m-${eb}" transform="scale(${(.4+T*.07).toFixed(2)})" ${C(eb,c[2])}/></g>`:'';
const shine=T>2?S(6-T*.6,O(rr,3.2,'#fff',`stroke-dasharray="26 ${f1(L-26)}" stroke-linecap="round" opacity=".85"`)):'';
let fx='',el='';const ks=fk.split('+'),X=FXT[ks.find(q=>FXT[q])];ks.forEach(q=>{if(EL[q])el+=EL[q](c,rr,T,rd)});
if(X)for(let q=0;q<4+2*T;q++){const a=rd()*360,d=rr-4+rd()*(24+4*T);fx+=`<g class="${X[2]?'rise':'tw'}" style="--d:${(2.2+rd()*2.5).toFixed(1)}s;--y:${Math.round(X[2]*(30+rd()*30))}px;--x:${Math.round(rd()*20-10)}px;animation-delay:-${(rd()*4).toFixed(1)}s"><use href="#m-${X[0]}" transform="translate(${f1(100+d*cs(a))} ${f1(100+d*sn(a))}) scale(${(.5+rd()*.5).toFixed(2)})" ${C(X[0],X[1])}/></g>`}
return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${nm}"><defs><linearGradient id="a${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><radialGradient id="b${i}"><stop offset=".55" stop-color="${c[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient></defs>`
+`<circle cx="100" cy="100" r="${(rr+10+2*T)*.84}" fill="${B}" class="p" style="--d:3.6s"/>`+Y(0,rays)+Y(-.6,BK[at]?AW(att(at)):'')+Y(.3,g)+`<use href="#av"/>`+O(50,7,'#000','opacity=".4"')+Y(.6,MD[at]?AW(att(at)):'')+Y(.7,RG(ct=='st'?0:v,rr,2+T*.4,A)+O(rr-4,1,c[2],'opacity=".7"')+post+shine+emb)+O(52.5,2,c[1])+Y(1.1,mo)+Y(1.5,at!='-'&&!BK[at]&&!MD[at]?AW(att(at)):'')+Y(1.9,AW(fx+el))+`</svg>`;
}

const raw=`Brass Cogwheel|st|1|brass|dia|-|steam
Copper Boiler Ring|st|2|copper|orb|pipe|steam
Clockwork Aviator|st|3|gold|star|wing2|spark
Airship Captain’s Wheel|st|3|brass|leaf|-|steam
Aether Engine Core|st|4|cyan|bolt|pipe|steam+elec
Grand Horologist’s Eternity|st|5|gold|star|crown|steam+light
Circuit Halo|me|1|cyan|dia|-|spark
Mecha Pilot Ring|me|2|silver|blade|-|bolt
Neon Servo Ring|me|3|lime|bolt|-|elec
Plasma Reactor|me|3|ember|dia|pipe|ember
Quantum Seraph Unit|me|4|ice|star|wing|star
Omega Titan Core|me|5|cyan|blade|wing2|elec+thunder
Elder Glyph Circle|ru|1|jade|dia|-|rune
Frostbound Runes|ru|2|ice|dia|-|snow
Arcane Sigil Wheel|ru|3|violet|star|-|rune
Ember Rune Seal|ru|3|ember|flame|-|fire
Sage’s Astral Seal|ru|4|gold|moon|halo|rune+light
World Tree Runestone|ru|5|jade|leaf|antler|wind+fly
Vine Wreath|ju|1|jade|leaf|-|leaf
Firefly Thicket|ju|2|lime|orb|-|fly
Orchid Canopy|ju|3|rose|petal|-|sakura
Overgrown Ruins|ju|3|mint|leaf|-|leaf
Spirit Stag Grove|ju|4|jade|leaf|antler|fly
Yggdrasil’s Crown|ju|5|lime|leaf|crown|fly
Sakura Puff|cu|1|rose|heart|-|heart
Kitty Bell Collar|cu|2|rose|paw|ear|heart
Bunny Cloud|cu|2|mint|star|bun|star
Star Candy Dream|cu|3|violet|star|-|star
Angel Cupcake|cu|4|rose|heart|halo|heart
Magical Girl Grand Bloom|cu|5|rose|heart|wing|star
Paw Print Border|an|1|copper|paw|-|-
Fox Spirit|an|2|ember|flame|fox|ember
Moon Wolf|an|3|silver|fang|wolf|snow
Azure Dragon|an|3|cyan|fang|horn|thunder
Phoenix Rebirth|an|4|ember|flame|wing|fire
Celestial Qilin|an|5|gold|flame|antler|light+spark
Shadow Wisp|da|1|void|flame|-|soul
Crimson Eyes|da|2|blood|fang|-|ember
Abyssal Maw|da|3|void|fang|horn|soul
Cursed Flame|da|3|violet|flame|-|soul
Reaper’s Sovereign|da|4|blood|spike|wing2|ember
Void Calamity|da|5|void|spike|horn|soul
Squire’s Plate|kn|1|silver|blade|-|-
Iron Vanguard|kn|2|silver|cross|-|spark
Holy Paladin|kn|3|gold|cross|wing|feather
Dragoon Knight|kn|3|ruby|spike|horn|ember
Crusader Order|kn|4|gold|blade|sword|spark
Dawnbringer Grand Marshal|kn|5|sun|cross|wing|light+feather
Jade Seal|em|1|jade|dia|-|-
Dynasty Gold|em|2|gold|petal|gem|-
Imperial Phoenix|em|3|ruby|flame|crown|ember
Sun Emperor|em|4|sun|spike|halo|light+spark
Dragon Throne|em|5|gold|fang|horn|spark
Celestial Autocrat|em|5|sun|star|crown|star
Warlord’s Sigil|lo|2|ruby|blade|-|-
Demon Lord’s Crown|lo|3|blood|spike|horn|ember
Overlord Orbitals|lo|3|void|blade|-|soul
Vampire Lord|lo|4|blood|moon|wing2|soul
Sword Saint Lord|lo|4|silver|blade|-|spark
Lord of Calamity|lo|5|void|blade|horn|thunder
Ember Spark|el|1|ember|flame|-|fire
Tide Spiral|el|2|cyan|orb|-|water
Breeze Ribbon|el|2|mint|leaf|-|wind+leaf
Static Halo|el|2|violet|bolt|-|elec
Boulder Bastion|el|3|copper|dia|-|earth
Thunder Crown|el|3|sun|bolt|-|thunder
Glacier Bloom|el|3|ice|dia|-|snow
Geyser Fountain|el|3|cyan|orb|-|steam+bubble
Radiant Dawn|el|3|sun|star|halo|light
Cyclone Dragon|el|4|mint|leaf|-|wind+leaf
Tsunami Leviathan|el|4|cyan|fang|-|water
Magma Titan|el|4|ember|dia|horn|fire+earth
Stormcaller Archon|el|5|violet|bolt|horn|thunder+elec
Primordial Convergence|el|5|sun|star|wing|fire+thunder+wind
Crescent Moon|ce|1|silver|moon|-|star
Constellation Ring|ce|2|night|star|-|star
Starlight Veil|ce|3|violet|star|-|star
Eclipse Oracle|ce|4|sun|moon|halo|spark
Galaxy Guardian|ce|4|night|star|wing|star
Cosmic Genesis|ce|5|violet|star|wing|star
Sakura Drift|yo|1|rose|petal|-|sakura
Paper Lantern Night|yo|2|ember|orb|-|fly
Kitsune Mask|yo|3|ruby|flame|fox|ember
Oni Festival|yo|3|blood|spike|horn|ember
Tengu Wind Shrine|yo|4|silver|leaf|wing|wind+feather
Nine-Tailed Kitsune God|yo|5|ember|flame|fox|fire
Pearl Tide|sa|1|mint|orb|-|bubble
Coral Reef Crown|sa|2|rose|leaf|-|water
Siren’s Lagoon|sa|3|cyan|petal|-|water
Kraken’s Grasp|sa|3|void|fang|-|water+soul
Abyssal Leviathan|sa|4|night|fang|horn|water+elec
Poseidon’s Trident Realm|sa|5|cyan|fang|crown|water+thunder
Feather Halo|ho|1|silver|petal|halo|feather
Cathedral Glass|ho|2|sun|cross|-|light
Seraph’s Mercy|ho|3|silver|petal|wing|feather+light
Valkyrie’s Oath|ho|3|gold|blade|wing|light
Archangel Judgement|ho|4|sun|cross|wing|light+spark
Heaven’s Gate Sovereign|ho|5|sun|star|wing|light+feather
Tokei|cw|1|brass|dia|-|-
Zenmai|cw|2|gold|star|-|spark
Haguruma|cw|3|copper|orb|pipe|steam
Karakuri|cw|3|silver|blade|-|spark
Shikake|cw|4|brass|dia|wing2|steam
Jikuu|cw|5|sun|star|crown|light
Hoshiban|as|1|night|star|-|star
Tenmon|as|2|gold|star|-|spark
Wakusei|as|3|cyan|orb|-|star
Zodiac|as|3|violet|star|-|star
Shingetsu|as|4|silver|moon|halo|star
Tenkyu|as|5|gold|star|crown|light
Higanbana|sg|1|ruby|fang|-|soul
Reikon|sg|2|ice|flame|-|soul
Kama|sg|3|void|spike|scythe|soul
Yomi|sg|4|night|fang|scythe|soul
Shinigami|sg|5|void|flame|scythe|soul
Tomoe|to|2|ruby|dia|-|-
Mitsu|to|3|blood|dia|-|ember
Kagami|to|3|violet|dia|-|-
Rinne|to|4|ruby|dia|-|spark
Mangetsu|to|4|blood|dia|-|ember
Shinen|to|5|ember|dia|-|fire`.split('\n');
const CATS={st:'Steampunk',me:'Mechanical',ru:'Runes',ju:'Jungle',cu:'Cute',an:'Animals',da:'Dark Aura',kn:'Knights',em:'Emperors',lo:'Lords',el:'Elemental',ce:'Celestial',yo:'Yokai & Sakura',sa:'Sea & Abyss',ho:'Holy & Angelic',cw:'Clockwork',as:'Astronomical',sg:'Shinigami',to:'Tomoe Eyes'};
const RT=['Common','Rare','Epic','Legendary','Mythic'],RC=['#6b7589','#2f6fe0','#9333ea','#d97706','#dc2626'],BASE=[500,1200,2500,4200,7000];
const AL=Object.fromEntries('Brass Cogwheel>Kogane|Copper Boiler Ring>Akagane|Clockwork Aviator>Sorafune|Airship Captain’s Wheel>Kaji|Aether Engine Core>Kikan|Grand Horologist’s Eternity>Tokiwa|Circuit Halo>Denko|Mecha Pilot Ring>Kishin|Neon Servo Ring>Nexa|Plasma Reactor>Plasmo|Quantum Seraph Unit>Seraphis|Omega Titan Core>Omega|Elder Glyph Circle>Futhark|Frostbound Runes>Kori|Arcane Sigil Wheel>Arcana|Ember Rune Seal>Ember|Sage’s Astral Seal>Sennin|World Tree Runestone>Yggra|Vine Wreath>Tsuta|Firefly Thicket>Hotaru|Orchid Canopy>Ran|Overgrown Ruins>Haikyo|Spirit Stag Grove>Shika|Yggdrasil’s Crown>Shinju|Sakura Puff>Mochi|Kitty Bell Collar>Suzu|Bunny Cloud>Usagi|Star Candy Dream>Candy|Angel Cupcake>Tenshi|Magical Girl Grand Bloom>Mahou|Paw Print Border>Nikukyu|Fox Spirit>Kon|Moon Wolf>Okami|Azure Dragon>Seiryu|Phoenix Rebirth>Houou|Celestial Qilin>Kirin|Shadow Wisp>Kage|Crimson Eyes>Akame|Abyssal Maw>Yami|Cursed Flame>Noroi|Reaper’s Sovereign>Shiou|Void Calamity>Kyomu|Squire’s Plate>Kote|Iron Vanguard>Tetsu|Holy Paladin>Seiki|Dragoon Knight>Ryuki|Crusader Order>Gunki|Dawnbringer Grand Marshal>Reimei|Jade Seal>Hisui|Dynasty Gold>Ouka|Imperial Phoenix>Housen|Sun Emperor>Taiyo|Dragon Throne>Ryuza|Celestial Autocrat>Tenno|Warlord’s Sigil>Bushou|Demon Lord’s Crown>Maou|Overlord Orbitals>Haou|Vampire Lord>Kyuketsu|Sword Saint Lord>Kensei|Lord of Calamity>Wazawai|Ember Spark>Hibana|Tide Spiral>Uzu|Breeze Ribbon>Sofu|Static Halo>Piri|Boulder Bastion>Gan|Thunder Crown>Raimei|Glacier Bloom>Hyoka|Geyser Fountain>Funsui|Radiant Dawn>Hikari|Cyclone Dragon>Tatsumaki|Tsunami Leviathan>Tsunami|Magma Titan>Yougan|Stormcaller Archon>Arashi|Primordial Convergence>Genesis|Crescent Moon>Mikazuki|Constellation Ring>Seiza|Starlight Veil>Hoshizora|Eclipse Oracle>Nisshoku|Galaxy Guardian>Ginga|Cosmic Genesis>Uchu|Sakura Drift>Sakura|Paper Lantern Night>Chochin|Kitsune Mask>Kitsune|Oni Festival>Matsuri|Tengu Wind Shrine>Tengu|Nine-Tailed Kitsune God>Kyuubi|Pearl Tide>Tama|Coral Reef Crown>Sango|Siren’s Lagoon>Ningyo|Kraken’s Grasp>Kraken|Abyssal Leviathan>Shinkai|Poseidon’s Trident Realm>Kaiou|Feather Halo>Hane|Cathedral Glass>Kirari|Seraph’s Mercy>Jihi|Valkyrie’s Oath>Chikai|Archangel Judgement>Shinpan|Heaven’s Gate Sovereign>Tengoku'.split('|').map(q=>q.split('>')));
const F=raw.map((s,i)=>{const x=s.split('|'),b=BASE[x[2]-1];return{i,s,nm:AL[x[0]]||x[0],ct:x[1],t:+x[2],p:Math.round((b+(i%4)*b/10)/50)*50}});
const Y0=(z,x)=>`<g class="ly" style="--z:${z}">${x}</g>`;
const G2=(r,w,A)=>O(r+.6,w+1,'#000','opacity=".4"')+O(r,w,A)+O(r-w/2+.4,.6,'#fff','opacity=".7"');
const TK=(n,r,l,col,op=.8)=>O(r,l,col,`stroke-dasharray=".7 ${f1(2*PI*r/n-.7)}" opacity="${op}"`);
const AR=(r,a,sw,w,col,x='')=>O(r,w,col,`stroke-dasharray="${f1(2*PI*r*sw/360)} ${f1(2*PI*r)}" transform="rotate(${a} 100 100)" stroke-linecap="round" ${x}`);
const sc=(x,s=.62)=>`<g transform="translate(100 100) scale(${s}) translate(-100 -100)">${x}</g>`;
const E=(k,c,i,s)=>sc(EL[k](c,86,0,mk(i*13+7)),s);
const pa=(k,i,n=6,r0=56,r1=76)=>{const X=FXT[k],rd=mk(i*97+13);return Array.from({length:n},()=>{const a=rd()*360,d=r0+rd()*(r1-r0);return `<g class="${X[2]?'rise':'tw'}" style="--d:${(2.2+rd()*2.5).toFixed(1)}s;--y:${Math.round(X[2]*(24+rd()*24))}px;--x:${Math.round(rd()*14-7)}px;animation-delay:-${(rd()*4).toFixed(1)}s"><use href="#m-${X[0]}" transform="translate(${f1(100+d*cs(a))} ${f1(100+d*sn(a))}) scale(${(.4+rd()*.4).toFixed(2)})" ${C(X[0],X[1])}/></g>`}).join('')};
const pips=(n,col)=>Array.from({length:n},(_,k)=>`<circle cx="${f1(100+(k-(n-1)/2)*5)}" cy="168" r="1.4" fill="${col}"/>`).join('');
const fd=(a,b,x)=>`<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${b};.9;.97;1" dur="20s" repeatCount="indefinite"/>${x}</g>`;
const GL=a=>{const g=(x,t)=>`<g><animateTransform attributeName="transform" type="translate" values="${x}" calcMode="discrete" dur="${t}s" repeatCount="indefinite"/><use href="#av"/></g>`;return `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${(a+.1).toFixed(2)};.9;.93;1" dur="20s" repeatCount="indefinite"/><g filter="url(#gr)" style="mix-blend-mode:screen">${g('0 0;-4 1;3 -1;-2 0;5 2;0 0',.7)}</g><g filter="url(#gc)" style="mix-blend-mode:screen">${g('0 0;4 -1;-3 1;2 0;-5 -2;0 0',.55)}</g><g clip-path="url(#sl)">${g('0 0;12 0;-9 0;0 0;7 0;-14 0',.9)}</g></g>`};
const ET=(c,A,i)=>fd(.06,.16,E('fire',['#fff','#9b6bff','#ffd36e'],i))+fd(.14,.24,E('water',['#6df3ff','#1f8fd6','#d6fbff'],i))+fd(.22,.32,E('wind',['#bfffe0','#4cb7a0','#fff'],i))+fd(.3,.4,E('earth',['#ffa56a','#a8431f','#ffd9bf'],i))+fd(.38,.48,E('light',['#fff07a','#ff9a1f','#fff'],i))+fd(.46,.56,E('elec',['#b57bff','#fff','#fff'],i))+fd(.54,.64,E('thunder',['#8fd6ff','#fff','#fff'],i))+GL(.62)
+fd(.6,.7,`<g filter="url(#fl)">${O(63,2,'#fff','opacity=".8"')}</g><g><animateTransform attributeName="transform" type="rotate" values="0 100 100;40 100 100;-25 100 100;90 100 100;-60 100 100" calcMode="discrete" dur=".5s" repeatCount="indefinite"/>${AR(65,0,50,1.4,'#fff')}${AR(67,120,40,1.4,'#ff7a3c')}${AR(63,240,60,1.2,'#4cc9ff')}</g>`)
+`<circle cx="100" cy="100" r="57" fill="none" stroke-width="2.2" stroke="#fff"><animate attributeName="stroke" values="#fff;#ffd36e;#ff7a3c;#4cc9ff;#a7ff6a;#b57bff;#fff" dur="20s" repeatCount="indefinite"/><animate attributeName="stroke-dasharray" values="400 0;400 0;300 40;150 60;40 30;400 0" keyTimes="0;.5;.65;.8;.92;1" dur="20s" repeatCount="indefinite"/></circle>`+O(60.5,.7,'#fff','opacity=".6"');
const P=(r,a)=>f1(100+r*cs(a))+' '+f1(100+r*sn(a)),R0=67.5,MD={ear:1,bun:1,fox:1,wolf:1,fin:1,antler:1,horn:1};
SGL.crest=1;
const ab=(a1,a2)=>`A${R0} ${R0} 0 0 0 ${P(R0,a1)}Z`;
const ea=(a1,a2,ta,tr,w)=>`M${P(R0,a1)}Q${P((R0+tr)/2+w,a1-4)} ${P(tr,ta)}Q${P((R0+tr)/2+w,a2+4)} ${P(R0,a2)}${ab(a1,a2)}`;
const sh0='fill="#0005" stroke="none"';
const setA=(id,h)=>{let e=document.getElementById('A-'+id);if(!e){e=document.createElementNS('http://www.w3.org/2000/svg','g');e.id='A-'+id;document.getElementById('df').appendChild(e)}e.innerHTML=h};
setA('ear',`<path d="${ea(-68,-34,-51,90,2)}"/><path d="${ea(-61,-41,-51,82,1)}" ${sh0}/>`);
setA('fox',`<path d="${ea(-70,-42,-60,104,-1)}"/><path d="${ea(-64,-48,-58,92,0)}" ${sh0}/><path d="M${P(95,-62)}L${P(105,-60)}L${P(95,-55)}Z" fill="#000a" stroke="none"/>`);
setA('wolf',`<path d="${ea(-76,-34,-52,96,6)}"/><path d="${ea(-68,-42,-52,86,3)}" ${sh0}/>`);
setA('bun',`<path d="M${P(R0,-62)}C${P(95,-68)} ${P(124,-62)} ${P(124,-52)}C${P(124,-42)} ${P(98,-44)} ${P(R0,-40)}${ab(-62,-40)}"/><path d="M${P(R0,-57)}C${P(94,-62)} ${P(114,-57)} ${P(114,-51)}C${P(114,-45)} ${P(96,-45)} ${P(R0,-44)}${ab(-57,-44)}" ${sh0}/>`);
setA('fin',`<path d="M${P(R0,-66)}C${P(84,-72)} ${P(104,-62)} ${P(112,-42)}C${P(102,-47)} ${P(95,-42)} ${P(98,-31)}C${P(88,-34)} ${P(80,-30)} ${P(R0,-26)}${ab(-66,-26)}"/><path d="M${P(R0,-58)}L${P(104,-48)}M${P(R0,-44)}L${P(94,-34)}" fill="none" stroke="#0006" stroke-width="1.2"/>`);
setA('crest',`<path d="${(()=>{const ts=[-104,-97,-90,-83,-76],tr=[82,90,100,90,82];let d='M'+P(R0,-110);ts.forEach((a,j)=>{d+='L'+P(tr[j],a);if(j<4)d+='L'+P(72,a+3.5)});return d+'L'+P(R0,-70)+`A${R0} ${R0} 0 0 0 ${P(R0,-110)}Z`})()}"/>`);
setA('antler',`<path d="M${P(68,-60)}Q${P(86,-70)} ${P(104,-58)}M${P(86,-67)}L${P(100,-80)}M${P(96,-61)}L${P(112,-66)}M${P(75,-64)}L${P(86,-80)}" fill="none" stroke-width="3" stroke-linecap="round"/>`);
document.getElementById('df').insertAdjacentHTML('beforeend','<radialGradient id="cm"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>');
document.getElementById('df').insertAdjacentHTML('beforeend','<path id="m-tm" d="M-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0ZM2.4 1.6Q5.4 6-3 8Q1.2 5-.4 2.6Z"/>');
setA('scythe','<path d="M44 168L164 28" fill="none" stroke-width="3" stroke-linecap="round"/><path d="M162 28C190 22 206 46 198 72C192 52 178 42 158 40Z"/>');
BK.scythe=1;SGL.scythe=1;
const FS=(c,i)=>{const tri=s=>`<polygon points="${pg(3,71,s)}" fill="none" stroke="${c[2]}" stroke-width=".7" opacity=".8"/>`,spk=`<path d="${Array.from({length:6},(_,k)=>'M'+pt(58,-90+k*60)+'L'+pt(71,-90+k*60)).join('')}" fill="none" stroke="${c[0]}" stroke-width=".6" opacity=".7"/>`;return `<g class="p" style="--d:3.4s">${O(62,6,c[1],'opacity=".35"')}</g>`+S(70,tri(-90)+tri(90)+spk+R(6,71,'orb',.5,'#fff',-90))+S(50,O(64,1,c[0],'stroke-dasharray="9 3 2 3" opacity=".7"'),1)+[0,1].map(j=>`<circle r="1.8" fill="${j?c[2]:'#fff'}"><animateMotion dur="${4+j*2}s" repeatCount="indefinite" path="M100 37A63 63 0 1 ${j?0:1} 99.9 37"/></circle>`).join('')+R(1,64,'blade',.8,c[0],-90)+R(1,64,'blade',.55,c[0],-112)+R(1,64,'blade',.55,c[0],-68)+R(1,60,'dia',.9,'#fff',-90,'p')};
const rg=col=>O(57.6,3.2,'#000','opacity=".4"')+O(57,2.4,col)+O(56.3,.7,'#fff','opacity=".6"')+O(59.5,5,col,'opacity=".18"');
const ph=(p,x)=>{const N=8,s=p/N,e=(p+1)/N,f=.02,t=a=>a.toFixed(3);const[v,k]=p==0?['1;1;0;0;1',`0;${t(e-f)};${t(e)};${t(1-f)};1`]:p==N-1?['0;0;1;1;0',`0;${t(s-f)};${t(s)};${t(1-f)};1`]:['0;0;1;1;0;0',`0;${t(s-f)};${t(s)};${t(e-f)};${t(e)};1`];return `<g opacity="0"><animate attributeName="opacity" values="${v}" keyTimes="${k}" dur="32s" repeatCount="indefinite"/>${x}</g>`};
const DR=`<g transform="translate(161 100)"><path d="M0-10C5-10 7-5 5-1L3 5H-3L-5-1C-7-5-5-10 0-10Z" fill="#35d6a8" stroke="#ffe9a0" stroke-width=".8"/><path d="M4-7Q11-9 14-3M-4-7Q-11-9-14-3" fill="none" stroke="#ffd36e" stroke-width=".9"/><path d="M-2 4Q-7 9-4 15M2 4Q7 9 4 15" fill="none" stroke="#ffd36e" stroke-width="1.2" stroke-linecap="round"/><circle cx="2.2" cy="-4" r="1" fill="#fff"/><circle cx="-2.2" cy="-4" r="1" fill="#fff"/></g>`;
const ETL=(c,A,i)=>ph(0,rg('#ff8a3c')+R(18,59,'flame',.95,'#ff6a1f',0,'p')+R(18,59,'flame',.55,'#ffd36e',10,'p')+pa('ember',i,6))
+ph(1,rg('#4cc9ff')+S(30,`<path d="${wv(61,2.6,8)}" fill="none" stroke="#9fe8ff" stroke-width="1.1"/>`)+S(22,`<path d="${wv(64,2,11,90)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".6"/>`,1)+S(26,R(6,67,'orb',.5,'#bfefff',0,'b'),1)+pa('bubble',i,5))
+ph(2,S(40,AR(61,0,210,4.2,'#2fbf9a')+AR(61,210,60,3,'#2fbf9a')+AR(61,270,40,1.8,'#2fbf9a')+AR(59.6,6,200,.9,'#ffe9a0','opacity=".8"')+DR)+O(57,1,'#6b4d12','opacity=".6"')+R(1,70,'orb',.6,'#bff5ff',-30,'p'))
+ph(3,rg('#bfffe0')+E('wind',['#bfffe0','#4cb7a0','#fff'],i,.62)+pa('leaf',i,4))
+ph(4,rg('#6ee08a')+`<path d="${wv(61,2.4,9)}" fill="none" stroke="#3fbf6a" stroke-width="1.2"/>`+R(10,64,'leaf',.5,'#8dff9f',0,'b')+S(16,R(3,67,'orb',.9,'#d9ffb0')+R(3,67,'orb',.4,'#fff'))+R(4,62,'petal',.5,'#ffd0e8',20)+pa('fly',i,6))
+ph(5,rg('#dfe6ff')+R(9,61,'orb',2.4,'url(#cm)',0,'b')+S(80,R(7,67,'orb',1.8,'url(#cm)'),1))
+ph(6,rg('#d9a066')+E('earth',['#ffa56a','#a8431f','#ffd9bf'],i,.62)+S(40,R(6,66,'dia',1.3,'#8fe8ff',0,'tw'),1))
+ph(7,TS(c,A,i));
const TS=(c,A,i)=>{const r=mk(i*29+3),an=(v,du,st,w,o)=>`<path d="${v[0]}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"><animate attributeName="d" values="${v.join(';')};${v[0]}" dur="${du}s" repeatCount="indefinite"/></path>`,fl=x=>`<g><animate attributeName="opacity" values="1;.3;1;.65;1" keyTimes="0;.25;.5;.75;1" calcMode="discrete" dur="${(.3+r()*.3).toFixed(2)}s" repeatCount="indefinite"/>${x}</g>`;let h='';
for(let k=0;k<8;k++){const a0=k*45+22.5,v=[0,1,2].map(()=>'M'+Array.from({length:10},(_,q)=>{const t=q/9,a=a0+45*t,d=58+Math.sin(t*PI)*8+(q&&q<9?(r()-.5)*7:0);return f1(100+d*cs(a))+' '+f1(100+d*sn(a))}).join('L')),du=(.3+r()*.25).toFixed(2);h+=fl(an(v,du,c[2],3.2,.35)+an(v,du,'#fff',1,.95))}
for(let k=0;k<4;k++){const a=k*90+22.5,len=18+r()*10,v=[0,1,2].map(()=>{const p=Array.from({length:6},(_,q)=>pt(58+len*q/5,a-q*7+(q?(r()-.5)*11:0)));return 'M'+p.join('L')+'M'+p[3]+'L'+pt(58+len*.85,a-30+(r()-.5)*30)}),du=(.25+r()*.2).toFixed(2);h+=`<g opacity="0"><animate attributeName="opacity" values="0;1;0;.8;1;0;0" calcMode="discrete" dur="${(.8+r()*.8).toFixed(2)}s" repeatCount="indefinite"/>${an(v,du,c[2],3,.35)}${an(v,du,'#fff',1,.95)}</g>`}
return `<g filter="url(#bl)" class="p" style="--d:3s">${O(59,7,c[1],'opacity=".55"')}</g>`+O(57,3.2,'#0b0716')+G2(57,1.4,A)+O(57,.8,'#dff1ff','opacity=".9"')+TK(80,62.5,2,c[2],.7)+h+R(8,57,'orb',.75,c[2],22.5,'p')+R(8,57,'orb',.32,'#fff',22.5)+R(1,60,'dia',.9,'#fff',-90,'p')+pa('star',i,6,58,74)};
const AN=(v,du,st,w,o)=>`<path d="${v[0]}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"><animate attributeName="d" values="${v.join(';')};${v[0]}" dur="${du}s" repeatCount="indefinite"/></path>`;
const BO=(v,col,du=.3,w=3)=>AN(v,du,col,w,.35)+AN(v,du,'#fff',w/3,.95);
const JT=(r,a0,a1,rb,bl,n,j)=>[0,1,2].map(()=>'M'+Array.from({length:n+1},(_,q)=>{const t=q/n,a=a0+(a1-a0)*t,d=rb+Math.sin(t*PI)*bl+(q&&q<n?(r()-.5)*j:0);return f1(100+d*cs(a))+' '+f1(100+d*sn(a))}).join('L'));
const BR=(r,a,len,nb,sp,r0=58)=>[0,1,2].map(()=>{const p=Array.from({length:6},(_,q)=>pt(r0+len*q/5,a+(q?(r()-.5)*sp:0)));let d='M'+p.join('L');for(let b=0;b<nb;b++){const q=2+b%3;d+='M'+p[q]+'L'+pt(r0+len*(q+1.4)/5,a+(r()-.5)*sp*3.2)}return d});
const TC=(k,col,i)=>{const r=mk(i*31+k*7+1),fl=(x,d=.5)=>`<g><animate attributeName="opacity" values="1;.3;1;.6;1" keyTimes="0;.25;.5;.75;1" calcMode="discrete" dur="${d}s" repeatCount="indefinite"/>${x}</g>`,vx=o=>[0,1,2].map(()=>'M'+Array.from({length:26},(_,q)=>{const a=o+q*14,d=72-q*.5+(r()-.5)*3;return f1(100+d*cs(a))+' '+f1(100+d*sn(a))}).join('L'));let h='';
if(k==0)for(let n=0;n<6;n++)h+=fl(BO(BR(r,n*60+15,24,2,12),col,.28,3));
else if(k==1){for(let n=0;n<6;n++)h+=fl(BO(JT(r,n*60+15,n*60+75,58,10,9,3),col,.4,3));h+=R(6,57,'orb',.6,'#fff',15,'p')}
else if(k==2)h=S(2.6,BO(JT(r,0,55,61,3,10,2.5),col,.22,3))+S(40,BO(BR(r,0,18,1,10),col,.26,2.6));
else if(k==3)h=S(6,BO(vx(0),col,.3,2.4))+S(6,BO(vx(180),col,.3,2.4));
else if(k==4)for(let n=0;n<5;n++)h+=fl(BO(BR(r,n*72+20,28,3,16),col,.45,2.6),.7);
else if(k==5)h=R(24,62,'orb',.22,'#fff',0,'tw')+[0,1,2].map(n=>fl(BO(JT(r,n*120,n*120+70,66,14,12,5),col,.7,2.4),.9)).join('');
else{for(let n=0;n<4;n++)h+=fl(BO(BR(r,n*90+45,-38,2,14,98),col,.8,3.4),.8);h+=R(4,59,'star',.5,'#fff',45,'p')}
return h};
const ph2=(p,x)=>{const N=8,s=p/N,e=(p+1)/N,f=.07,h=f/2,t=a=>a.toFixed(3),[k,o,z,r]=p==0?[[0,e-h,e+h,1-f,1],[1,1,0,0,1],[1,1,1.08,.9,1],[0,0,10,-10,0]]:p==N-1?[[0,s-h,s+h,1-f,1],[0,0,1,1,0],[.9,.9,1,1,1.08],[-10,-10,0,0,10]]:[[0,s-h,s+h,e-h,e+h,1],[0,0,1,1,0,0],[.9,.9,1,1,1.08,1.08],[-10,-10,0,0,10,10]],kt=k.map(t).join(';'),an=(ty,v)=>`<animateTransform attributeName="transform" type="${ty}" values="${v}" keyTimes="${kt}" dur="32s" repeatCount="indefinite"/>`;return `<g opacity="0"><animate attributeName="opacity" values="${o.join(';')}" keyTimes="${kt}" dur="32s" repeatCount="indefinite"/><g>${an('rotate',r.map(a=>a+' 100 100').join(';'))}<g transform="translate(100 100)"><g>${an('scale',z.join(';'))}<g transform="translate(-100 -100)">${x}</g></g></g></g></g>`};
const SW=(()=>{const kt=[0,.04],vo=[.9,0],ro=[56,80];for(let k=1;k<8;k++){const b=k/8;kt.push(b-.001,b,b+.04);vo.push(0,.9,0);ro.push(56,56,80)}kt.push(1);vo.push(0);ro.push(80);const a=(n,v)=>`<animate attributeName="${n}" values="${v.join(';')}" keyTimes="${kt.map(x=>x.toFixed(3)).join(';')}" dur="32s" repeatCount="indefinite"/>`;return `<circle cx="100" cy="100" r="56" fill="none" stroke="#fff" stroke-width="1.2" opacity="0">${a('r',ro)}${a('opacity',vo)}</circle>`})();
const ETL2=(c,A,i)=>[
rg('#ff8a3c')+R(18,59,'flame',.95,'#ff6a1f',0,'p')+R(18,59,'flame',.55,'#ffd36e',10,'p')+TC(0,'#ffb347',i)+pa('ember',i,5),
rg('#4cc9ff')+S(30,`<path d="${wv(61,2.6,8)}" fill="none" stroke="#9fe8ff" stroke-width="1.1"/>`)+S(26,R(6,67,'orb',.5,'#bfefff',0,'b'),1)+TC(1,'#7fe3ff',i)+pa('bubble',i,4),
S(40,AR(61,0,210,4.2,'#2fbf9a')+AR(61,210,60,3,'#2fbf9a')+AR(61,270,40,1.8,'#2fbf9a')+AR(59.6,6,200,.9,'#ffe9a0','opacity=".8"')+DR)+O(57,1,'#6b4d12','opacity=".6"')+TC(2,'#ffe08a',i),
rg('#bfffe0')+E('wind',['#bfffe0','#4cb7a0','#fff'],i,.62)+TC(3,'#d6ffe9',i)+pa('leaf',i,4),
rg('#6ee08a')+`<path d="${wv(61,2.4,9)}" fill="none" stroke="#3fbf6a" stroke-width="1.2"/>`+R(10,64,'leaf',.5,'#8dff9f',0,'b')+R(4,62,'petal',.5,'#ffd0e8',20)+TC(4,'#9bff8a',i)+pa('fly',i,5),
rg('#dfe6ff')+R(9,61,'orb',2.4,'url(#cm)',0,'b')+S(80,R(7,67,'orb',1.8,'url(#cm)'),1)+TC(5,'#d9c8ff',i),
rg('#d9a066')+E('earth',['#ffa56a','#a8431f','#ffd9bf'],i,.62)+TC(6,'#ffcf7a',i),
TS(c,A,i)].map((x,p)=>ph2(p,x)).join('')+SW;
document.getElementById('df').insertAdjacentHTML('beforeend','<radialGradient id="pl"><stop offset="0" stop-color="#cfe8ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fa8ff" stop-opacity="0"/></radialGradient>');
const T52=a=>(a/52).toFixed(4);
const FL=(x,d=.5)=>`<g><animate attributeName="opacity" values="1;.3;1;.6;1" keyTimes="0;.25;.5;.75;1" calcMode="discrete" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;
const CH=(r,a0,a1)=>[0,1,2].map(()=>{const A=[100+55*cs(a0),100+55*sn(a0)],B=[100+55*cs(a1),100+55*sn(a1)],nx=-(B[1]-A[1]),ny=B[0]-A[0],m=Math.hypot(nx,ny);return 'M'+Array.from({length:9},(_,q)=>{const t=q/8,j=q&&q<8?(r()-.5)*10:0;return f1(A[0]+(B[0]-A[0])*t+nx/m*j)+' '+f1(A[1]+(B[1]-A[1])*t+ny/m*j)}).join('L')});
const GI=()=>{const g=(x,t)=>`<g><animateTransform attributeName="transform" type="translate" values="${x}" calcMode="discrete" dur="${t}s" repeatCount="indefinite"/><use href="#av"/></g>`;return `<g filter="url(#gr)" style="mix-blend-mode:screen">${g('0 0;-3 1;2 -1;-2 0;3 1;0 0',2.4)}</g><g filter="url(#gc)" style="mix-blend-mode:screen">${g('0 0;3 -1;-2 1;2 0;-3 -1;0 0',2.1)}</g><g clip-path="url(#sl)">${g('0 0;7 0;-6 0;0 0;5 0;-8 0',3)}</g>`};
const AVX=i=>{const r=mk(i*7+9),kt=[0],v=[0],dk=[0],dv=['none'];for(let k=0;k<10;k++){const s=k*5.2+3.6;kt.push(s,s+.3,s+1.3,s+1.6);v.push(0,1,1,0);dk.push(s,s+1.6);dv.push('inline','none')}let b='';for(let n=0;n<7;n++)b+=FL(BO(BR(r,n*51+8,-46,3,18,58),'#9fd0ff',(.24+r()*.1).toFixed(2),2.6),.45);for(let n=0;n<3;n++)b+=FL(BO(CH(r,n*120+20,n*120+170),'#fff',.3,2.2),.6);return `<g opacity="0" display="none"><animate attributeName="opacity" values="${v.join(';')}" keyTimes="${kt.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(';')}" keyTimes="${dk.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/><circle cx="100" cy="100" r="52" fill="url(#pl)"/>${GI()}${b}</g>`};
const BC=['#ffe08a','#d6ffe9','#9bff8a','#d9c8ff','#ffcf7a','#ffd08a','#ffe9a0','#7fffd8','#9fd0ff','#7fe3ff'],BK2=[1,3,4,5,6,0,2,1,3,4];
const BU=(k,i)=>{const s=k*5.2+3.6;return `<g opacity="0" display="none"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${T52(s)};${T52(s+.3)};${T52(s+1.3)};${T52(s+1.6)};1" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="none;inline;none" keyTimes="0;${T52(s)};${T52(s+1.6)}" dur="52s" repeatCount="indefinite"/>${TC(BK2[k],BC[k],i+k)}</g>`};
const ROT=x=>{const kt=[0],v=[0],sp=[];let a=0;for(let k=0;k<10;k++){a+=36;kt.push((k*5.2+3.6)/52);v.push(a);sp.push('0 0 1 1');a+=720;kt.push((k+1)/10);v.push(a);sp.push('.6 .013 .4 .987')}return `<g><animateTransform attributeName="transform" type="rotate" values="${v.map(q=>q+' 100 100').join(';')}" keyTimes="${kt.map(q=>q.toFixed(4)).join(';')}" calcMode="spline" keySplines="${sp.join(';')}" dur="52s" repeatCount="indefinite"/>${x}</g>`};
const ph3=(p,x)=>{const on=p?(p-1)*5.2+4.2:0,off=p*5.2+4.6,[kt,o,dk,dv]=p==0?[[0,4.2,4.6,51,51.4,52],[1,1,0,0,1,1],[0,4.6,51],['inline','none','inline']]:[[0,on,on+.4,off-.4,off,52],[0,0,1,1,0,0],[0,on,off],['none','inline','none']];return `<g opacity="0" display="none"><animate attributeName="opacity" values="${o.join(';')}" keyTimes="${kt.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(';')}" keyTimes="${dk.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/>${x}</g>`};
const SW2=(()=>{const kt=[0],vo=[0],ro=[56];for(let k=0;k<10;k++){const s=k*5.2+4.4;kt.push(s-.05,s,s+.6);vo.push(0,.9,0);ro.push(56,56,80)}kt.push(52);vo.push(0);ro.push(80);const a=(n,v)=>`<animate attributeName="${n}" values="${v.join(';')}" keyTimes="${kt.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/>`;return `<circle cx="100" cy="100" r="56" fill="none" stroke="#fff" stroke-width="1.2" opacity="0">${a('r',ro)}${a('opacity',vo)}</circle>`})();
const LB=(r,x0,y0,x1,y1,lv)=>{let p=[[x0,y0],[x1,y1]];for(let s=0;s<lv;s++){const n=[];for(let k=0;k<p.length-1;k++){const a=p[k],b=p[k+1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,d=(r()-.5)*L*.55;n.push(a,[(a[0]+b[0])/2-dy/L*d,(a[1]+b[1])/2+dx/L*d])}n.push(p[p.length-1]);p=n}return p};
const PD2=p=>'M'+p.map(q=>f1(q[0])+' '+f1(q[1])).join('L');
const ZB=r=>{const a=r()*360,sr=56+r()*6,x0=100+sr*cs(a),y0=100+sr*sn(a),m=r();let x1,y1;if(m<.4){const b=a+120+r()*120;x1=100+54*cs(b);y1=100+54*sn(b)}else if(m<.7){const q=r()*360,d=r()*34;x1=100+d*cs(q);y1=100+d*sn(q)}else{const q=a+(r()-.5)*100,d=76+r()*22;x1=100+d*cs(q);y1=100+d*sn(q)}const M=LB(r,x0,y0,x1,y1,5);let d=PD2(M);const nb=r()*2|0,base=Math.atan2(y1-y0,x1-x0);for(let b=0;b<nb;b++){const p=M[Math.floor(M.length*(.2+r()*.55))],ang=base+(r()<.5?-1:1)*(.35+r()*.55),len=10+r()*22;d+=PD2(LB(r,p[0],p[1],p[0]+len*Math.cos(ang),p[1]+len*Math.sin(ang),3))}return d};
const BOLTS=(i,n)=>{const r=mk(i*53+11);let h='';for(let b=0;b<n;b++){const vs=Array.from({length:6},()=>ZB(r)),v=vs.join(';'),du=(3+r()*1.5).toFixed(2),od=(4+r()*2).toFixed(2),ov=Array.from({length:8},()=>r()<.72?1:0).join(';'),L2=(st,sw,op)=>`<path d="${vs[0]}" fill="none" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"><animate attributeName="d" calcMode="discrete" values="${v}" dur="${du}s" repeatCount="indefinite"/></path>`;h+=`<g><animate attributeName="opacity" calcMode="discrete" values="${ov}" dur="${od}s" repeatCount="indefinite"/>${L2('#7fb4ff',4,.22)}${L2('#fff',.9,1)}</g>`}return h};
document.getElementById('df').insertAdjacentHTML('beforeend','<clipPath id="sl2"><rect x="40" y="38" width="120" height="9"><animate attributeName="y" values="38;150;38" dur="1.4s" repeatCount="indefinite"/></rect></clipPath>');
const FM=(x,d)=>`<g><animate attributeName="opacity" values="1;.55;1;.7;1" dur="${d}s" repeatCount="indefinite"/>${x}</g>`;
const SPI=(r,a,sw,r0,r1,j)=>[0,1,2].map(()=>{const PP=t=>[a+sw*t,r0+(r1-r0)*t],p=Array.from({length:11},(_,q)=>{const t=q/10,[an,d0]=PP(t),d=d0+(q&&q<10?(r()-.5)*j:0);return[100+d*cs(an),100+d*sn(an)]}),s=4+(r()*3|0),t0=s/10,sg=r()<.5?-1:1,b=Array.from({length:4},(_,q)=>{const u=q/3,[an,d0]=PP(t0+u*.3),d=d0+(q?(r()-.5)*j:0),aa=an+sg*u*16;return f1(100+d*cs(aa))+' '+f1(100+d*sn(aa))});return 'M'+p.map(w=>f1(w[0])+' '+f1(w[1])).join('L')+'M'+f1(p[s][0])+' '+f1(p[s][1])+'L'+b.join('L')});
const TSX=i=>{const r=mk(i*29+3);let h='';for(let k=0;k<8;k++){const a0=k*45+22.5;h+=FM(BO(JT(r,a0,a0+45,58,8,9,7),'#7fd6ff',(.7+r()*.3).toFixed(2),3.2),(.8+r()*.4).toFixed(2))}for(let k=0;k<8;k++){const a0=k*45+22.5;h+=FM(BO(JT(r,a0,a0+45,50,-6,9,5),'#bfe0ff',(.8+r()*.3).toFixed(2),2),(.9+r()*.4).toFixed(2))}for(let k=0;k<4;k++){h+=FM(BO(SPI(r,k*90+22.5,-60,58,86,5),'#7fd6ff',(.7+r()*.3).toFixed(2),3),(1+r()*.5).toFixed(2))}for(let k=0;k<3;k++){h+=FM(BO(SPI(r,k*120+10,75,55,20,4),'#bfe0ff',(.8+r()*.3).toFixed(2),2.2),(1+r()*.5).toFixed(2))}return h+R(8,57,'orb',.75,'#7fd6ff',22.5,'p')+R(8,57,'orb',.32,'#fff',22.5)};
const GI2=()=>{const g=(x,t,op)=>`<g opacity="${op}"><animateTransform attributeName="transform" type="translate" values="${x}" dur="${t}s" repeatCount="indefinite"/><use href="#av"/></g>`;return `<g filter="url(#gr)" style="mix-blend-mode:screen">${g('0 0;-2 .5;1.5 -.5;0 0',1.1,.7)}</g><g filter="url(#gc)" style="mix-blend-mode:screen">${g('0 0;2 -.5;-1.5 .5;0 0',1.3,.7)}</g><g clip-path="url(#sl2)"><g><animateTransform attributeName="transform" type="translate" values="0 0;4 0;-3 0;0 0" dur="0.9s" repeatCount="indefinite"/><use href="#av"/></g></g>`};
const AW=x=>x?`<g data-att="1">${x}</g>`:'';
const PE=['#8fd6ff','#fff','#fff'];
const TH=(c,rr,T,rd)=>Array.from({length:4+T},(_,j)=>{const a=j*360/(4+T)+rd()*20,n=5,p=Array.from({length:n+1},(_,q)=>pt(rr+2+q*(24+4*T)/n,a+(q?(rd()-.5)*24:0))).join(' ');return `<g class="fk" style="--d:${(.7+rd()*.6).toFixed(1)}s;animation-delay:-${(rd()*3).toFixed(2)}s"><polyline points="${p}" fill="none" stroke="${c[0]}" stroke-width="4" opacity=".5" stroke-linejoin="round"/><polyline points="${p}" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>`}).join('');
const MX=o=>{const N=3,P=5.2,L=N*P,t=a=>(a/L).toFixed(4),i=o.i+700,rd=mk(i*3+1),pal=[o.pc[0],'#fff','#fff'],cols=o.fs.map(j=>PAL[raw[j].split('|')[3]][0]),kt=[0],v=[0],sp=[];let a=0;for(let k=0;k<N;k++){kt.push(k*P+3.6);v.push(a);sp.push('0 0 1 1');kt.push((k+1)*P);v.push(a);sp.push('.6 .013 .4 .987')}
SB_ON=N;const ctr=`<animateTransform attributeName="transform" type="rotate" values="${v.map(z=>-z+' 100 100').join(';')}" keyTimes="${kt.map(t).join(';')}" calcMode="spline" keySplines="${sp.join(';')}" dur="${L}s" repeatCount="indefinite"/>`,q=(N-1)*P+4.2,fm=o.fs.map((j,p)=>{const on=p?(p-1)*P+4.2:0,off=p*P+4.6,[k2,ov,dk2,dv2]=p==0?[[0,4.2,4.6,q,q+.4,L],[1,1,0,0,1,1],[0,4.6,q],['inline','none','inline']]:[[0,on,on+.4,off-.4,off,L],[0,0,1,1,0,0],[0,on,off],['none','inline','none']];return `<g opacity="0" display="none"><animate attributeName="opacity" values="${ov.join(';')}" keyTimes="${k2.map(t).join(';')}" dur="${L}s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv2.join(';')}" keyTimes="${dk2.map(t).join(';')}" dur="${L}s" repeatCount="indefinite"/>${build(raw[j],j).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace('<use href="#av"/>','').replace(/<g data-att="1">/g,'<g data-att="1">'+ctr)}</g>`}).join('');
SB_ON=0;const bk=[0],bo=[0],dk=[0],dv=['none'];for(let k=0;k<N;k++){const s=k*P+3.6;bk.push(s,s+.3,s+1.3,s+1.6);bo.push(0,1,1,0);dk.push(s,s+1.6);dv.push('inline','none')}
return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.nm}"><g><animateTransform attributeName="transform" type="rotate" values="${v.map(z=>z+' 100 100').join(';')}" keyTimes="${kt.map(t).join(';')}" calcMode="spline" keySplines="${sp.join(';')}" dur="${L}s" repeatCount="indefinite"/>${fm}</g><use href="#av"/><g opacity="0" display="none"><animate attributeName="opacity" values="${bo.join(';')}" keyTimes="${bk.map(t).join(';')}" dur="${L}s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(';')}" keyTimes="${dk.map(t).join(';')}" dur="${L}s" repeatCount="indefinite"/></g><g color="${cols[0]}">${COL(cols,N,P)}${TH(CPAL,54,0,rd)}</g></svg>`};
const FC=['#7fe3ff','#ffe08a','#d6ffe9','#9bff8a','#d9c8ff','#ffcf7a','#ffb86b','#ffe9a0','#00f0ff','#8fd6ff'],CPAL=['currentColor','#fff','#fff'];
const COL=(cols,N,P)=>{const L=N*P,kt=[0],v=[cols[0]];for(let k=0;k<N;k++){kt.push(k*P+3.6,(k+1)*P);v.push(cols[k],cols[(k+1)%N])}return `<animate attributeName="color" values="${v.join(';')}" keyTimes="${kt.map(a=>(a/L).toFixed(4)).join(';')}" dur="${L}s" repeatCount="indefinite"/>`};
const CEL=i=>`<g color="${FC[0]}">${COL(FC,10,5.2)}${TH(CPAL,54,0,mk(i*3+1))}</g>`;
const ZAP=i=>{const kt=[0],v=[0],dk=[0],dv=['none'];for(let k=0;k<10;k++){const s=k*5.2+3.6;kt.push(s,s+.3,s+1.3,s+1.6);v.push(0,1,1,0);dk.push(s,s+1.6);dv.push('inline','none')}return `<g opacity="0" display="none"><animate attributeName="opacity" values="${v.join(';')}" keyTimes="${kt.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/><animate attributeName="display" calcMode="discrete" values="${dv.join(';')}" keyTimes="${dk.map(T52).join(';')}" dur="52s" repeatCount="indefinite"/><circle cx="100" cy="100" r="52" fill="url(#pl)"/>${GI2()}</g>`};
const ROTA=()=>{const kt=[0],v=[0],sp=[];let a=0;for(let k=0;k<10;k++){a+=36;kt.push((k*5.2+3.6)/52);v.push(a);sp.push('0 0 1 1');a+=720;kt.push((k+1)/10);v.push(a);sp.push('.6 .013 .4 .987')}return `<animateTransform attributeName="transform" type="rotate" values="${v.map(q=>-q+' 100 100').join(';')}" keyTimes="${kt.map(q=>q.toFixed(4)).join(';')}" calcMode="spline" keySplines="${sp.join(';')}" dur="52s" repeatCount="indefinite"/>`};
const CR=x=>x;
const SBS=(d,x,rv,cx,cy)=>{const N=SB_ON,P=5.2,L=N*P,G=12,Te=N*(3.6+1.6*G),R=Math.max(1,Math.round(Te/d)),w=360*R/Te*(rv?-1:1),kt=[0],v=[0],sp=[];let a=0;for(let k=0;k<N;k++){a+=w*3.6;kt.push(k*P+3.6);v.push(a);sp.push('0 0 1 1');a+=w*1.6*G;kt.push((k+1)*P);v.push(a);sp.push(`.6 ${(.6/G).toFixed(3)} .4 ${(1-.4/G).toFixed(3)}`)}return `<g><animateTransform attributeName="transform" type="rotate" values="${v.map(q=>f1(q)+' '+cx+' '+cy).join(';')}" keyTimes="${kt.map(q=>(q/L).toFixed(4)).join(';')}" calcMode="spline" keySplines="${sp.join(';')}" dur="${L}s" repeatCount="indefinite"/>${x}</g>`};
const ET3=(c,A,i)=>{SB_ON=10;const ph=[
rg('#4cc9ff')+S(30,`<path d="${wv(61,2.6,8)}" fill="none" stroke="#9fe8ff" stroke-width="1.1"/>`)+S(22,`<path d="${wv(64,2,11,90)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".6"/>`,1)+S(26,R(6,67,'orb',.5,'#bfefff',0,'b'),1)+CR(pa('bubble',i,4)),
S(40,AR(61,0,210,4.2,'#2fbf9a')+AR(61,210,60,3,'#2fbf9a')+AR(61,270,40,1.8,'#2fbf9a')+AR(59.6,6,200,.9,'#ffe9a0','opacity=".8"')+DR)+O(57,1,'#6b4d12','opacity=".6"')+R(1,70,'orb',.6,'#bff5ff',-30,'p'),
rg('#bfffe0')+CR(E('wind',['#bfffe0','#4cb7a0','#fff'],i,.62)+pa('leaf',i,4)),
rg('#6ee08a')+`<path d="${wv(61,2.4,9)}" fill="none" stroke="#3fbf6a" stroke-width="1.2"/>`+R(10,64,'leaf',.5,'#8dff9f',0,'b')+S(16,R(3,67,'orb',.9,'#d9ffb0')+R(3,67,'orb',.4,'#fff'))+R(4,62,'petal',.5,'#ffd0e8',20)+CR(pa('fly',i,5)),
rg('#dfe6ff')+R(9,61,'orb',2.4,'url(#cm)',0,'b')+S(80,R(7,67,'orb',1.8,'url(#cm)'),1),
rg('#d9a066')+CR(E('earth',['#ffa56a','#a8431f','#ffd9bf'],i,.62))+S(40,R(6,66,'dia',1.3,'#8fe8ff',0,'tw'),1),
rg('#c98a2e')+S(40,`<path fill-rule="evenodd" d="${gear(16,58,64,54)}" fill="#d9a441" stroke="#ffe9a0" stroke-width=".7"/>`+R(16,60,'orb',.22,'#5a3410'))+[40,220].map(a=>`<g transform="translate(${f1(100+67.5*cs(a))} ${f1(100+67.5*sn(a))})">${S(20,`<path fill-rule="evenodd" d="${gear(8,4.2,7.2,2,0,0)}" fill="#b87a22" stroke="#ffe9a0" stroke-width=".6"/>`,1,0,0)}</g>`).join('')+CR(pa('steam',i,4)),
rg('#e8c15a')+TK(60,63,2,'#fff1c0',.9)+R(12,64,'dia',.55,'#ffe9a0')+O(53.5,.6,'#ffe9a0','opacity=".7"')+S(52,`<path d="M100 43V26" stroke="#ffe9a0" stroke-width="2.2" stroke-linecap="round"/>`)+S(8,`<path d="M100 43V18" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`)+S(3,`<path d="M100 43V14" stroke="#ff6a5a" stroke-width=".8"/><circle cx="100" cy="12" r="1.6" fill="#ff6a5a"/>`),
rg('#00f0ff')+`<g transform="translate(1.6 0)" opacity=".7">${O(57,1.2,'#ff3df2')}</g><g transform="translate(-1.6 0)" opacity=".7">${O(57,1.2,'#00ffd0')}</g>`+S(14,AR(62,0,70,1.6,'#00f0ff')+AR(62,180,70,1.6,'#ff3df2'))+`<circle cx="100" cy="100" r="66" fill="none" stroke="#00ffd0" stroke-width="2.4" stroke-dasharray="2 3 6 2" opacity=".8"><animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.2s" repeatCount="indefinite"/></circle>`+R(4,67,'blade',.5,'#ff3df2',45)+CR(R(16,71,'orb',.16,'#7fffd4',0,'tw')),
rg('#9fd0ff')+TK(80,62.5,2,'#7fd6ff',.7)+S(36,R(8,57,'orb',.75,'#7fd6ff',22.5,'p')+R(8,57,'orb',.32,'#fff',22.5))+R(1,60,'dia',.9,'#fff',-90,'p')+CR(EL.elec(PE,54,0,mk(i*17+5)))].map((x,p)=>ph3(p,x)).join('');SB_ON=0;return ph+ZAP(i)+CEL(i)+SW2};
const ORD=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];
const sh=(n,d,pc,ex)=>[ORD[n-1]+' Shadow','cs',d,pc,(c,A,i)=>pips(n,c[0])+G2(57,1.8,A)+O(61,.7,c[0],'stroke-dasharray="2 5" opacity=".7"')+ex(c,i)];
const LV=[
['Arcane Runic Circle','lv','Cyan runes with crackling violet arcs',['#7ff6ff','#2aa7d8','#c9a8ff'],(c,A,i)=>G2(57,2,A)+S(70,R(8,64,k=>'r'+k,.75,c[0],0,'tw'))+O(61,.7,c[0],'stroke-dasharray="1 3" opacity=".7"')+E('elec',['#b98bff','#fff','#fff'],i,.6)],
['Neko Kawaii Whiskers','lv','Soft kitten ears, whiskers and paw prints',['#ff9fcb','#e0508f','#ffffff'],(c,A)=>{const e=s=>`<g transform="matrix(${s} 0 0 1 ${s<0?200:0} 0)"><path d="M${pt(55,-70)}Q${pt(68,-72)} ${pt(83,-56)}Q${pt(70,-46)} ${pt(55,-38)}Z" fill="${A}" stroke="${c[2]}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${pt(56,-63)}Q${pt(66,-63)} ${pt(76,-56)}Q${pt(67,-50)} ${pt(56,-45)}Z" fill="#c2377a" opacity=".8"/></g>`,w=`<path d="M42 98L20 92M42 103L18 103M43 108L22 115" fill="none" stroke="${c[2]}" stroke-width="1" stroke-linecap="round" opacity=".85"/>`;return e(1)+e(-1)+G2(57,2,A)+w+`<g transform="matrix(-1 0 0 1 200 0)">${w}</g>`+R(2,64,'paw',.5,c[2],45)+`<circle cx="148" cy="48" r="2.4" fill="${c[0]}" class="tw" style="--d:2s"/>`}],
['Iron Seal','lv','Forged iron band with studded rivets',['#c9d3de','#59626f','#e8f0f8'],(c,A)=>G2(57,3,A)+O(53.5,.8,c[2],'opacity=".5"')+O(61,1,c[1],'stroke-dasharray="7 3"')+R(8,57,'orb',.42,'#232830',22.5)+R(8,57,'orb',.18,c[2],22.5)],
['Bronze Crest','lv','Warm bronze ring with four small crests',['#ffbf7a','#a8581f','#ffe3c2'],(c,A)=>G2(57,2.6,A)+O(61,.8,c[0],'opacity=".8"')+R(4,64,'blade',.7,c[0],45)+R(4,57,'dia',.45,c[2],0)+TK(48,64.5,1.6,c[1],.6)],
['Silver Knight','lv','Woven silver with a sweeping shine',['#f4f8ff','#8fa0bd','#ffffff'],(c,A)=>`<path d="${wv(57,1.5,14)}" fill="none" stroke="${c[0]}" stroke-width="1.2"/><path d="${wv(57,1.5,14,180)}" fill="none" stroke="${c[1]}" stroke-width="1.2"/>`+G2(57,1.4,A)+S(5,AR(57,0,45,2.4,'#fff','opacity=".9"'))+R(2,63,'blade',.75,c[0],0)+R(1,62,'dia',.7,'#9fc0ff',-90)],
['Crimson Blade','lv','Blood aura with four slim blades and embers',['#ff6070','#a3101f','#ffc2c8'],(c,A,i)=>`<g class="p" style="--d:2.6s">${O(57,6,c[1],'opacity=".35"')}</g>`+G2(57,2,A)+R(4,67,'blade',1.15,c[0],45)+R(4,67,'blade',.5,'#fff',45)+pa('ember',i)],
['Sapphire Arc','lv','Sapphire arcs with crackling inner light',['#8fd0ff','#2563eb','#e0f2ff'],(c,A,i)=>G2(57,2,A)+S(14,AR(62,0,70,1.6,c[0])+AR(62,180,70,1.6,c[0]))+S(22,AR(65.5,40,40,1,c[2]),1)+R(3,57,'dia',.8,c[2],90)+E('elec',['#7fb8ff','#fff','#fff'],i,.58)],
['Emerald Wilds','lv','A breathing nature ring with drifting leaves',['#7dffb0','#14a35a','#eafff1'],(c,A,i)=>`<g class="p" style="--d:3s">${O(57,5,c[0],'opacity=".22"')}</g><path d="${wv(60.5,2,9)}" fill="none" stroke="${c[0]}" stroke-width=".9"/>`+G2(57,1.8,A)+R(10,63,'leaf',.5,c[0],0,'b')+R(5,57,'petal',.55,'#fff',18)+pa('fly',i,5)],
['Golden Realm','lv','Molten gold with fine rays and heat shimmer',['#ffe28a','#d98e17','#fff7d6'],(c,A,i)=>`<g opacity=".7">${S(90,R(36,60,'spike',.7,c[0]))}</g><g filter="url(#fl)">${O(64,1.3,c[0],'opacity=".7"')}</g>`+G2(57,2.4,A)+R(1,62,'dia',1,c[2],-90)+pa('spark',i,5)],
['Shadow Void','lv','Dark essence that pulls light inward',['#a07bff','#2a1450','#ff4f7b'],(c,A,i)=>{const r=mk(i*5+1);return `${S(36,`<g filter="url(#fl)">${O(61,5,c[1],'opacity=".6"')}${O(64,3,c[0],'opacity=".3"')}</g>`)}${S(22,O(68,.8,c[0],'stroke-dasharray="16 7 3 7" opacity=".7"'),1)}`+O(57,2.4,'#0d0818')+O(57,.8,c[0])+Array.from({length:8},()=>{const a=r()*360;return `<g class="rise" style="--d:${(2+r()*1.6).toFixed(1)}s;--x:${f1(-20*cs(a))}px;--y:${f1(-20*sn(a))}px;animation-delay:-${(r()*3).toFixed(1)}s"><use href="#m-orb" transform="translate(${f1(100+78*cs(a))} ${f1(100+78*sn(a))}) scale(.3)" fill="${c[2]}"/></g>`}).join('')}],
['Celestial Rift','lv','A pulsing violet tear between worlds',['#d9a6ff','#7a2fe0','#9fe8ff'],(c,A,i)=>`<g filter="url(#bl)">${O(58,5,c[1],'opacity=".6"')}</g><path d="${wv(58,3.2,17)}" fill="none" stroke="${c[0]}" stroke-width="1.2" class="p" style="--d:2.4s"/>`+O(57,.6,'#fff','opacity=".6"')+pa('star',i,8,55,70)+S(30,R(2,66,'moon',.7,c[2]))+S(18,`<path d="${sp(73,110,0)}${sp(73,110,180)}" fill="none" stroke="${c[0]}" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>`+AR(70,40,50,1,c[2],'opacity=".6"'))],
['Divine Archon','lv','Prismatic corona, a thin halo and light wings',['#fff3b0','#ffb86b','#ff9fd0'],(c,A,i)=>{const tn=(s,a,b,e,ph)=>{const v=Array.from({length:6},(_,k)=>{const f=ph+k*Math.PI*2/5,g=Math.sin;return `M${s}C${f1(a[0]+4*g(f))} ${f1(a[1]+8*g(f))} ${f1(b[0]+4*g(f+1.7))} ${f1(b[1]+10*g(f+1.7))} ${f1(e[0]+3*g(f+3.2))} ${f1(e[1]+7*g(f+3.2))}`});return `<path d="${v[0]}" fill="none" stroke="${c[0]}" stroke-width="1.5" stroke-linecap="round" opacity=".9"><animate attributeName="d" dur="${(2.6+ph*.3).toFixed(1)}s" values="${v.join(';')}" repeatCount="indefinite"/></path>`},w=tn('158 100',[168,88],[180,82],[192,70],0)+tn('158 106',[170,100],[184,100],[196,98],2)+tn('158 112',[168,112],[180,116],[190,124],4);return `<g opacity=".5">${S(60,R(30,61,'spike',.8,'#fff6c0'))}${S(45,R(20,63,'spike',.55,c[2]),1)}</g>`+G2(57,2,A)+O(61.5,.8,c[2])+`<ellipse cx="100" cy="34" rx="14" ry="3" fill="none" stroke="${c[0]}" stroke-width="1.3"/>`+w+`<g transform="matrix(-1 0 0 1 200 0)">${w}</g>`+pa('feather',i,5)}],
['The Eternal','lv','Guild Master Shadow. Rests calm, then spins up with tesla lightning and transforms: water, dragon, wind, jungle, mist, earth, steampunk, clockwork, digital, lightning',['#e8f4ff','#5b3cff','#7fd6ff'],ET3],
['The Warden','lv','Sanctuary Wardens. Counter-rotating seals and pylons',['#7fffd4','#1f8f8a','#ffe08a'],(c,A)=>G2(57,2,A)+S(50,`<polygon points="${pg(6,64)}" fill="none" stroke="${c[0]}" stroke-width="1"/>`)+S(50,`<polygon points="${pg(6,64,30)}" fill="none" stroke="${c[2]}" stroke-width=".8"/>`,1)+R(4,62,'spike',.8,c[2],0)+S(70,R(12,71,k=>'r'+(k%8),.5,c[0]),1)+O(53.5,.6,c[2],'opacity=".6"')],
['Abyss Archon','bd','Deep-sea tendrils with glowing plankton',['#5ee7ff','#12457a','#a6fff0'],(c,A,i)=>S(50,`<path d="${wv(62,3,5)}" fill="none" stroke="${c[1]}" stroke-width="2.2" opacity=".85"/>`)+S(37,`<path d="${wv(62,3,5,180)}" fill="none" stroke="${c[0]}" stroke-width=".9"/>`,1)+G2(57,2,A)+R(10,67,'orb',.32,c[2],0,'tw')+E('water',c,i,.6)],
['Void Monarch','bd','A black ring, a slim crown and drifting souls',['#b794ff','#1a0b3a','#ff4fa3'],(c,A,i)=>`<g filter="url(#fl)">${O(62,3,c[1],'opacity=".6"')}</g>`+O(57,3,'#08040f')+O(57,.9,c[0])+`<path d="M86 41L90 28L95 36L100 23L105 36L110 28L114 41Z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>`+pa('soul',i,6)],
['Eclipse Blade','bd','A black disc, golden corona and twin crescents',['#ffd36e','#2a1a05','#ffffff'],(c,A)=>`<g opacity=".75">${S(80,R(24,60,'spike',.65,c[0]))}</g>`+O(57,3.6,'#060606')+O(59.6,.9,c[0])+O(54.8,.7,c[0],'opacity=".7"')+R(2,66,'moon',1.5,c[0],0)],
['Umbral Lord','bd','Shadow flames, thorns and small curved horns',['#b7a6e8','#2b2250','#e0d0ff'],(c,A,i)=>{const h=s=>`<g transform="matrix(${s} 0 0 1 ${s<0?200:0} 0)"><path d="M${pt(55,-70)}Q${pt(82,-86)} ${pt(98,-60)}Q${pt(76,-70)} ${pt(55,-50)}Z" fill="${A}" stroke="${c[2]}" stroke-width="1" stroke-linejoin="round"/></g>`;return `<g filter="url(#fl)">${R(10,61,'flame',.85,c[1],0,'p')}</g>`+R(1,61,'flame',1.5,c[0],-90)+R(1,60,'flame',1,c[0],-114)+R(1,60,'flame',1,c[0],-66)+G2(57,1.8,A)+R(16,62,'spike',.6,c[0])+pa('soul',i,5)}],
['Dark Primarch','bd','Armored ring, chevrons and a command crest',['#ff5a6e','#3a0610','#ffb3b3'],(c,A,i)=>G2(57,2.6,A)+O(61,1,c[0],'stroke-dasharray="14 4" opacity=".9"')+R(8,64,'blade',.8,c[0],22.5)+`<path d="M100 26L107 37L100 49L93 37Z" fill="${c[0]}" stroke="${c[2]}" stroke-width=".8"/>`+R(4,63,'spike',.9,c[1],45)+pa('ember',i,5)],
['First Shadow','cs','Alpha, the AI leader: a neural web, data pulses and a slim crown',['#ffffff','#7a3cff','#ff4fa3'],(c,A,i)=>pips(1,c[0])+G2(57,1.8,A)+O(61,.7,c[0],'stroke-dasharray="2 5" opacity=".7"')+FS(c,i)],
sh(2,'Shadow of flame',['#ffb347','#e8441a','#fff0c2'],(c,i)=>E('fire',c,i,.58)),
sh(3,'Shadow of tide',['#6df3ff','#1f8fd6','#d6fbff'],(c,i)=>E('water',c,i,.6)),
sh(4,'Shadow of gale',['#bfffe0','#4cb7a0','#ffffff'],(c,i)=>E('wind',c,i,.6)),
sh(5,'Shadow of thunder',['#8fd6ff','#4a3bff','#ffffff'],(c,i)=>E('thunder',c,i,.6)),
sh(6,'Shadow of stone',['#ffa56a','#8a5a2b','#ffd9bf'],(c,i)=>E('earth',c,i,.6)),
sh(7,'Shadow of frost',['#c9f1ff','#58a8e8','#ffffff'],(c,i)=>R(12,61,'dia',.6,'#e6f8ff',0,'tw')+pa('snow',i,7)),
sh(8,'Shadow of bloom',['#9fff9f','#2a8f4a','#f2ffd0'],(c,i)=>R(10,62,'leaf',.55,c[0],0,'b')+pa('leaf',i,5)),
sh(9,'Shadow of the moon',['#e6e0ff','#5a4fa8','#ffffff'],(c,i)=>S(30,R(2,65,'moon',.9,c[0]))+pa('star',i,6)),
sh(10,'Shadow of dusk',['#ff9a7a','#6a2a58','#ffd0b8'],(c,i)=>pa('ember',i,5)+R(6,60,'flame',.55,c[0],0,'p'))
].map((x,i)=>({i,n:x[0],g:x[1],d:x[2],c:x[3],f:x[4]}));
F.push({i:F.length,s:'',nm:'Nekomimi',ct:'cu',t:2,p:1350,cu:LV[1]});
[['Joki','st',['Clockwork Aviator','Aether Engine Core','Grand Horologist’s Eternity']],['Zenith','me',['Neon Servo Ring','Quantum Seraph Unit','Omega Titan Core']],['Grimoire','ru',['Arcane Sigil Wheel','Sage’s Astral Seal','World Tree Runestone']],['Mori','ju',['Orchid Canopy','Spirit Stag Grove','Yggdrasil’s Crown']],['Kirakira','cu',['Star Candy Dream','Angel Cupcake','Magical Girl Grand Bloom']],['Chimera','an',['Azure Dragon','Phoenix Rebirth','Celestial Qilin']],['Abyss','da',['Abyssal Maw','Reaper’s Sovereign','Void Calamity']],['Valor','kn',['Holy Paladin','Crusader Order','Dawnbringer Grand Marshal']],['Shogun','em',['Imperial Phoenix','Sun Emperor','Celestial Autocrat']],['Ouja','lo',['Demon Lord’s Crown','Vampire Lord','Lord of Calamity']],['Gensou','el',['Thunder Crown','Tsunami Leviathan','Primordial Convergence']],['Astra','ce',['Starlight Veil','Eclipse Oracle','Cosmic Genesis']],['Hyakki','yo',['Kitsune Mask','Tengu Wind Shrine','Nine-Tailed Kitsune God']],['Umi','sa',['Siren’s Lagoon','Abyssal Leviathan','Poseidon’s Trident Realm']],['Divina','ho',['Seraph’s Mercy','Archangel Judgement','Heaven’s Gate Sovereign']],['Chronia','cw',['Haguruma','Shikake','Jikuu']],['Astraea','as',['Wakusei','Shingetsu','Tenkyu']],['Reaper','sg',['Kama','Yomi','Shinigami']],['Kaleido','to',['Mitsu','Rinne','Shinen']]].forEach(([n,ct,fs],k)=>{const ix=fs.map(q=>raw.findIndex(l=>l.startsWith(q+'|')));F.push({i:F.length,s:'',nm:n,ct,t:5,p:9500+k*250,mx:1,fs:ix,pc:PAL[raw[ix[2]].split('|')[3]]})});
const GR={lv:'Level frames',bd:'Board of Darkness',cs:'Council of Shadows'},GC={lv:'#6b7589',bd:'#b45309',cs:'#7c3aed'};
const b2=o=>{const i=o.i+400,c=o.c,A=`url(#a${i})`;return `<svg viewBox="-12 -12 224 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.n}"><defs><linearGradient id="a${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient><radialGradient id="b${i}"><stop offset=".6" stop-color="${c[1]}" stop-opacity=".5"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="68" fill="url(#b${i})" class="p" style="--d:4s"/><use href="#av"/>${O(52.5,1.6,c[1])}${Y0(1,o.f(c,A,i))}${o.i==12?'':S(8+o.i%5,AR(57,0,30,2.6,'#fff','opacity=".55"'))}${o.i>8&&o.i!=12&&o.i<19?S(40,O(70,.6,c[0],'stroke-dasharray="1 6" opacity=".5"'),1):''}</svg>`};
const ns=h=>h.replace(/\bid="(cp|fl|bl|gr|gc|sl|sl2|sh|pl|cm|m-[a-z0-9]+|A-[a-z0-9]+|[ab]\d+)"/g,'id="kf-$1"').replace(/url\(#(cp|fl|bl|gr|gc|sl|sl2|sh|pl|cm|[ab]\d+)\)/g,'url(#kf-$1)').replace(/href="#(m-[a-z0-9]+|A-[a-z0-9]+)"/g,'href="#kf-$1"');
const finalizeDefs=()=>{const html=DEFS.map(x=>typeof x==='string'?x:`<g id="${x.id}">${x.innerHTML}</g>`).join('');const re=/<g id="(A-\w+)">[\s\S]*?<\/g>/g,all=[],last={};let m;while((m=re.exec(html)))all.push([m.index,m[0].length,m[1]]);all.forEach(a=>last[a[2]]=a[0]);let out='',pos=0;all.forEach(a=>{out+=html.slice(pos,a[0]);if(last[a[2]]===a[0])out+=html.substr(a[0],a[1]);pos=a[0]+a[1]});return out+html.slice(pos)};
const STATIC_DEFS=`
<clipPath id="cp"><circle cx="100" cy="100" r="52"/></clipPath>
<filter id="fl" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".02 .05" numOctaves="1" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter>
<filter id="bl"><feGaussianBlur stdDeviation="5"/></filter><filter id="gr"><feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter><filter id="gc"><feColorMatrix values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter><clipPath id="sl"><rect x="40" y="62" width="120" height="9"/><rect x="40" y="96" width="120" height="14"/><rect x="40" y="128" width="120" height="7"/></clipPath><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>

`;
const DEFAULT_AV=`<g clip-path="url(#cp)"><rect x="40" y="40" width="120" height="120" fill="#241d44"/><circle cx="100" cy="90" r="20" fill="#8f86c9"/><path d="M52 160C56 124 144 124 148 160Z" fill="#8f86c9"/></g>`;
export const DEFS_HTML=ns(STATIC_DEFS+finalizeDefs());
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const ENTRIES=[...F.map(o=>({id:slug(o.nm),group:'store',name:o.nm,collection:CATS[o.ct],collectionKey:o.ct,tier:o.t,rarity:RT[o.t-1],price:o.p,render:()=>o.mx?MX(o):o.cu?b2(o.cu):build(o.s,o.i)})),...LV.filter(o=>o.i!=1).map(o=>({id:slug(o.n),group:o.g=='lv'?'level':o.g=='bd'?'title-board-of-darkness':'title-council-of-shadows',name:o.n,collection:GR[o.g],description:o.d,render:()=>b2(o)}))];
export const catalog=ENTRIES.map(({render,...m})=>m);
const byId=Object.fromEntries(ENTRIES.map(e=>[e.id,e]));
/** Returns a complete <svg> string. uid must be unique per mounted instance (React useId). src = avatar image URL (optional). */
export function frameMarkup(id,uid='x',src){const e=byId[id];if(!e)return '';const av=src?`<g clip-path="url(#cp)"><image href="${String(src).replace(/"/g,'&quot;')}" x="48" y="48" width="104" height="104" preserveAspectRatio="xMidYMid slice"/></g>`:DEFAULT_AV;let h=e.render().replace(/href="#av"/g,`href="#kf-av-${uid}"`).replace(/^(<svg[^>]*)>/,`$1 width="100%" height="100%"><defs><g id="kf-av-${uid}">${av}</g></defs>`);return ns(h)}
