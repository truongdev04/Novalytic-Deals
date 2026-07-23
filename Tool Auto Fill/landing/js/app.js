"use strict";
let OUT = null;

const $ = id => document.getElementById(id);
function stripAccent(s){return (s==null?'':String(s)).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();}

// ---------- tabs ----------
$('tabUpload').onclick=()=>{$('tabUpload').classList.add('active');$('tabPaste').classList.remove('active');$('paneUpload').classList.remove('hidden');$('panePaste').classList.add('hidden');};
$('tabPaste').onclick=()=>{$('tabPaste').classList.add('active');$('tabUpload').classList.remove('active');$('panePaste').classList.remove('hidden');$('paneUpload').classList.add('hidden');};

// ---------- input reading ----------
let pendingRows=null;
$('file').onchange=async e=>{
  const f=e.target.files[0]; if(!f)return;
  $('dropTitle').textContent='✓ '+f.name;
  $('dropHint').textContent='Bấm hoặc kéo thả để chọn file khác';
  $('dropZone').classList.add('filled');
  const buf=await f.arrayBuffer();
  const wb=XLSX.read(buf,{type:'array'});
  const ws=wb.Sheets[wb.SheetNames[0]];
  pendingRows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
};

function parsePaste(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const hasTab=lines.some(l=>l.indexOf('\t')>=0);
  if(hasTab) return lines.map(l=>l.split('\t'));
  return lines.map(line=>{
    const out=[];let cur='',q=false;
    for(let i=0;i<line.length;i++){const c=line[i];
      if(q){ if(c==='"'){ if(line[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
      else { if(c==='"')q=true; else if(c===','){out.push(cur);cur='';} else cur+=c; }
    }
    out.push(cur);return out;
  });
}

// ---------- header mapping ----------
function findHeader(rows){
  for(let r=0;r<Math.min(rows.length,8);r++){
    const cells=(rows[r]||[]).map(stripAccent);
    const store=cells.findIndex(c=>c.includes('store'));
    const title=cells.findIndex(c=>c.includes('tieu de')||c.includes('title'));
    if(store>=0&&title>=0){
      return {headerRow:r,map:{
        store,
        affiliate:cells.findIndex(c=>c.includes('affiliate')||c.includes('link')),
        code:cells.findIndex(c=>c.includes('coupon')||c.includes('code')||/\bma\b/.test(c)),
        discount:cells.findIndex(c=>c.includes('discount')||c.includes('value')||c.includes('gia tri')),
        title
      }};
    }
  }
  return null;
}
// ---------- discount parser ----------
function parseAmount(s){
  let m=s.match(/(\$|€|£)\s*(\d+(?:\.\d+)?)/);
  if(m) return {value:m[2],currency:m[1]};
  m=s.match(/(\d+(?:\.\d+)?)\s*(\$|€|£)/);
  if(m) return {value:m[1],currency:m[2]};
  return null;
}
function parseCoupon(code,value,title,rowNum,store,storeAffiliate){
  const reviews=[];
  code=(code||'').trim(); value=(value||'').trim(); title=(title||'').trim();
  const hasCode=code!==''&&!/no\s*code/i.test(code);
  const couponCode=hasCode?code:'';
  const freeshipDetected=/free\s*ship/i.test(value)||/free\s*ship/i.test(title);

  let discount_type='',discount_value='',currency='';
  const pct=value.match(/(\d+(?:\.\d+)?)\s*%/);
  const amt=parseAmount(value);
  if(pct){discount_type='PERCENT';discount_value=pct[1];}
  else if(amt){discount_type='AMOUNT';discount_value=amt.value;currency=amt.currency;}
  else if(/free\s*ship/i.test(value)){discount_type='OTHER';}
  else if(/^deal$/i.test(value)){discount_type='OTHER';}
  else if(value===''){
    const tp=title.match(/(\d+(?:\.\d+)?)\s*%/),ta=parseAmount(title);
    if(/free\s*ship/i.test(title)){discount_type='OTHER';reviews.push([rowNum,store,'Discount trống — suy ra Free Shipping từ tiêu đề']);}
    else if(tp){discount_type='PERCENT';discount_value=tp[1];reviews.push([rowNum,store,'Discount trống — lấy '+tp[1]+'% từ tiêu đề']);}
    else if(ta){discount_type='AMOUNT';discount_value=ta.value;currency=ta.currency;reviews.push([rowNum,store,'Discount trống — lấy '+ta.currency+ta.value+' từ tiêu đề']);}
    else{discount_type='OTHER';reviews.push([rowNum,store,'Thiếu discount value → tạm để OTHER']);}
  } else {
    discount_type='OTHER';
    reviews.push([rowNum,store,'Discount value lạ: "'+value+'" → tạm để OTHER, kiểm tra lại']);
  }

  const type=hasCode?'CODE':(freeshipDetected?'FREESHIP':'DEAL');

  let finalTitle=title;
  if(!title){
    if(value && /[a-z]/i.test(value) && value.length>5){
      finalTitle=value;
      reviews.push([rowNum,store,'Tiêu đề trống — tạm dùng nội dung cột discount: "'+value+'"']);
    } else reviews.push([rowNum,store,'Thiếu tiêu đề']);
  }
  return {coupon:{store_name:store,title:finalTitle,type,code:couponCode,discount_type,discount_value,currency,link_affiliate:storeAffiliate||'',exclusive:'FALSE'},reviews};
}

// ---------- normalize ----------
function normalize(rows){
  const hdr=findHeader(rows);
  if(!hdr) throw new Error('Không tìm thấy hàng tiêu đề. Cần có cột "Store" và "Title" (hoặc Tên Store / Tiêu đề).');
  const m=hdr.map;
  const stores=[],coupons=[],review=[],seen={},exclusiveSet={};
  let current=null;
  for(let r=hdr.headerRow+1;r<rows.length;r++){
    const row=rows[r]||[];
    const g=i=> i>=0 && row[i]!=null ? String(row[i]).trim() : '';
    const name=g(m.store),aff=g(m.affiliate),code=g(m.code),val=g(m.discount),title=g(m.title);
    const rowNum=r+1;
    if(!name&&!aff&&!code&&!val&&!title) continue;
    if(name){
      current={name,affiliate:aff};
      if(!seen[name]){
        seen[name]=true;
        stores.push({name,link_website:aff,link_affiliate:aff,description:'',about_store:''});
      }
    }
    if(code||val||title){
      if(!current){review.push([rowNum,'','Coupon không có store phía trên (dòng mồ côi)']);continue;}
      const p=parseCoupon(code,val,title,rowNum,current.name,current.affiliate);
      if(!exclusiveSet[current.name]){
        p.coupon.exclusive='TRUE';
        exclusiveSet[current.name]=true;
      }
      coupons.push(p.coupon);
      p.reviews.forEach(x=>review.push(x));
    }
  }
  return {stores,coupons,review};
}

// ---------- render ----------
function esc(s){return (s==null?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function cell(v){return v===''||v==null?'<span class="empty">—</span>':esc(v);}

function render(out){
  $('nStore').textContent=out.stores.length;
  $('nCoupon').textContent=out.coupons.length;
  $('nReview').textContent=out.review.length;
  $('cStore').textContent=out.stores.length;
  $('cCoupon').textContent=out.coupons.length;
  $('cReview').textContent=out.review.length;

  if(out.review.length){
    $('reviewSec').classList.remove('hidden');
    $('reviewList').innerHTML=out.review.map(([rn,st,msg])=>
      `<div class="item"><span class="rn">dòng ${rn}</span><div><span class="store">${esc(st||'—')}</span> · ${esc(msg)}</div></div>`).join('');
  } else $('reviewSec').classList.add('hidden');

  $('tStore').innerHTML='<tr><th>name</th><th>link_website</th><th>link_affiliate</th><th>description</th><th>about_store</th></tr>'+
    out.stores.map(s=>`<tr><td>${cell(s.name)}</td><td class="mono">${cell(s.link_website)}</td><td class="mono">${cell(s.link_affiliate)}</td><td>${cell(s.description)}</td><td>${cell(s.about_store)}</td></tr>`).join('');

  $('tCoupon').innerHTML='<tr><th>store_name</th><th>title</th><th class="mono">type</th><th class="mono">code</th><th class="mono">discount_type</th><th class="mono">value</th><th class="mono">currency</th><th>link_affiliate</th><th class="mono">exclusive</th></tr>'+
    out.coupons.map(c=>{
      const tp=c.type==='CODE'?'<span class="pill code">CODE</span>':c.type==='FREESHIP'?'<span class="pill freeship">FREESHIP</span>':'<span class="pill deal">DEAL</span>';
      return `<tr><td>${cell(c.store_name)}</td><td>${cell(c.title)}</td><td>${tp}</td><td class="mono">${cell(c.code)}</td><td class="mono">${cell(c.discount_type)}</td><td class="mono">${cell(c.discount_value)}</td><td class="mono">${cell(c.currency)}</td><td class="mono">${cell(c.link_affiliate)}</td><td class="mono">${cell(c.exclusive)}</td></tr>`;
    }).join('');

  $('results').classList.remove('hidden');
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
}

// ---------- run ----------
$('run').onclick=()=>{
  $('error').innerHTML='';
  try{
    let rows=null;
    if(!$('paneUpload').classList.contains('hidden')){
      if(!pendingRows) throw new Error('Chưa chọn file. Chọn file .xlsx hoặc chuyển sang tab "Dán dữ liệu".');
      rows=pendingRows;
    }else{
      const t=$('paste').value.trim();
      if(!t) throw new Error('Ô dán đang trống.');
      rows=parsePaste(t);
    }
    OUT=normalize(rows);
    if(!OUT.coupons.length && !OUT.stores.length) throw new Error('Không đọc được store/coupon nào. Kiểm tra lại tiêu đề cột.');
    render(OUT);
  }catch(err){
    $('error').innerHTML='<div class="err">⚠ '+esc(err.message)+'</div>';
  }
};

// ---------- download ----------
$('download').onclick=()=>{
  if(!OUT)return;
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(OUT.stores),'Stores');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(OUT.coupons),'Coupons');
  const rev=OUT.review.map(([row,store,issue])=>({row,store,issue}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rev.length?rev:[{row:'',store:'',issue:'Không có dòng nào cần review'}]),'Review');
  XLSX.writeFile(wb,'stores-coupons-clean.xlsx');
};

// ---------- sample ----------
$('loadSample').onclick=()=>{
  $('tabPaste').click();
  $('paste').value=[
    'Store\tLink Affiliate\tCoupon Code\tDiscount value\tTitle',
    'Weston Store\thttps://www.westonstore.com/NOVALYTIC\tNOVALYTIC\t5%\t5% off entire order',
    '\t\tno code\tFree Shipping\tFree US Shipping',
    '\t\tCYBER20\t8%\t8% Off Storewide at Weston Store',
    '',
    'Abracadabra NYC\thttps://abracadabranyc.com/NOVALYTIC\tNOVALYTIC\t10%\t10% off entire order',
    '\t\tMAGIC15\t15%\tGet up to 15% Off Store-wide',
    '',
    'Home Luxury Scents\thttps://www.homeluxuryscents.com/DEALIX_COUPON\tDEALIX_COUPON\t\t1% off entire order',
    'Setpower\thttps://www.setpowerusa.com/NOVALYTIC\tno code\t$35\tSave An Extra $35 On Your First Order'
  ].join('\n');
};

// ============================================================
// AI providers — multi lựa chọn, mỗi provider giữ key riêng
// ============================================================
const PROVIDERS = {
  openai: {
    label:'OpenAI', defaultModel:'gpt-4o-mini', keyName:'novaltic_key_openai',
    keyLabel:'OpenAI API key (sk-...)',
    modelsUrl:'https://platform.openai.com/docs/models',
    note:'Gọi https://api.openai.com trực tiếp từ trình duyệt.',
    async call(key,model,prompt){
      const res=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model,messages:[{role:'user',content:prompt}],response_format:{type:'json_object'},temperature:0.8})
      });
      if(!res.ok) throw await providerError(res);
      const json=await res.json();
      return json.choices?.[0]?.message?.content||'{}';
    }
  },
  anthropic:{
    label:'Anthropic Claude', defaultModel:'claude-haiku-4-5-20251001', keyName:'novaltic_key_anthropic',
    keyLabel:'Anthropic API key (sk-ant-...)',
    modelsUrl:'https://docs.claude.com/en/docs/about-claude/models',
    note:'Anthropic yêu cầu header đặc biệt để cho phép gọi từ browser — chỉ nên dùng key giới hạn/test, không dùng key production.',
    async call(key,model,prompt){
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':key,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({model,max_tokens:600,messages:[{role:'user',content:prompt}]})
      });
      if(!res.ok) throw await providerError(res);
      const json=await res.json();
      return json.content?.[0]?.text||'{}';
    }
  },
  gemini:{
    label:'Google Gemini', defaultModel:'gemini-3.5-flash', keyName:'novaltic_key_gemini',
    keyLabel:'Gemini API key (AIza...)',
    modelsUrl:'https://ai.google.dev/gemini-api/docs/models',
    note:'Gọi Generative Language API của Google, key được gắn qua query string.',
    async call(key,model,prompt){
      const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}})
      });
      if(!res.ok) throw await providerError(res);
      const json=await res.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text||'{}';
    }
  },
  // openai/gpt-4o-mini
  openrouter:{
    label:'OpenRouter', defaultModel:'google/gemma-4-31b-it:free', keyName:'novaltic_key_openrouter',
    keyLabel:'OpenRouter API key (sk-or-...)',
    modelsUrl:'https://openrouter.ai/models',
    note:'OpenRouter route sang nhiều model khác nhau — đổi ô Model để dùng model khác (vd anthropic/claude-haiku-4.5, google/gemini-2.0-flash).',
    async call(key,model,prompt){
      const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'X-Title':'NovalyticDeals Auto Fill'},
        body:JSON.stringify({model,messages:[{role:'user',content:prompt}],temperature:0.8})
      });
      if(!res.ok) throw await providerError(res);
      const json=await res.json();
      return json.choices?.[0]?.message?.content||'{}';
    }
  }
};

