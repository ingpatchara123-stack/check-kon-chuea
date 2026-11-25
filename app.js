(() => {
  const input = document.querySelector('#message-input');
  const count = document.querySelector('#char-count');
  const result = document.querySelector('#result');
  const patterns = [
    { label: 'เร่งหรือข่มขู่ให้รีบทำ', re: /ด่วน|ทันที|ภายใน\s*\d+\s*(?:นาที|ชั่วโมง|วัน)|ระงับ|อายัด|ถูกล็อก|หมดอายุ|ครั้งสุดท้าย/iu, weight: 2, why: 'ข้อความสร้างแรงกดดันหรือกำหนดเวลา อาจทำให้รีบทำก่อนตรวจสอบ' },
    { label: 'ขอรหัสหรือข้อมูลสำคัญ', re: /รหัส\s*(?:otp|ผ่าน|ยืนยัน)|\botp\b|รหัสผ่าน|เลขบัตรประชาชน|ข้อมูลบัตร|cvv/iu, weight: 3, why: 'ข้อความกล่าวถึงข้อมูลลับที่ไม่ควรส่งให้ผู้อื่น เช่น OTP หรือรหัสผ่าน' },
    { label: 'มี URL หรือลิงก์', re: /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|xyz|top|info|site|online|example)(?:\/\S*)?/iu, weight: 1, why: 'ลิงก์ในข้อความอาจพาไปเว็บปลอม ควรตรวจชื่อโดเมนโดยไม่กดเปิด' },
    { label: 'ขอเงินหรือให้โอน', re: /ค่าธรรมเนียม|ชำระเงิน|โอนเงิน|แนบสลิป|ยืนยันการชำระ|รับเงิน|คืนเงิน/iu, weight: 2, why: 'มีการกล่าวถึงการจ่ายหรือโอนเงิน ควรยืนยันผ่านช่องทางทางการก่อน' },
    { label: 'อ้างหน่วยงานหรือบัญชี', re: /ธนาคาร|กรมสรรพากร|ตำรวจ|ศาล|ไปรษณีย์|พัสดุ|บัญชีของคุณ/iu, weight: 1, why: 'ข้อความอ้างหน่วยงานหรือบัญชี แต่ข้อความเพียงอย่างเดียวพิสูจน์ผู้ส่งไม่ได้' },
    { label: 'เสนอรางวัลหรือผลตอบแทน', re: /ได้รับรางวัล|รับเงินฟรี|เงินคืน|ลงทุน|ผลตอบแทน|ถูกรางวัล/iu, weight: 2, why: 'ข้อเสนอรางวัลหรือผลตอบแทนที่ไม่คาดคิดควรตรวจสอบเงื่อนไขและผู้ส่ง' },
  ];
  const samples = {
    parcel: 'พัสดุของคุณจัดส่งไม่สำเร็จ กรุณาชำระค่าธรรมเนียม 12 บาทภายในวันนี้เพื่อรับพัสดุ https://parcel-check.example',
    bank: 'ธนาคารแจ้งเตือน บัญชีของคุณจะถูกระงับทันที กรุณายืนยันข้อมูลและรหัส OTP ที่ https://secure-bank.example',
    normal: 'พรุ่งนี้ประชุมครูเวลา 9.00 น. ที่ห้องประชุมเล็ก อย่าลืมนำเอกสารโครงการมาด้วยนะคะ',
  };
  input.addEventListener('input', () => { count.textContent = `${input.value.length.toLocaleString('th-TH')} / 5,000`; });
  document.querySelectorAll('[data-sample]').forEach((chip) => chip.addEventListener('click', () => { input.value = samples[chip.dataset.sample]; input.dispatchEvent(new Event('input')); input.focus(); }));
  document.querySelector('#clear-button').addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); result.hidden = true; input.focus(); });

  document.querySelector('#analyze-button').addEventListener('click', () => {
    const text = input.value.trim(); result.replaceChildren();
    if (!text) { const p = document.createElement('p'); p.textContent = 'กรุณาวางข้อความที่ต้องการตรวจสอบก่อน'; result.append(p); result.hidden = false; input.focus(); return; }
    const found = patterns.flatMap((rule) => { const m = text.match(rule.re); return m ? [{ ...rule, quote: m[0] }] : []; });
    const score = found.reduce((n, x) => n + x.weight, 0);
    const level = score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low';
    const labels = { high: ['มีหลายสัญญาณที่ควรระวัง', 'พบรูปแบบที่ควรตรวจสอบหลายข้อ'], medium: ['พบสัญญาณที่ควรตรวจสอบ', 'พบรูปแบบที่ควรตรวจสอบอย่างน้อยหนึ่งข้อ'], low: ['ไม่พบสัญญาณตามกฎที่ตั้งไว้', 'ผลนี้หมายถึงกฎชุดเล็กนี้ไม่พบคำที่รู้จัก ไม่ได้ยืนยันว่าปลอดภัย'] };
    result.className = `result risk-${level}`;
    const head = document.createElement('div'); head.className = 'result-head'; head.innerHTML = `<span class="risk-icon" aria-hidden="true">${level === 'high' ? '!' : level === 'medium' ? '◷' : 'i'}</span><div><div class="risk-caption">ผลคัดกรองด้วยกฎคำสำคัญ</div><div class="risk-title"></div></div>`; head.querySelector('.risk-title').textContent = labels[level][0]; result.append(head);
    const intro = document.createElement('p'); intro.className = 'result-explanation'; intro.textContent = labels[level][1]; result.append(intro);
    const h = document.createElement('h3'); h.textContent = 'หลักฐานจากข้อความที่วาง'; result.append(h);
    if (!found.length) { const p = document.createElement('p'); p.className = 'result-explanation'; p.textContent = 'ไม่พบคำหรือรูปแบบที่ตรงกับกฎปัจจุบัน'; result.append(p); }
    found.forEach((item) => { const card = document.createElement('div'); card.className = 'evidence-card'; const quote = document.createElement('b'); quote.textContent = `พบข้อความ: “${item.quote}”`; const why = document.createElement('p'); why.textContent = item.why; card.append(quote, why); result.append(card); });
    const advice = document.createElement('p'); advice.className = 'advice'; advice.textContent = 'อย่ากดลิงก์หรือส่ง OTP/รหัสผ่าน ตรวจสอบกับหน่วยงานผ่านแอปหรือหมายเลขทางการที่ค้นหาเอง หากไม่แน่ใจให้ปรึกษาผู้ใหญ่ที่ไว้ใจได้'; result.append(advice);
    const foot = document.createElement('p'); foot.className = 'result-foot'; foot.textContent = 'วิเคราะห์จากข้อความที่ตรงกับกฎเท่านั้น ไม่มี AI หรือฐานข้อมูลภัยคุกคามออนไลน์ และอาจเตือนผิดหรือพลาดได้'; result.append(foot); result.hidden = false;
  });

  // Local URL-shape inspection only. Never fetch or open the supplied address.
  const urlForm = document.querySelector('#url-form');
  urlForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = document.querySelector('#url-input').value.trim();
    const issues = []; let parsed;
    try {
      parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) issues.push('โปรโตคอลไม่ใช่ HTTP/HTTPS');
      if (parsed.protocol === 'http:') issues.push('ใช้ HTTP แทน HTTPS');
      if (parsed.username || parsed.password) issues.push('มีข้อมูลก่อน @ ซึ่งอาจทำให้เข้าใจชื่อโฮสต์ผิด');
      if (parsed.hostname.startsWith('xn--') || parsed.hostname.includes('.xn--')) issues.push('พบชื่อโดเมนรูปแบบ punycode');
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname) || parsed.hostname.includes(':')) issues.push('ใช้หมายเลข IP เป็นโฮสต์');
      if (/^(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly)$/i.test(parsed.hostname)) issues.push('เป็นบริการย่อลิงก์ จึงมองไม่เห็นปลายทางจาก URL');
      if (parsed.port && !['80','443'].includes(parsed.port)) issues.push('ใช้พอร์ตที่ไม่ค่อยพบในเว็บไซต์ทั่วไป');
      if (/[ก-๙]/.test(parsed.hostname)) issues.push('ชื่อโฮสต์มีอักษรนอก ASCII');
    } catch { issues.push('แยก URL หรือชื่อโฮสต์ไม่สำเร็จ'); }
    const box = document.querySelector('#url-result'); box.replaceChildren(); box.className = `url-result ${issues.length >= 2 ? 'risk-high' : issues.length ? 'risk-medium' : 'risk-low'}`;
    const heading = document.createElement('h3'); heading.textContent = issues.length >= 2 ? 'พบหลายรูปแบบที่ควรระวัง' : issues.length ? 'พบรูปแบบที่ควรตรวจสอบ' : 'ไม่พบรูปแบบเตือนพื้นฐาน'; box.append(heading);
    const host = document.createElement('p'); host.textContent = `โฮสต์ที่อ่านได้: ${parsed ? parsed.hostname : 'อ่านไม่ได้'}`; box.append(host);
    if (issues.length) { const list = document.createElement('ul'); issues.forEach((x) => { const li = document.createElement('li'); li.textContent = x; list.append(li); }); box.append(list); }
    else { const p = document.createElement('p'); p.textContent = 'กฎพื้นฐานไม่พบสัญญาณ ไม่ได้หมายความว่า URL ปลอดภัย'; box.append(p); }
    box.hidden = false;
  });

  const themeButton = document.querySelector('#theme-toggle');
  const themeLabel = themeButton.querySelector('.theme-label');
  const themeIcon = themeButton.querySelector('.theme-icon');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    themeLabel.textContent = dark ? 'ธีมสว่าง' : 'ธีมมืด';
    themeIcon.textContent = dark ? '☀' : '☾';
    themeButton.setAttribute('aria-label', dark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#111914' : '#f5f7f2';
  };
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light'; } catch { /* Storage may be unavailable for local files. */ }
  applyTheme(savedTheme);
  themeButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('site-theme', next); } catch { /* Theme still changes for this page view. */ }
  });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let frame = 0;
    document.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
        frame = 0;
      });
    }, { passive: true });
  }
})();

