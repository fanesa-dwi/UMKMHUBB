const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let toastTimer;
function toast(message) { const box=$('#toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),2400); }
const money = value => new Intl.NumberFormat('id-ID').format(value);
const modal=$('#registration-modal');
let currentPage=1;
const pageSize=10;
let heroImageData=UMKMStore.getSiteContent().hero.imageDataUrl||'';
function renderHeroImagePreview(){const preview=$('#hero-image-preview'),remove=$('#remove-hero-image');preview.hidden=!heroImageData;remove.hidden=!heroImageData;if(heroImageData)preview.src=heroImageData;else preview.removeAttribute('src');}
function makeFaqEditorRow(faq={}){const row=document.createElement('div');row.className='faq-editor-row';const questionLabel=document.createElement('label');questionLabel.textContent='Pertanyaan';const question=document.createElement('input');question.required=true;question.maxLength=180;question.value=faq.question||'';question.placeholder='Tulis pertanyaan';questionLabel.append(question);const answerLabel=document.createElement('label');answerLabel.textContent='Jawaban';const answer=document.createElement('textarea');answer.required=true;answer.rows=3;answer.maxLength=900;answer.value=faq.answer||'';answer.placeholder='Tulis jawaban';answerLabel.append(answer);const remove=document.createElement('button');remove.type='button';remove.textContent='Hapus';remove.setAttribute('aria-label','Hapus pertanyaan');remove.addEventListener('click',()=>row.remove());row.append(questionLabel,answerLabel,remove);return row;}
function loadSiteEditor(){const content=UMKMStore.getSiteContent(),form=$('#site-content-form');form.elements.namedItem('heroEyebrow').value=content.hero.eyebrow;form.elements.namedItem('heroTitle').value=content.hero.title;form.elements.namedItem('heroDescription').value=content.hero.description;form.elements.namedItem('heroBadge').value=content.hero.badge;form.elements.namedItem('programEyebrow').value=content.programs.eyebrow;form.elements.namedItem('programTitle').value=content.programs.title;form.elements.namedItem('programDescription').value=content.programs.description;form.elements.namedItem('programButton').value=content.programs.buttonLabel;$('#faq-editor-list').replaceChildren(...content.programs.faqs.map(makeFaqEditorRow));renderHeroImagePreview();}
async function compressBannerImage(file){if(!file)return '';if(!file.type.startsWith('image/'))throw new Error('Pilih file gambar yang valid.');const source=URL.createObjectURL(file);try{const image=new Image();image.src=source;await image.decode();const scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.76));if(!blob)throw new Error('Gambar banner gagal diproses.');return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Gambar banner gagal dibaca.'));reader.readAsDataURL(blob);});}finally{URL.revokeObjectURL(source);}}

const realBusinesses=data=>data.businesses.filter(item=>!item.isDemo);
function renderStats(data){
  for(const key of ['total','active','newThisMonth','verified','pending','inactive']){
    const id={total:'total-count',active:'active-count',newThisMonth:'new-count',verified:'verified-count',pending:'pending-count',inactive:'inactive-count'}[key];
    const node=$(`#${id}`);node.textContent=money(data.metrics[key]);node.classList.remove('count-pop');void node.offsetWidth;node.classList.add('count-pop');
  }
  $('#chart-tooltip').innerHTML=`Bulan ini · <b>${money(data.metrics.newThisMonth)} UMKM baru</b>`;
  $('#updated-at').textContent=`Diperbarui ${new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
}
function renderCategories(data){
  const counts={};realBusinesses(data).forEach(item=>{const key=item.category||'Lainnya';counts[key]=(counts[key]||0)+1;});
  const total=Object.values(counts).reduce((a,b)=>a+b,0), icons={Kuliner:'🍲',Fashion:'🧵',Kerajinan:'🪴',Jasa:'💻',Lainnya:'✳'};
  const root=$('#category-breakdown');root.replaceChildren();
  if(!total){const empty=document.createElement('p');empty.className='category-empty';empty.textContent='Belum ada data UMKM terdaftar.';root.append(empty);return;}
  Object.entries(counts).forEach(([name,count])=>{const row=document.createElement('div');row.className='category-stat';row.innerHTML=`<span>${icons[name]}</span><div><div><b></b><small></small></div><i><em></em></i></div><strong></strong>`;$('.category-stat b',row).textContent=name;$('.category-stat small',row).textContent=`${money(count)} UMKM`;$('em',row).style.width=`${Math.max(7,count/Math.max(total,1)*100)}%`;$('strong',row).textContent=`${Math.round(count/Math.max(total,1)*100)}%`;root.append(row);});
}
function renderChart(data){
  const now=new Date(),period=$('#filter-period').value,shortMonths=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  let buckets=[];
  if(period==='30'){
    const rangeStart=new Date(now);rangeStart.setHours(0,0,0,0);rangeStart.setDate(rangeStart.getDate()-29);
    buckets=Array.from({length:5},(_,i)=>{const start=new Date(rangeStart);start.setDate(start.getDate()+i*6);const end=new Date(start);end.setDate(end.getDate()+6);end.setMilliseconds(-1);if(i===4)end.setTime(now.getTime());return {label:`${i*6+1}–${Math.min((i+1)*6,30)} hr`,start,end,count:0};});
  }else{
    buckets=Array.from({length:12},(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth()-11+i,1);return {label:shortMonths[date.getMonth()],year:date.getFullYear(),month:date.getMonth(),count:0};});
  }
  realBusinesses(data).forEach(item=>{if(!item.createdAt)return;const date=new Date(item.createdAt);if(Number.isNaN(date.getTime()))return;const bucket=buckets.find(entry=>period==='30'?date>=entry.start&&date<=entry.end:entry.month===date.getMonth()&&entry.year===date.getFullYear());if(bucket)bucket.count++;});
  const values=buckets.map(item=>item.count),max=Math.max(1,...values),step=600/Math.max(1,buckets.length-1),points=values.map((value,i)=>`${Math.round(i*step)},${Math.round(150-value/max*125)}`),line=`M${points.join(' L')}`;
  const svg=$('.growth-chart'),linePath=$('.chart-line',svg),fillPath=$('.chart-fill',svg);linePath.setAttribute('d',line);fillPath.setAttribute('d',`${line} L600,190 L0,190 Z`);
  svg.querySelectorAll('circle').forEach(circle=>circle.remove());points.forEach(point=>{const [cx,cy]=point.split(',');const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',cx);circle.setAttribute('cy',cy);circle.setAttribute('r','4');svg.append(circle);});
  const labels=$('.chart-x');labels.replaceChildren(...buckets.map(bucket=>{const span=document.createElement('span');span.textContent=bucket.label;return span;}));
  const axis=$('.chart-y'),top=Math.ceil(max/4);axis.replaceChildren(...[4,3,2,1,0].map(n=>{const span=document.createElement('span');span.textContent=money(top*n);return span;}));
  const latest=buckets.at(-1);$('#chart-tooltip').innerHTML=`${latest.label} · <b>${money(latest.count)} UMKM baru</b>`;
}
function refreshOptions(data){
  const businesses=realBusinesses(data),regions=[...new Set(businesses.map(item=>item.region).filter(Boolean))].sort();
  const categories=[...new Set(businesses.map(item=>item.category).filter(Boolean))].sort();
  [["#filter-region",regions],["#filter-category",categories]].forEach(([selector,values])=>{const select=$(selector),current=select.value;const label=selector==='#filter-region'?'Semua wilayah':'Semua kategori';select.replaceChildren(new Option(label,'Semua'),...values.map(value=>new Option(value,value)));if(values.includes(current))select.value=current;});
}
function filteredRows(data){
  const region=$('#filter-region').value,category=$('#filter-category').value,status=$('#filter-status').value,q=$('#admin-search').value.trim().toLocaleLowerCase('id');
  return realBusinesses(data).filter(item=>(region==='Semua'||item.region===region)&&(category==='Semua'||item.category===category)&&(status==='Semua'||item.status===status)&&(!q||`${item.name} ${item.owner} ${item.region} ${item.category}`.toLocaleLowerCase('id').includes(q)));
}
function rowMarkup(item){
  const row=document.createElement('tr');row.dataset.id=item.id;row.dataset.category=item.category;row.dataset.region=item.region;row.dataset.status=item.status;
  const name=document.createElement('td');const icon=document.createElement('span');icon.className='table-avatar';icon.textContent=item.icon||'🏪';const title=document.createElement('b');title.textContent=item.name;name.append(icon,title);
  const owner=document.createElement('td');owner.textContent=item.owner||'—';const category=document.createElement('td');category.textContent=item.category||'Lainnya';const region=document.createElement('td');region.textContent=item.region||'—';
  const state=document.createElement('td');const badge=document.createElement('span');badge.className=`status-chip ${item.status==='Terverifikasi'?'status-verified':item.status==='Tidak Aktif'?'status-inactive':'status-pending'}`;badge.textContent=`● ${item.status}`;state.append(badge);
  const action=document.createElement('td');action.className='row-actions';const button=document.createElement('button');button.className='review-button';button.dataset.action=item.status==='Menunggu Verifikasi'?'verify':'toggle';button.textContent=item.status==='Menunggu Verifikasi'?'Verifikasi':'Ubah status';const remove=document.createElement('button');remove.className='delete-record';remove.dataset.deleteId=item.id;remove.setAttribute('aria-label',`Hapus akun ${item.name}`);remove.title='Hapus akun';remove.textContent='Hapus';action.append(button,remove);
  row.append(name,owner,category,region,state,action);return row;
}
function renderTable(data){
  const all=filteredRows(data),maxPages=Math.max(1,Math.ceil(all.length/pageSize));currentPage=Math.min(currentPage,maxPages);
  const start=(currentPage-1)*pageSize,visible=all.slice(start,start+pageSize),body=$('#umkm-table');body.replaceChildren(...visible.map(rowMarkup));
  $('#table-empty').hidden=all.length!==0;$('#table-count').textContent=visible.length;$('#visible-records').textContent=`${all.length} data`;
  const pagination=$('#pagination');pagination.replaceChildren();
  const previous=document.createElement('button');previous.dataset.page='prev';previous.setAttribute('aria-label','Halaman sebelumnya');previous.textContent='←';previous.disabled=currentPage===1;pagination.append(previous);
  const first=Math.max(1,Math.min(currentPage-1,maxPages-2));
  for(let page=first;page<=Math.min(maxPages,first+2);page++){const button=document.createElement('button');button.dataset.page=String(page);button.textContent=String(page);button.classList.toggle('current-page',page===currentPage);pagination.append(button);}
  if(first+2<maxPages){const dots=document.createElement('span');dots.textContent='…';pagination.append(dots);}
  const next=document.createElement('button');next.dataset.page='next';next.setAttribute('aria-label','Halaman berikutnya');next.textContent='→';next.disabled=currentPage===maxPages;pagination.append(next);
}
function render(data){renderStats(data);refreshOptions(data);renderCategories(data);renderChart(data);renderTable(data);}
function openVerificationWhatsApp(item){
  const digits=String(item.whatsapp||item.phone||'').replace(/\D/g,'');if(!digits)return false;
  const phone=digits.startsWith('0')?`62${digits.slice(1)}`:digits;
  const message=`Halo ${item.owner||'Pemilik UMKM'}, usaha ${item.name} sudah terverifikasi di UMKMHUB. Akun penjualmu sekarang aktif. Silakan masuk menggunakan nomor WhatsApp dan kata sandi yang didaftarkan.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');return true;
}

UMKMStore.subscribe(render);render(UMKMStore.get());
['#filter-region','#filter-category','#filter-status','#filter-period'].forEach(selector=>$(selector).addEventListener('change',()=>{
  if(selector==='#filter-region')$('#region-caption').textContent=$('#filter-region').value==='Semua'?'SELURUH WILAYAH':$('#filter-region').value.toLocaleUpperCase('id');
  if(selector==='#filter-period')$('#chart-subtitle').textContent=$('#filter-period').value==='30'?'Jumlah UMKM terdaftar dalam 30 hari':$('#filter-period').value==='year'?'Jumlah UMKM terdaftar tahun ini':'Jumlah UMKM terdaftar per bulan';
  currentPage=1;renderTable(UMKMStore.get());
}));
$('#admin-search').addEventListener('input',()=>{currentPage=1;renderTable(UMKMStore.get());});
$('#umkm-table').addEventListener('click',event=>{
  const remove=event.target.closest('.delete-record');
  if(remove){
    const item=UMKMStore.get().businesses.find(record=>record.id===remove.dataset.deleteId);
    if(!item)return;
    $('#delete-business-name').textContent=item.name;
    $('#delete-reason').value=item.status==='Tidak Aktif'?'inactive':'';
    $('#confirm-delete').dataset.businessId=item.id;
    $('#delete-dialog').showModal();
    return;
  }
  const button=event.target.closest('.review-button');if(!button)return;
  const row=button.closest('tr'),item=UMKMStore.get().businesses.find(record=>record.id===row.dataset.id);if(!item)return;
  const next=button.dataset.action==='verify'?'Terverifikasi':item.status==='Tidak Aktif'?'Menunggu Verifikasi':'Tidak Aktif';
  UMKMStore.setStatus(item.id,next);
  if(next==='Terverifikasi'&&item.passwordHash){const opened=openVerificationWhatsApp(item);toast(opened?`${item.name} terverifikasi. Pesan WhatsApp siap dikirim; tekan Kirim di WhatsApp.`:`${item.name} terverifikasi. WhatsApp tidak dapat dibuka otomatis.`);}
  else if(next==='Terverifikasi')toast(`${item.name} terverifikasi. Data ini belum memiliki akun login penjual.`);
  else toast(`${item.name}: status diubah menjadi ${next}.`);
});
$('#cancel-delete').addEventListener('click',()=>$('#delete-dialog').close());
$('#confirm-delete').addEventListener('click',event=>{
  const reason=$('#delete-reason').value;
  if(!reason){$('#delete-reason').focus();toast('Pilih alasan penghapusan terlebih dahulu.');return;}
  const id=event.currentTarget.dataset.businessId;
  const item=UMKMStore.removeBusiness(id);
  if(!item){$('#delete-dialog').close();toast('Akun sudah tidak ada di daftar.');return;}
  $('#delete-dialog').close();event.currentTarget.removeAttribute('data-business-id');
  const reasonText={policy:'melanggar aturan',inactive:'sudah tidak aktif',duplicate:'data duplikat',other:'alasan admin'}[reason];
  toast(`Akun ${item.name} dihapus karena ${reasonText}.`);
});
$('#pagination').addEventListener('click',event=>{const button=event.target.closest('button[data-page]');if(!button||button.disabled)return;const max=Math.max(1,Math.ceil(filteredRows(UMKMStore.get()).length/pageSize));const requested=button.dataset.page==='prev'?currentPage-1:button.dataset.page==='next'?currentPage+1:Number(button.dataset.page);currentPage=Math.max(1,Math.min(max,requested));renderTable(UMKMStore.get());});
$('#export-data').addEventListener('click',()=>{
  const data=filteredRows(UMKMStore.get()),lines=[['Nama usaha','Pemilik','Telepon','Email','Kategori','Wilayah','Status','Tahun berdiri','Karyawan','Omzet per bulan','Produk']];
  data.forEach(item=>lines.push([item.name,item.owner,item.phone||'',item.email||'',item.category,item.region,item.status,item.year||'',item.employees||0,item.revenue||0,item.products||0]));
  const csv=lines.map(line=>line.map(value=>`"${String(value??'').replaceAll('"','""')}"`).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='umkmhub-data.csv';link.click();URL.revokeObjectURL(url);toast(`${data.length} data diekspor ke CSV.`);
});
$('#admin-add').addEventListener('click',()=>modal.showModal());
$$('.modal-close,.cancel-button').forEach(button=>button.addEventListener('click',()=>modal.close()));
modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
$('#registration-form').addEventListener('submit',event=>{
  event.preventDefault();const f=new FormData(event.currentTarget),address=String(f.get('address')).trim(),whatsapp=String(f.get('phone')).trim(),business=UMKMStore.addBusiness({name:String(f.get('business')).trim(),owner:String(f.get('owner')).trim(),phone:whatsapp,whatsapp,email:String(f.get('email')).trim(),ownerEmail:String(f.get('email')).trim().toLowerCase(),ownerAddress:String(f.get('ownerAddress')).trim(),category:String(f.get('category')),year:Number(f.get('year'))||null,address,region:address.split(',').at(-1).trim()||address,description:String(f.get('description')).trim(),employees:Number(f.get('employees'))||0,revenue:Number(String(f.get('revenue')).replace(/\D/g,''))||0,products:Number(f.get('products'))||0,businessStatus:String(f.get('businessStatus')),social:String(f.get('social')).trim(),photoName:f.get('photo')?.name||'',icon:'🏪'});
  modal.close();event.currentTarget.reset();currentPage=1;toast(`${business.name} ditambahkan dan menunggu verifikasi.`);
});
$('#category-info').addEventListener('click',()=>toast('Sebaran kategori berdasarkan data agregat dan pendaftaran baru.'));
$('.admin-notify').addEventListener('click',()=>toast(`${UMKMStore.get().metrics.pending} UMKM menunggu verifikasi.`));
$('.admin-account').addEventListener('click',()=>toast('Anda masuk sebagai Admin UMKMHUB (mode demo).'));
$('#filter-period').dispatchEvent(new Event('change'));
loadSiteEditor();
$('#toggle-site-editor').addEventListener('click',event=>{const form=$('#site-content-form'),expanded=form.hidden;form.hidden=!expanded;event.currentTarget.setAttribute('aria-expanded',String(expanded));event.currentTarget.innerHTML=expanded?'Tutup editor <span>⌃</span>':'Edit konten <span>⌄</span>';});
$('#add-faq-item').addEventListener('click',()=>$('#faq-editor-list').append(makeFaqEditorRow()));
$('#hero-image-file').addEventListener('change',async event=>{const file=event.currentTarget.files[0];if(!file)return;const status=$('#site-content-status');status.textContent='Memproses gambar…';try{heroImageData=await compressBannerImage(file);renderHeroImagePreview();status.textContent='Gambar siap disimpan.';}catch(error){event.currentTarget.value='';status.textContent=error.message||'Gambar gagal diproses.';}});
$('#remove-hero-image').addEventListener('click',()=>{heroImageData='';$('#hero-image-file').value='';renderHeroImagePreview();$('#site-content-status').textContent='Gambar banner akan dihapus setelah disimpan.';});
$('#site-content-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget,faqs=$$('#faq-editor-list .faq-editor-row').map(row=>({question:$('input',row).value.trim(),answer:$('textarea',row).value.trim()})).filter(item=>item.question&&item.answer);
  const saved=UMKMStore.updateSiteContent({hero:{eyebrow:form.elements.namedItem('heroEyebrow').value.trim(),title:form.elements.namedItem('heroTitle').value.trim(),description:form.elements.namedItem('heroDescription').value.trim(),badge:form.elements.namedItem('heroBadge').value.trim(),imageDataUrl:heroImageData},programs:{eyebrow:form.elements.namedItem('programEyebrow').value.trim(),title:form.elements.namedItem('programTitle').value.trim(),description:form.elements.namedItem('programDescription').value.trim(),buttonLabel:form.elements.namedItem('programButton').value.trim(),faqs}});
  $('#site-content-status').textContent=saved?'Perubahan tersimpan dan tampil di beranda.':'Penyimpanan gagal. Coba gunakan gambar yang lebih kecil.';toast(saved?'Konten beranda dan FAQ tersimpan.':'Penyimpanan gagal karena ruang browser terbatas.');
});