async function providerError(res){
  const body=await res.json().catch(()=>({}));
  const msg=body?.error?.message||body?.error||('HTTP '+res.status);
  return new Error(typeof msg==='string'?msg:JSON.stringify(msg));
}

function extractJSON(text){
  try{return JSON.parse(text);}catch{}
  const m=text.match(/\{[\s\S]*\}/);
  if(m){try{return JSON.parse(m[0]);}catch{}}
  throw new Error('AI trả về không phải JSON hợp lệ: '+text.slice(0,180));
}

function buildPrompt(storeName,titles,websiteUrl){
  return `You are an experienced SEO content writer specializing in eCommerce, affiliate marketing, and Google SEO, writing for an affiliate coupon/deal website (US & Europe market).

Store name: ${storeName}
Store website (reference only — you cannot browse it live, do not invent details you cannot reasonably infer): ${websiteUrl||'(không có)'}
Coupon/deal hiện có của store này (dùng làm ngữ cảnh suy luận ngành hàng): ${titles.slice(0,8).join('; ')||'(không có)'}

General rules:
- Write everything in fluent, natural English.
- Do NOT copy or closely paraphrase content from anywhere — write 100% unique, human-readable content.
- Every store must read differently — do not reuse the same sentence structure/phrasing across different stores.
- Follow Google's E-E-A-T principles; use semantic SEO and NLP-friendly writing.
- Maintain a neutral, informative tone rather than promotional language.
- Do not make unsupported claims or invent information. Only mention products, services, or categories that can reasonably be inferred from the store name, website domain, and the coupon/deal list above.
- Avoid keyword stuffing.
- Avoid exaggerated marketing phrases such as "best", "#1", "leading", "premium", "world-class", "revolutionary" unless clearly justified by the information above.

Part 1 — description:
Write a concise description of the store in 1-2 sentences (20-40 words). Clearly explain what the store offers, mention its primary products/services/niche, include the main keyword naturally, keep it factual and concise, no promotional language.

Part 2 — about_store:
Write an SEO-friendly "About Store" section of about 150-300 words, in EXACTLY 4 paragraphs:
1. Introduce the store, what it specializes in, its core product categories, and — only if inferable — its target audience.
2. Describe the main product categories/services and, only if there's a reasonable basis for it, notable features (specifications, collections, customization, buying guides, subscriptions, bulk purchasing, warranties, memberships, digital resources...).
3. Describe the shopping experience — customer support, shipping, payment methods, return policy, FAQs, account management, blog/resource center — only mentioning what there's real basis for in the information above, not guessed.
4. Neutral closing summary reinforcing the main keyword naturally, explaining what makes the store useful within its niche — no sales language.
Naturally include the main keyword 2-4 times across the whole section, include related semantic keywords where appropriate, vary sentence structure, keep smooth transitions between paragraphs, avoid duplicate phrases.

Ví dụ văn phong/độ dài/cách chia 4 đoạn mong muốn cho about_store (đây là store khác, CHỈ tham khảo tông giọng và cấu trúc — KHÔNG copy nội dung hay số liệu này, nội dung thật phải khớp đúng với store ở trên):
"""
SwissChems is an eCommerce supplier specializing in research chemicals, peptides, SARMs, nootropics, amino acid derivatives, and other laboratory compounds intended strictly for scientific and research applications. The company offers an extensive catalog of research-use-only products designed for qualified researchers, laboratories, and educational institutions, while clearly stating that its products are not intended for human or veterinary use.

The store features a broad selection of research compounds, including peptide vials, selective androgen receptor modulators (SARMs), nootropics, metabolic research compounds, post-cycle research products, and laboratory accessories. Products are organized into dedicated categories with detailed descriptions, dosage forms, batch information, and technical specifications to help researchers identify suitable materials for their projects. Bulk purchasing options are also available for larger research requirements.

SwissChems emphasizes product documentation by providing Certificates of Analysis (COAs) and laboratory testing information for many compounds. The website also includes educational resources, product guides, and a knowledge base that helps researchers better understand compound characteristics, storage recommendations, and intended research applications. Customers can manage orders through an organized online platform supported by customer service and published shipping, payment, and return policies.

By focusing exclusively on research-grade compounds and laboratory materials, SwissChems provides a specialized marketplace for scientific research. Its comprehensive product selection, technical documentation, and educational resources make it a dedicated destination for researchers seeking peptides, SARMs, nootropics, and other research chemicals for lawful laboratory use only.
"""

Trả về ĐÚNG JSON, không thêm chữ nào khác ngoài JSON. Nối 4 đoạn của "about_store" bằng "\\n\\n" (2 dấu xuống dòng) giữa các đoạn: {"description":"...","about_store":"..."}`;
}

