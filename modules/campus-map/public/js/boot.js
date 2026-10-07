// โหลดข้อมูลจากหลังบ้าน (Node.js API หรือ static json) ก่อน แล้วค่อยเริ่มแผนที่
(async function boot(){
  const status = document.querySelector('#status');
  try {
    const fetchJson = async (name) => {
      const candidates = [
        `/api/${name}`,
        `api/${name}`,
        `/modules/campus-map/public/api/${name}`,
        `/modules/campus-map/data/${name}.json`,
        `../data/${name}.json`,
        `../../data/${name}.json`,
        `data/${name}.json`
      ];
      for (const url of candidates) {
        try {
          const r = await fetch(url);
          const ct = r.headers.get('content-type') || '';
          if (r.ok && (ct.includes('json') || url.endsWith('.json'))) {
            return await r.json();
          }
        } catch (_) {}
      }
      throw new Error('ไม่สามารถโหลดข้อมูล ' + name + ' ได้');
    };

    const [campus, official, nearby] = await Promise.all([
      fetchJson('campus'),
      fetchJson('official'),
      fetchJson('nearby')
    ]);
    window.CAMPUS_DATA = campus;
    window.OFFICIAL_PLACES = official;
    window.NEARBY_DATA = nearby;

    const s = document.createElement('script');
    s.src = 'js/app.js';
    s.onerror = () => {
      console.error('Failed to load app.js');
      const mapEl = document.querySelector('#map');
      if (mapEl) mapEl.innerHTML = '<p style="padding:24px;color:#fff;text-align:center;">โหลดสคริปต์แผนที่ไม่สำเร็จ (js/app.js)</p>';
    };
    document.body.appendChild(s);
  } catch(e) {
    console.error('Error booting map:', e);
    if (status) status.textContent = 'โหลดข้อมูลไม่สำเร็จ';
    const mapEl = document.querySelector('#map');
    if (mapEl) {
      mapEl.innerHTML = `
        <div style="position:relative;z-index:9999;padding:32px 20px;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;background:#172b40;">
          <div style="font-size:2.5rem;color:#f87171;">⚠️</div>
          <h3 style="margin:0;font-size:1.1rem;font-weight:600;">ไม่สามารถโหลดข้อมูลแผนที่ได้</h3>
          <p style="margin:0;color:#94a3b8;font-size:0.9rem;">${e.message}</p>
          <button onclick="location.reload()" style="margin-top:12px;padding:8px 18px;background:#2563eb;color:white;border:none;border-radius:8px;font-weight:500;cursor:pointer;">ลองใหม่อีกครั้ง</button>
        </div>`;
    }
  }
})();
