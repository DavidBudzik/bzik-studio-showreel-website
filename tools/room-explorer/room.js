(() => {
'use strict';
const $ = s => document.querySelector(s);
const variant=new URLSearchParams(location.search).get('room');
const selected=window.ROOM_VARIANTS?.[variant];
const config=selected?.config||window.ROOM_CONFIG, sources=selected?.image||window.ROOM_IMAGE;
// Pannellum splits wide equirectangular images into two GPU textures.
// Choose the native lossless source when both halves fit the device limit.
function panoramaSource(){
 if(!sources)return config.panorama;
 let limit=0;const canvas=document.createElement('canvas');
 try{const gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
 if(gl){limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);gl.getExtension('WEBGL_lose_context')?.loseContext();}}catch{}
 const native=sources.delivery||sources.native;
 const chosen=limit>=Math.max(native.width/2,native.height)?native:sources.compatible;
 return chosen.url;
}
const panorama=panoramaSource(), preview=sources?.preview?.url||panorama;
$('#stage').dataset.quality='loading';
$('#error a').href=panorama;
const he = new URLSearchParams(location.search).get('lang') === 'he';
const lang = he ? 'he' : 'en', reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const strings = {
 en:{eyebrow:'THE MOOR HOUSE / ROOM EXPLORER',title:'The living room.',intro:'A moment inside. Every direction.',loading:'Opening the room…',errorTitle:'The room couldn’t open.',errorText:'Try again, or open the panorama as an image.',retry:'Try again',image:'View image',hint:'Drag to look around',touch:'Swipe to look around',explore:'Look closer',seating:'Soft seating',view:'The landscape',timber:'Timber & light',hide:'Hide markers',show:'Show markers',concept:'AI concept panorama · One fixed viewpoint · Illustrative design, not a measured room.',detail:'ROOM DETAIL',close:'Close detail',zoomIn:'Zoom in',zoomOut:'Zoom out',reset:'Reset view',rotate:'Start rotation',pause:'Pause rotation',full:'Full screen',exitFull:'Exit full screen',fullError:'Expanded view. Press Escape to return.',detailLoading:'Loading full detail…',detailFailed:'Full detail couldn’t load.',detailReady:'Full detail is ready.',ready:'The room is ready. Drag or use arrow keys to look around.',resetDone:'View reset.',panorama:'360 degree room. Drag or use arrow keys to look around. Plus and minus zoom.',controls:'View controls',details:'Room details'},
 he:{eyebrow:'THE MOOR HOUSE / מבט בחדר',title:'חלל המגורים.',intro:'רגע בפנים. מכל כיוון.',loading:'פותחים את החדר…',errorTitle:'לא ניתן לפתוח את החדר.',errorText:'נסו שוב, או פתחו את הפנורמה כתמונה.',retry:'נסו שוב',image:'פתיחת התמונה',hint:'גררו כדי להביט סביב',touch:'החליקו כדי להביט סביב',explore:'מבט מקרוב',seating:'פינת הישיבה',view:'הנוף',timber:'עץ ואור',hide:'הסתרת סמנים',show:'הצגת סמנים',concept:'פנורמה רעיונית שנוצרה ב־AI · נקודת מבט קבועה · המחשה, ללא מידות מאומתות.',detail:'פרט בחדר',close:'סגירת הפרט',zoomIn:'התקרבות',zoomOut:'התרחקות',reset:'איפוס המבט',rotate:'התחלת סיבוב',pause:'עצירת הסיבוב',full:'מסך מלא',exitFull:'יציאה ממסך מלא',fullError:'תצוגה מורחבת. לחצו Escape כדי לחזור.',detailLoading:'טוענים את הפרטים המלאים…',detailFailed:'לא ניתן לטעון את הפרטים המלאים.',detailReady:'כל הפרטים נטענו.',ready:'החדר מוכן. גררו או השתמשו במקשי החצים כדי להביט סביב.',resetDone:'המבט אופס.',panorama:'חדר ב־360 מעלות. גררו או השתמשו בחצים כדי להביט סביב. פלוס ומינוס משנים את המרחק.',controls:'בקרי תצוגה',details:'פרטי החדר'}
};
const t = strings[lang];
if(selected){t.eyebrow=he?'THE MOOR HOUSE / חלופה מרווחת':'THE MOOR HOUSE / SPACIOUS CONCEPT';t.title=he?'מקום לנשום.':'Room to breathe.';t.intro=he?'אותו אופי. יותר מרחב.':'A little more room around you.';}
$('#quality-retry').textContent=t.retry;
document.documentElement.lang = lang; document.documentElement.dir = he ? 'rtl' : 'ltr';
document.title = he ? 'מבט בחדר ב־360° — The Moor House' : '360° Room Explorer — The Moor House';
document.querySelectorAll('[data-copy]').forEach(el => el.textContent = t[el.dataset.copy]);
const label = (id, value) => { $(id).setAttribute('aria-label',value); $(id).title = value; };
[['#zoom-in','zoomIn'],['#zoom-out','zoomOut'],['#reset','reset'],['#rotate','rotate'],['#fullscreen','full'],['#detail-close','close']].forEach(([id,key]) => label(id,t[key]));
$('#panorama').setAttribute('aria-label',t.panorama); $('.controls').setAttribute('aria-label',t.controls); $('.focus-buttons').setAttribute('aria-label',t.details); $('#stage').setAttribute('aria-label',t.title);
if (matchMedia('(pointer:coarse)').matches) $('#hint').textContent=t.touch;
let viewer, ready=false, rotating=false, markers=true, active=null, detailTrigger=null;
let qualityController, qualityURL, qualityRequest, previewTimer, deferredUpgrade, disposed=false, pointerDown=false, recovering=false, requestSerial=0;
let lastInteraction=0, upgradeFocus=null;
const noteInteraction=()=>{lastInteraction=performance.now()};
function qualityStatus(state){$('#stage').dataset.quality=state;$('#quality-status').hidden=state==='full';$('#quality-text').textContent=state==='failed'?t.detailFailed:t.detailLoading;$('#quality-retry').hidden=state!=='failed';}
const buttons = () => document.querySelectorAll('[data-detail]');
function lens(){const a=$('#stage').clientWidth/Math.max(1,$('#stage').clientHeight), framing=config.framing||{};const hfov=Math.min(framing.hfov||90,2*Math.atan(Math.tan((framing.vfov||65)*Math.PI/360)*a)*180/Math.PI);return {hfov,min:Math.max(20,hfov*.7),max:Math.min(framing.maxHfov||105,hfov*1.17)};}
function stop(){rotating=false;viewer?.stopAutoRotate();$('#rotate').setAttribute('aria-pressed','false');label('#rotate',t.rotate);$('#rotate').textContent='▷';}
function clearDetail(restore=false){$('#detail').hidden=true;active=null;buttons().forEach(el=>el.setAttribute('aria-pressed','false'));if(restore&&detailTrigger?.isConnected) detailTrigger.focus();}
function select(id,trigger){if(!ready)return;const item=config.details.find(d=>d.id===id);if(!item)return;stop();active=id;detailTrigger=trigger;$('#detail-kicker').textContent=t.detail+' / '+String(config.details.indexOf(item)+1).padStart(2,'0');$('#detail-title').textContent=item[lang].title;$('#detail-text').textContent=item[lang].text;$('#detail').hidden=false;buttons().forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.detail===id)));viewer.lookAt(item.view.pitch,item.view.yaw,lens().hfov,reduced?0:800);$('#announcement').textContent=item[lang].title+'. '+item[lang].text;}
function marker(el,args){el.classList.add('room-marker');const button=document.createElement('button');button.type='button';button.textContent=String(args.index+1).padStart(2,'0');button.dataset.detail=args.id;button.setAttribute('aria-label',config.details[args.index][lang].title);button.setAttribute('aria-pressed','false');button.disabled=!ready;el.append(button);}
function fail(){clearTimeout(previewTimer);ready=false;$('#loading').hidden=true;$('#error').hidden=false;stop();document.querySelectorAll('.controls button:not(#fullscreen),[data-detail],#details-toggle').forEach(el=>el.disabled=true);}
function sceneOptions(url){const f=lens();return {type:'equirectangular',panorama:url,autoLoad:true,showControls:false,showLoading:false,escapeHTML:true,compass:false,mouseZoom:true,keyboardZoom:true,disableKeyboardCtrl:false,capturedKeyNumbers:[16,17,37,38,39,40,65,68,83,87,61,107,109,173,187,189],pitch:config.start.pitch,yaw:config.start.yaw,hfov:f.hfov,minHfov:f.min,maxHfov:f.max,minPitch:-60,maxPitch:60,sceneFadeDuration:reduced?0:180,hotSpots:config.details.map((d,index)=>({pitch:d.pitch,yaw:d.yaw,cssClass:'room-marker',createTooltipFunc:marker,createTooltipArgs:{id:d.id,index}}))};}
function enableView(){ready=true;$('#loading').hidden=true;$('#error').hidden=true;document.querySelectorAll('button:disabled').forEach(el=>el.disabled=false);buttons().forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.detail===active)));}
function showFullWhenIdle(){
 if(disposed||!qualityURL||!viewer?.isLoaded())return;
 if(pointerDown||document.hidden||performance.now()-lastInteraction<1000){deferredUpgrade=setTimeout(showFullWhenIdle,200);return;}
 const view={pitch:viewer.getPitch(),yaw:viewer.getYaw(),hfov:viewer.getHfov()};
 upgradeFocus=document.activeElement?.closest('.room-marker')?document.activeElement.dataset.detail:null;
 // Pannellum retains the rendered preview during its short native scene fade.
 viewer.addScene('full',sceneOptions(qualityURL));
 viewer.loadScene('full',view.pitch,view.yaw,view.hfov);
}
async function loadFullDetail(){
 if(disposed)return;
 clearTimeout(deferredUpgrade);qualityController?.abort();
 if(qualityURL){URL.revokeObjectURL(qualityURL);qualityURL=null;}
 const serial=++requestSerial;qualityController=new AbortController();qualityStatus('preview');
 const timer=setTimeout(()=>qualityController?.abort(),60000);
 try{
  const response=await fetch(panorama,{signal:qualityController.signal,cache:'default'});
  if(!response.ok)throw Error('Image request failed');
  const blob=await response.blob();if(disposed||serial!==requestSerial)return;
  const url=URL.createObjectURL(blob);qualityURL=url;
  // Validate the download before removing the working interactive preview.
  const decoded=new Image();decoded.src=url;await decoded.decode();
  if(disposed||serial!==requestSerial)return;
  clearTimeout(timer);showFullWhenIdle();
 }catch(e){if(!disposed&&serial===requestSerial){if(qualityURL){URL.revokeObjectURL(qualityURL);qualityURL=null;}qualityStatus('failed');}}
 finally{clearTimeout(timer);}
}
function mount(initial=preview,recoveryView){
 clearTimeout(previewTimer);previewTimer=setTimeout(fail,25000);
 try{
  const opts=sceneOptions(initial);
  viewer=pannellum.viewer('panorama',{default:{...opts,firstScene:'preview'},scenes:{preview:opts}});
  viewer.on('load',()=>{
   clearTimeout(previewTimer);enableView();
   if(viewer.getScene()==='full'){
    qualityStatus('full');performance.mark('room-full-detail');$('#announcement').textContent=t.detailReady;
    if(upgradeFocus){document.querySelector('.room-marker [data-detail='+upgradeFocus+']')?.focus({preventScroll:true});upgradeFocus=null;}
    // Keep the Blob URL until teardown; the renderer may still decode during fade.
    if(rotating)viewer.startAutoRotate(-2,viewer.getPitch());
   }else{
    if(recoveryView)viewer.lookAt(recoveryView.pitch,recoveryView.yaw,recoveryView.hfov,0);
    performance.mark('room-interactive');$('#announcement').textContent=t.ready;
    if(recovering){qualityStatus('failed');recovering=false;}
    else if(preview===panorama||initial===panorama){qualityStatus('full');performance.mark('room-full-detail');}
    else{qualityRequest=loadFullDetail();}
   }
  });
  viewer.on('error',()=>{
   if(viewer?.getScene()==='full'){
    const view={pitch:viewer.getPitch(),yaw:viewer.getYaw(),hfov:viewer.getHfov()};
    stop();recovering=true;viewer.destroy();mount(preview,view);
   }else if(initial===preview&&preview!==panorama&&!recovering){viewer.destroy();mount(panorama);}
   else fail();
  });
 }catch{fail();}
}
// Explicit first scene ensures the preview and full-detail instances share framing.
mount();
$('#quality-retry').onclick=()=>{qualityRequest=loadFullDetail();};
document.addEventListener('pointerdown',()=>{pointerDown=true;noteInteraction()},true);
document.addEventListener('pointerup',()=>{pointerDown=false;noteInteraction()},true);
document.addEventListener('pointercancel',()=>{pointerDown=false;noteInteraction()},true);
document.addEventListener('wheel',noteInteraction,{passive:true});
document.addEventListener('keydown',noteInteraction,true);
window.addEventListener('blur',()=>{pointerDown=false});
document.addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)select(b.dataset.detail,b);});
$('#detail-close').onclick=()=>clearDetail(true);
$('#zoom-in').onclick=()=>{if(ready){stop();viewer.setHfov(Math.max(lens().min,viewer.getHfov()-6),reduced?0:200);}};
$('#zoom-out').onclick=()=>{if(ready){stop();viewer.setHfov(Math.min(lens().max,viewer.getHfov()+6),reduced?0:200);}};
$('#reset').onclick=()=>{if(ready){stop();clearDetail();viewer.lookAt(config.start.pitch,config.start.yaw,lens().hfov,reduced?0:600);$('#announcement').textContent=t.resetDone;}};
$('#rotate').onclick=()=>{if(!ready)return;if(rotating){stop();return;}clearDetail();rotating=true;viewer.startAutoRotate(-2);$('#rotate').setAttribute('aria-pressed','true');label('#rotate',t.pause);$('#rotate').textContent='Ⅱ';};
$('#details-toggle').onclick=()=>{markers=!markers;$('#stage').classList.toggle('markers-hidden',!markers);$('#details-toggle').setAttribute('aria-pressed',String(markers));$('#details-toggle').textContent=markers?t.hide:t.show;};
$('#panorama').addEventListener('pointerdown',e=>{if(!e.target.closest('.room-marker')){stop();clearDetail();}});
$('#panorama').addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='].includes(e.key)&&!e.target.closest('button')){stop();clearDetail();}});
function collapse(){ $('#stage').classList.remove('expanded');label('#fullscreen',t.full);viewer?.resize(); }
$('#fullscreen').onclick=async()=>{
 if($('#stage').classList.contains('expanded')){collapse();return;}
 try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();}
 catch{$('#stage').classList.add('expanded');label('#fullscreen',t.exitFull);viewer?.resize();$('#announcement').textContent=t.fullError;}
};
document.addEventListener('fullscreenchange',()=>{label('#fullscreen',document.fullscreenElement?t.exitFull:t.full);viewer?.resize();});
$('#retry').onclick=()=>location.reload();
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||document.fullscreenElement)return;if($('#stage').classList.contains('expanded')){e.preventDefault();e.stopPropagation();collapse();return;}if(!$('#detail').hidden){e.preventDefault();e.stopPropagation();clearDetail(true);}else if(window.parent!==window){window.parent.postMessage({type:'bzik-room-close'},location.origin);}});
const resizeObserver=new ResizeObserver(()=>{if(!viewer)return;viewer.resize();const f=lens();viewer.setHfovBounds([f.min,f.max]);viewer.setHfov(f.hfov,0);});resizeObserver.observe($('#stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',()=>{disposed=true;clearTimeout(previewTimer);clearTimeout(deferredUpgrade);qualityController?.abort();resizeObserver.disconnect();viewer?.destroy();if(qualityURL)URL.revokeObjectURL(qualityURL);});
})();