function currentProvider(){ return PROVIDERS[$('provider').value]; }

function refreshProviderUI(){
  const p=currentProvider();
  $('model').value=p.defaultModel;
  $('apiKeyLabel').textContent=p.keyLabel;
  $('apiKey').value=localStorage.getItem(p.keyName)||'';
  $('providerNote').textContent=p.note;
  $('modelsLink').href=p.modelsUrl;
}
$('provider').onchange=refreshProviderUI;
$('apiKey').onchange=()=>{
  const p=currentProvider();
  const v=$('apiKey').value.trim();
  if(v) localStorage.setItem(p.keyName,v); else localStorage.removeItem(p.keyName);
};
refreshProviderUI();

// ============================================================
// Fallback chain — tự động chuyển provider/model khi gặp lỗi
// (vd rate limit / quá tải). Ghi chú hiệu quả né limit (theo hiểu
// biết chung, KHÔNG kiểm chứng được trong môi trường này — tự
// kiểm tra lại trước khi tin tưởng hoàn toàn):
//  - Gemini (AI Studio) free tier: quota tính RIÊNG theo từng tên
//    model dưới cùng 1 key → đổi model trong cùng Gemini né limit
//    khá hiệu quả.
//  - OpenRouter free (":free"): giới hạn chủ yếu tính theo TÀI
//    KHOẢN/KEY (không phải theo từng model free) → đổi qua lại các
//    model ":free" trong cùng OpenRouter CHƯA CHẮC né được limit;
//    coi OpenRouter là một danh tính fallback riêng biệt, không
//    phải nơi để đổi model né limit.
//  - OpenAI / Anthropic: hiện không có free tier thật sự cho API
//    thô (ngoài credit dùng thử một lần cho tài khoản mới) → không
//    nằm trong seed mặc định, nhưng vẫn có thể tự thêm dòng
//    openai:... / anthropic:... nếu muốn 1 fallback trả phí riêng.
// ============================================================
const AUTOSWITCH_KEY='novaltic_autoswitch';
const FALLBACK_CHAIN_KEY='novaltic_fallback_chain';
const DEFAULT_FALLBACK_CHAIN=[
  'gemini:gemini-2.0-flash',
  'gemini:gemini-2.5-flash-lite',
  'gemini:gemini-1.5-flash',
  'openrouter:google/gemini-2.0-flash-exp:free',
  'openrouter:meta-llama/llama-3.3-70b-instruct:free',
  'openrouter:mistralai/mistral-small-3.1-24b-instruct:free'
].join('\n');
// Lưu ý: các model id trên là "best effort seed" tại thời điểm viết,
// KHÔNG phải nguồn xác thực — model OpenRouter/Gemini free đổi liên
// tục, hãy kiểm tra lại qua link "Xem danh sách model" của từng
// provider ở trên trước khi tin tưởng danh sách này.

