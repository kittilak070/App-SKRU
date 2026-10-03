// โหลดข้อมูลจากหลังบ้าน (Node.js API) ก่อน แล้วค่อยเริ่มแผนที่
(async function boot(){
  const status=document.querySelector('#status');
  try{
    const get=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);return r.json()};
    const [campus,official,nearby]=await Promise.all([get('api/campus'),get('api/official'),get('api/nearby')]);
    window.CAMPUS_DATA=campus;window.OFFICIAL_PLACES=official;window.NEARBY_DATA=nearby;
    const s=document.createElement('script');s.src='js/app.js';document.body.appendChild(s);
  }catch(e){
    console.error(e);
    if(status)status.textContent='โหลดข้อมูลไม่สำเร็จ';
    document.querySelector('#map').innerHTML='<p style="padding:24px;color:#fff">โหลดข้อมูลแผนที่ไม่สำเร็จ — ตรวจว่ารัน <code>node server.js</code> แล้ว</p>';
  }
})();
