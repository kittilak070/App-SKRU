const campus='มหาวิทยาลัยราชภัฏสงขลา',data=window.CAMPUS_DATA,bounds=L.latLngBounds(data.boundary);
const map=L.map('map',{preferCanvas:true,zoomControl:false,minZoom:3,maxZoom:21,zoomSnap:.25,attributionControl:false});
const buttons=[...document.querySelectorAll('[data-cat]')],results=document.querySelector('#results'),layers=L.layerGroup().addTo(map),markers=L.layerGroup().addTo(map);
const palette={dark:{ground:'#223c50',building:'#405e76',edge:'#7093ab',road:'#68849a',sport:'#286958',water:'#266580',outside:'#172b40'},light:{ground:'#edf3eb',building:'#c2d3e3',edge:'#879fb5',road:'#ffffff',sport:'#aed3b0',water:'#9cd3e9',outside:'#e1e8ed'}};
function displayName(f){
 if(!f.named || typeof f.name!=='string' || !f.name.trim() || (f.center&&!isInside(f.center)))return '';
 if(f.name==='Demonstration School Songkhla, Rajabhat University')return 'โรงเรียนสาธิตมหาวิทยาลัยราชภัฏสงขลา';
 return f.name;
}
function coordinateText(point){return point.map(n=>Number(n).toFixed(6)).join(', ')}
function isInside(point){let inside=false;for(let i=0,j=data.boundary.length-1;i<data.boundary.length;j=i++){const a=data.boundary[i],b=data.boundary[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}

function distanceToCampus(point){
 if(isInside(point))return 0;
 const sx=111320*Math.cos(point[0]*Math.PI/180),sy=111320;let nearest=Infinity;
 for(let i=0,j=data.boundary.length-1;i<data.boundary.length;j=i++){
  const a=data.boundary[j],b=data.boundary[i],ax=(a[1]-point[1])*sx,ay=(a[0]-point[0])*sy,bx=(b[1]-point[1])*sx,by=(b[0]-point[0])*sy,dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));nearest=Math.min(nearest,Math.hypot(ax+t*dx,ay+t*dy));
 }return nearest;
}
function isSearchable(point){return Array.isArray(point)&&point.length===2&&point.every(Number.isFinite)&&isInside(point)}
function areaLabel(point){return isInside(point)?'ภายในมหาวิทยาลัย':'นอกมหาวิทยาลัย'}
const officialPlaces=window.OFFICIAL_PLACES.features;
const officialByFeature=new Map(officialPlaces.filter(f=>f.matchedFeature).map(f=>[f.matchedFeature,f]));
const replacedSources=new Set(data.features.filter(f=>officialByFeature.has(f.id)).map(f=>f.source));
const searchFeatures=[...officialPlaces,...data.features.filter(f=>!officialByFeature.has(f.id)),...window.NEARBY_DATA.features.filter(f=>isInside(f.center)&&!replacedSources.has(f.source))];
const placeLabels=L.layerGroup().addTo(map);
function textLabel(text){const span=document.createElement('span');span.textContent=text;return span}
function renderNames(){
 placeLabels.eachLayer(layer=>layer.unbindTooltip());placeLabels.clearLayers();const used=[];
 officialPlaces.filter(f=>f.center&&isInside(f.center)).forEach(f=>{
  const marker=L.circleMarker(f.center,{radius:6,color:'#fff',weight:2,fillColor:'#1b78c7',fillOpacity:1,bubblingMouseEvents:false}).addTo(placeLabels);
  marker.on('click',()=>select(f));
  const p=map.latLngToContainerPoint(f.center),permanent=map.getZoom()>=20||(map.getZoom()>=17&&!used.some(v=>Math.abs(v.x-p.x)<210&&Math.abs(v.y-p.y)<38));
  if(permanent)used.push(p);
  marker.bindTooltip(textLabel(f.name),{permanent,direction:'right',offset:[9,0],className:'official-label'});
 });
}
map.on('moveend',renderNames);
let satelliteMode=true,tileErrors=0;
const satellite=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:19,maxZoom:21}).addTo(map);
const streetMap=L.maplibreGL({style:'basemap-no-labels.json',interactive:false,attributionControl:false,pane:'tilePane'});
satellite.on('tileerror',()=>{if(++tileErrors===3&&satelliteMode){setMode(false);document.querySelector('#status').textContent='โหลดภาพดาวเทียมไม่สำเร็จ จึงแสดงแผนที่แทน'}});
L.control.scale({imperial:false,position:'bottomleft',maxWidth:90}).addTo(map);
function render(){
 layers.clearLayers();const p=palette[document.body.classList.contains('light')?'light':'dark'];
 L.polygon(data.boundary,{color:p.edge,weight:1,fillColor:p.ground,fillOpacity:0,interactive:false}).addTo(layers);
 const sorted=[...data.features].sort((a,b)=>(a.kind==='road'?-1:1)-(b.kind==='road'?-1:1));
 sorted.forEach(f=>{if(!f.kind||f.coords.length<2)return;
 const shape=f.kind==='road'?L.polyline(f.segments||f.coords,{color:p.road,weight:satelliteMode?10:5,opacity:satelliteMode?0:.8}):L.polygon(f.coords,{color:satelliteMode?'#c4def0':f.kind==='building'?p.edge:p[f.kind]||p.edge,opacity:satelliteMode?.25:1,weight:1,fillColor:p[f.kind]||p.building,fillOpacity:satelliteMode?.025:1});
 shape.addTo(layers);shape.options.bubblingMouseEvents=false;const place=officialByFeature.get(f.id)||f;shape.on('click',e=>select(place,[e.latlng.lat,e.latlng.lng],false));if(displayName(place))shape.bindTooltip(textLabel(displayName(place)),{direction:'top'});
 });
 L.polygon(data.boundary,{color:satelliteMode?'#a9d7f1':p.edge,weight:2,dashArray:'6 5',fill:false,interactive:false}).addTo(layers);
}
function setMode(value){satelliteMode=value;tileErrors=0;if(value){map.removeLayer(streetMap);satellite.addTo(map)}else{map.removeLayer(satellite);streetMap.addTo(map)}document.querySelector('#satellite-mode').setAttribute('aria-pressed',String(value));document.querySelector('#vector-mode').setAttribute('aria-pressed',String(!value));render()}
document.querySelector('#satellite-mode').onclick=()=>setMode(true);
document.querySelector('#vector-mode').onclick=()=>setMode(false);
const planDialog=document.querySelector('#plan-dialog'),planImage=document.querySelector('#plan-image');let planScale=1;
function sizePlan(){document.querySelector('#plan-canvas').style.width=planScale*100+'%'}
function openPlan(place){
 if(!planDialog.open)planDialog.showModal();
 const selection=document.querySelector('#plan-selection'),pin=document.querySelector('#plan-pin');
 selection.textContent=place?place.name+' · '+(place.planNumber?'หมายเลข '+place.planNumber+' ในผัง · ':'')+(place.center?coordinateText(place.center)+' · ':'')+(place.note||''):'เลือกชื่อจากรายการ หรือขยายผังเพื่อดูหมายเลขอาคาร';
 const evidence=document.querySelector('#plan-evidence');evidence.replaceChildren();if(place){for(const url of [...new Set([place.source,...(place.evidence||[])])]){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.textContent='แหล่งข้อมูล '+(evidence.children.length+1)+' ↗';evidence.append(a)}}
 pin.hidden=!place?.planPosition;planScale=place?.planPosition?1.8:1;sizePlan();
 if(place?.planPosition){pin.style.left=place.planPosition[0]*100+'%';pin.style.top=place.planPosition[1]*100+'%';pin.textContent=place.planNumber||'•';requestAnimationFrame(()=>{const viewport=document.querySelector('.plan-scroll'),canvas=document.querySelector('#plan-canvas');viewport.scrollTo({left:canvas.clientWidth*place.planPosition[0]-viewport.clientWidth/2,top:canvas.clientHeight*place.planPosition[1]-viewport.clientHeight/2})})}
 else {document.querySelector('.plan-scroll').scrollTo(0,0)}
}
officialPlaces.forEach(place=>{const button=document.createElement('button');button.type='button';button.className='plan-place';button.textContent=place.name;button.dataset.search=searchKey(place.name+' '+place.search);button.onclick=()=>openPlan(place);document.querySelector('#plan-list').append(button)});
document.querySelector('#plan-search').oninput=e=>{const key=searchKey(e.target.value);document.querySelectorAll('.plan-place').forEach(b=>b.hidden=!b.dataset.search.includes(key))};
const coverage=window.OFFICIAL_PLACES.coverage;document.querySelector('#name-coverage').textContent=coverage.names+' รายชื่อ · '+coverage.mapped+' จุดบนแผนที่ · '+coverage.unlocated+' รายการรอยืนยันพิกัด';
document.querySelector('#official-plan').onclick=()=>openPlan();
document.querySelector('#close-plan').onclick=()=>planDialog.close();
document.querySelector('#plan-larger').onclick=()=>{planScale=Math.min(5,planScale+.5);sizePlan()};
document.querySelector('#plan-smaller').onclick=()=>{planScale=Math.max(1,planScale-.5);sizePlan()};
function home(){map.fitBounds(bounds,{paddingTopLeft:innerWidth<760?[80,105]:[145,110],paddingBottomRight:[70,145],animate:false})}
function card(name,detail,point,note=''){
 document.querySelector('#place-name').textContent=name;document.querySelector('#place-name').hidden=!name;
 document.querySelector('#place-detail').textContent=detail;
 document.querySelector('#eyebrow').textContent=point?areaLabel(point):'มหาวิทยาลัยราชภัฏสงขลา';
 document.querySelector('#coordinates').hidden=!point;
 document.querySelector('#latitude').textContent=point?Number(point[0]).toFixed(6):'';
 document.querySelector('#longitude').textContent=point?Number(point[1]).toFixed(6):'';
 document.querySelector('#coordinate-note').textContent=note;document.querySelector('#feature-source').hidden=true;
 const link=document.querySelector('#directions');link.hidden=!point;
 if(point)link.href='https://www.google.com/maps/dir/?api=1&destination='+coordinateText(point).replace(' ','');
}
function select(f,point=f.center,zoom=true){
 if(!point){markers.clearLayers();results.hidden=true;card(displayName(f),f.cat+' · ภายในมหาวิทยาลัย',null,f.note);const source=document.querySelector('#feature-source');source.href=f.source;source.hidden=false;openPlan(f);return}
 if(!point.every(Number.isFinite))return;
 markers.clearLayers();
 const name=displayName(f);
 L.circleMarker(point,{radius:9,color:'#fff',weight:3,fillColor:'#3199df',fillOpacity:1}).bindTooltip(textLabel((name?name+' · ':'')+coordinateText(point)),{direction:'top'}).addTo(markers);
 if(zoom)map.setView(point,Math.max(map.getZoom(),19),{animate:false});
 card(name,(f.cat||({road:'ถนน',water:'สระน้ำ'}[f.kind])||'จุดที่เลือก')+' · '+areaLabel(point),point,zoom?(f.note||'จุดอ้างอิงจาก OpenStreetMap ไม่ใช่ตำแหน่งทางเข้าที่สำรวจแล้ว'):'พิกัดจุดที่แตะบนแผนที่ · '+(f.note||'ไม่ใช่พิกัดจากการสำรวจภาคสนาม'));
 if(f.source){const source=document.querySelector('#feature-source');source.href=f.source;source.hidden=false}
 results.hidden=true;
 document.querySelector('#status').textContent=name+' ละติจูด '+point[0].toFixed(6)+' ลองจิจูด '+point[1].toFixed(6);
}
map.on('click',e=>{const point=[e.latlng.lat,e.latlng.lng];select({name:'',named:false,center:point,cat:'ตำแหน่งบนแผนที่'},point,false)});
function searchKey(text){return String(text||'').normalize('NFKC').toLowerCase().replace(/[๐-๙]/g,c=>String(c.charCodeAt(0)-3664)).replace(/[\s()\/–—-]+/g,'')}
function filter(term,category){
 const query=searchKey(term),found=searchFeatures.filter(f=>(f.center?isSearchable(f.center):f.id.startsWith('skru-'))&&(category?f.cat===category:!!displayName(f)&&searchKey(displayName(f)+' '+f.search).includes(query))).sort((a,b)=>(a.center?distanceToCampus(a.center):0)-(b.center?distanceToCampus(b.center):0));
 markers.clearLayers();results.replaceChildren();results.hidden=false;
 const title=document.createElement('div');title.className='result-heading';title.textContent=found.length?'พบ '+found.length+' สถานที่ภายในมหาวิทยาลัย':'ไม่พบสถานที่ในพื้นที่ค้นหา';results.append(title);
 const close=document.createElement('button');close.type='button';close.className='close-results';close.textContent='×';close.setAttribute('aria-label','ปิดผลการค้นหา');close.onclick=()=>results.hidden=true;results.append(close);
 if(!found.length){const note=document.createElement('p');note.textContent='ลองชื่อคณะ ชื่อสถานที่ หรือเลขอาคาร เช่น อาคาร 48 · ค้นหาเฉพาะภายในมหาวิทยาลัย';results.append(note)}
 found.forEach(f=>{const button=document.createElement('button');button.className='result-item';button.type='button';const name=document.createElement('strong');name.textContent=displayName(f);name.hidden=!displayName(f);const coord=document.createElement('span');coord.className='result-coordinate';coord.textContent=f.center?areaLabel(f.center)+' · '+coordinateText(f.center)+(f.locationMethod==='plan-matched'?' · โดยประมาณ':''):(f.planPosition?'ดูในผัง SKRU · ยังไม่มีพิกัดยืนยัน':'มีชื่อในเอกสาร SKRU · ยังไม่มีพิกัดยืนยัน');button.append(name,coord);button.onclick=()=>select(f);results.append(button);if(f.center)L.circleMarker(f.center,{radius:6,color:'#fff',weight:2,fillColor:'#3199df',fillOpacity:1}).on('click',()=>select(f)).addTo(markers)});
 document.querySelector('#status').textContent=title.textContent;card(category||'ผลการค้นหา',found.length?found.length+' สถานที่ภายในมหาวิทยาลัย':'ยังไม่มีข้อมูลพิกัดในแผนที่',null);
 const points=found.filter(f=>f.center).map(f=>f.center);if(points.length)map.fitBounds(L.latLngBounds(points),{paddingTopLeft:innerWidth<760?[95,190]:[150,180],paddingBottomRight:[80,190],maxZoom:18,animate:false});else home();
}
function reset(){buttons.forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});document.querySelector('#search').value='';markers.clearLayers();results.hidden=true;home();card(campus,'ค้นหาชื่อคณะ สถานที่ หรือเลขอาคาร · ดูรายชื่อในผัง SKRU',null,'ชื่อจากผัง เว็บไซต์ และทะเบียนอาคาร SKRU · จุดจากภาพเป็นพิกัดโดยประมาณ')}
buttons.forEach(b=>b.addEventListener('click',()=>{if(b.classList.contains('active')){reset();return}buttons.forEach(v=>{v.classList.toggle('active',v===b);v.setAttribute('aria-pressed',String(v===b))});document.querySelector('#search').value='';filter('',b.dataset.cat)}));
document.querySelector('#search-form').addEventListener('submit',e=>{e.preventDefault();const value=document.querySelector('#search').value.trim();if(!value){reset();return}buttons.forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});filter(value)});
document.querySelector('#reset').addEventListener('click',reset);
document.querySelector('#zoom-in').addEventListener('click',()=>map.zoomIn());document.querySelector('#zoom-out').addEventListener('click',()=>map.zoomOut());
document.querySelector('#theme').addEventListener('click',e=>{const light=document.body.classList.toggle('light');e.currentTarget.textContent=light?'☾':'☀';e.currentTarget.setAttribute('aria-pressed',String(light));e.currentTarget.setAttribute('aria-label',light?'ใช้แผนที่สีเข้ม':'ใช้แผนที่สีสว่าง');render()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')results.hidden=true});map.on('resize',home);render();reset();renderNames();



const tourDialog=document.querySelector('#tour-dialog'),tourFrame=document.querySelector('#tour-frame'),tourLoading=document.querySelector('#tour-loading');
document.querySelector('#open-tour').addEventListener('click',()=>{document.querySelector('.map-credits').open=false;tourLoading.hidden=false;tourDialog.showModal();tourFrame.src='https://kuula.co/share/collection/7kRms?logo=1&info=0&fs=1&vr=1&zoom=1&thumbs=1&inst=0'});
tourFrame.addEventListener('load',()=>{if(tourDialog.open)tourLoading.hidden=true});
document.querySelector('#close-tour').addEventListener('click',()=>tourDialog.close());
tourDialog.addEventListener('close',()=>{tourFrame.removeAttribute('src');document.querySelector('#open-tour').focus()});