function refreshFallbackUI(){
  $('fallbackChainWrap').classList.toggle('hidden', !$('autoSwitch').checked);
}
$('autoSwitch').checked = localStorage.getItem(AUTOSWITCH_KEY) !== '0';
$('fallbackChain').value = localStorage.getItem(FALLBACK_CHAIN_KEY) ?? DEFAULT_FALLBACK_CHAIN;
refreshFallbackUI();
$('autoSwitch').onchange=()=>{
  localStorage.setItem(AUTOSWITCH_KEY, $('autoSwitch').checked ? '1' : '0');
  refreshFallbackUI();
};
$('fallbackChain').onchange=()=>{
  localStorage.setItem(FALLBACK_CHAIN_KEY, $('fallbackChain').value);
};

// Tách 1 dòng "provider:model" — CHỈ tách ở dấu ':' đầu tiên, vì
// nhiều model id (đặc biệt OpenRouter ":free") tự chứa dấu ':' bên
// trong tên model.
function parseFallbackLine(line){
  const idx=line.indexOf(':');
  if(idx<0) return null;
  const providerId=line.slice(0,idx).trim();
  const model=line.slice(idx+1).trim();
  if(!providerId||!model) return null;
  return {providerId,model};
}

// Chuỗi [{providerId,model}] sẽ thử lần lượt cho CẢ batch:
// - Vị trí 0 luôn là lựa chọn hiện tại trên UI (giữ nguyên hành vi cũ).
// - Nếu autoSwitch bật, nối thêm các dòng hợp lệ trong #fallbackChain,
//   bỏ qua (im lặng, không hỏi lại) dòng: sai cú pháp, provider không
//   tồn tại, provider chưa lưu API key, hoặc trùng 1 mục đã có trong
//   chain (kể cả trùng vị trí 0).
function buildAttemptChain(primaryProviderId,primaryModel){
  const chain=[{providerId:primaryProviderId,model:primaryModel}];
  if(!$('autoSwitch').checked) return chain;
  const lines=$('fallbackChain').value.split('\n').map(l=>l.trim()).filter(Boolean);
  for(const line of lines){
    const parsed=parseFallbackLine(line);
    if(!parsed) continue;
    const provider=PROVIDERS[parsed.providerId];
    if(!provider) continue;
    if(!localStorage.getItem(provider.keyName)) continue;
    const dup=chain.some(a=>a.providerId===parsed.providerId && a.model===parsed.model);
    if(dup) continue;
    chain.push(parsed);
  }
  return chain;
}

$('genAI').onclick=async()=>{
  if(!OUT||!OUT.stores.length)return;
  const p=currentProvider();
  const model=$('model').value.trim()||p.defaultModel;
  const key=$('apiKey').value.trim();
  if(!key){ $('aiProgress').textContent='Nhập API key cho '+p.label+' trước đã.'; return; }
  localStorage.setItem(p.keyName,key);

  const chain=buildAttemptChain($('provider').value,model);
  let chainPos=0; // chỉ tăng dần, KHÔNG reset theo store, KHÔNG wraparound

  const btn=$('genAI');
  btn.disabled=true;
  const total=OUT.stores.length;
  for(let i=0;i<total;i++){
    const s=OUT.stores[i];
    const titles=OUT.coupons.filter(c=>c.store_name===s.name).map(c=>c.title);
    for(;;){
      if(chainPos>=chain.length){
        $('aiProgress').textContent=`Dừng ở store "${s.name}" — đã thử hết ${chain.length} provider/model trong chuỗi fallback, vẫn lỗi.`;
        btn.disabled=false;
        render(OUT);
        return;
      }
      const attempt=chain[chainPos];
      const attemptProvider=PROVIDERS[attempt.providerId];
      const attemptKey=localStorage.getItem(attemptProvider.keyName);
      $('aiProgress').textContent=`Đang viết ${i+1}/${total} (${attemptProvider.label} · ${attempt.model}): ${s.name}...`;
      try{
        const raw=await attemptProvider.call(attemptKey,attempt.model,buildPrompt(s.name,titles,s.link_website));
        const data=extractJSON(raw);
        s.description=data.description||'';
        s.about_store=data.about_store||'';
        break; // store này xong — sang store tiếp theo, chainPos giữ nguyên
      }catch(err){
        if(chainPos+1<chain.length){
          const next=PROVIDERS[chain[chainPos+1].providerId];
          $('aiProgress').textContent=`${attemptProvider.label} lỗi (${err.message}) — chuyển sang ${next.label} · ${chain[chainPos+1].model}...`;
          chainPos++; // thử lại CÙNG store này với attempt kế tiếp
        } else {
          $('aiProgress').textContent=`Dừng ở store "${s.name}" — lỗi: ${err.message}`;
          btn.disabled=false;
          render(OUT);
          return;
        }
      }
    }
  }
  const finalAttempt=chain[chainPos];
  const finalLabel=PROVIDERS[finalAttempt.providerId].label;
  const switchedNote = chainPos>0 ? ` (đã tự động chuyển sang ${finalLabel} · ${finalAttempt.model} giữa chừng)` : ` bằng ${finalLabel}.`;
  $('aiProgress').textContent=`Đã viết xong ${total}/${total} store${switchedNote}`;
  btn.disabled=false;
  render(OUT);
};
