// MatFlow - Search suggestions (load ALL once, show TEXT list with abbreviations)
class SmartSearch {
  constructor() {
    this.allProducts = [];
    this.meta = [];          // [{name, norm, words, initials, consonants}]
    this.activeIndex = -1;

    this.$q    = document.getElementById('hpSearch');
    this.$sugg = document.getElementById('searchSuggestions');
    if (!this.$q) return;

    this.loadAllProducts().then(() => {
      this.bindEvents();
      const q = this.$q.value.trim();
      if (q) this.renderSuggestions(q, this.findMatches(q));
    });
  }

  // ===== Utils =====
  static esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  static debounce(fn,ms=150){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
  static strip(v=''){ try{ return v.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/Đ/g,'D'); }catch{ return v; } }
  static norm(v=''){ return SmartSearch.strip(v).toLowerCase().trim(); }
  static words(s=''){ return SmartSearch.norm(s).split(/\s+/).filter(Boolean); }

  static initialsOf(words){ return words.map(w=>w[0]).join(''); }
  static consonantsOf(s){
    // bỏ nguyên âm + khoảng trắng
    return SmartSearch.norm(s).replace(/[aeiouy\s]/g,'');
  }
  static isSubsequence(needle, hay){
    // kiểm tra needle là subsequence của hay (ký tự theo thứ tự)
    let i=0,j=0;
    while(i<needle.length && j<hay.length){ if(needle[i]===hay[j]) i++; j++; }
    return i===needle.length;
  }
  static levDistance(a,b){
    const A=SmartSearch.norm(a), B=SmartSearch.norm(b);
    const n=A.length, m=B.length; if(!n) return m; if(!m) return n;
    const dp=Array.from({length:m+1},(_,i)=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++) dp[i][0]=i;
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++)
      for(let j=1;j<=n;j++)
        dp[i][j]=B[i-1]===A[j-1]?dp[i-1][j-1]:Math.min(dp[i-1][j-1]+1,dp[i][j-1]+1,dp[i-1][j]+1);
    return dp[m][n];
  }

  // ===== API: lấy toàn bộ sản phẩm 1 lần =====
  async loadAllProducts(){
    try{
      const res  = await window.apiService.get('/products?take=10000'); // chỉnh take theo backend
      const data = res?.data?.data ?? res?.data;
      const list = (res?.success && Array.isArray(data)) ? data : [];
      this.allProducts = list;
      // dựng meta cho mọi tên
      this.meta = [...new Set(list.map(p=>p?.name).filter(Boolean))].map(name=>{
        const words  = SmartSearch.words(name);
        return {
          name,
          norm: SmartSearch.norm(name),
          words,
          initials: SmartSearch.initialsOf(words),     // "găng tay bảo hộ" -> "gtbh"
          consonants: SmartSearch.consonantsOf(name),  // "găng tay" -> "gngty"
        };
      });
    }catch(e){
      console.error('loadAllProducts error:', e);
      this.allProducts=[]; this.meta=[];
    }
  }

  // ===== Matching với viết tắt =====
  findMatches(query){
    const qNorm   = SmartSearch.norm(query);
    const qWords  = SmartSearch.words(query);
    const shortTypoOK = qNorm.length <= 4; // cho phép sai 1 ký tự nếu rất ngắn

    const scored = this.meta.map(m=>{
      // 1) tất cả token khớp đầu từ
      const allPrefix = qWords.length>0 && qWords.every(t => m.words.some(w => w.startsWith(t)));
      if (allPrefix) return {name:m.name, score:100};

      // 2) tên chứa chuỗi (không dấu)
      if (m.norm.includes(qNorm)) return {name:m.name, score:90};

      // 3) viết tắt theo initials: prefix hoặc subsequence
      if (m.initials.startsWith(qNorm) || SmartSearch.isSubsequence(qNorm, m.initials))
        return {name:m.name, score:85};

      // 4) viết tắt theo consonants: prefix hoặc subsequence
      if (m.consonants.startsWith(qNorm) || SmartSearch.isSubsequence(qNorm, m.consonants))
        return {name:m.name, score:80};

      // 5) sai 1 ký tự cho chuỗi ngắn (so với từng từ)
      if (shortTypoOK && qWords.length===1){
        const dMin = Math.min(...m.words.map(w => SmartSearch.levDistance(qNorm, w)));
        if (dMin <= 1) return {name:m.name, score:75 - dMin}; // 74..75
      }

      // 6) tổng thể gần đúng (khi query dài hơn)
      const d = SmartSearch.levDistance(qNorm, m.norm);
      const sim = 1 - d / Math.max(qNorm.length, m.norm.length || 1);
      if (sim >= 0.78) return {name:m.name, score:70 + sim*5}; // ~70..73.9

      return {name:m.name, score:0};
    });

    return scored
      .filter(x=>x.score>0)
      .sort((a,b)=> (b.score-a.score) || (a.name.length-b.name.length))
      .slice(0,12)
      .map(x=>x.name);
  }

  // ===== UI/Events =====
  bindEvents(){
    const run = SmartSearch.debounce(q=>{
      if (!q){ this.$sugg.style.display='none'; return; }
      const names = this.findMatches(q);
      this.renderSuggestions(q, names);
    },150);

    this.$q.addEventListener('input', e=>{
      const q=e.target.value.trim();
      q ? run(q) : (this.$sugg.style.display='none');
    });

    this.$q.addEventListener('keydown', e=>{
      const items = this.$sugg?.querySelectorAll('.search-suggestion-item, .search-view-all');
      if (!items?.length) return;
      if (e.key==='ArrowDown'){ e.preventDefault(); this.move(1,items); }
      else if (e.key==='ArrowUp'){ e.preventDefault(); this.move(-1,items); }
      else if (e.key==='Enter'){
        e.preventDefault();
        const act = items[this.activeIndex];
        const q = this.$q.value.trim();
        if (act) this.goSearch(act.dataset.q || q);
        else if (q) this.goSearch(q);
      }
    });

    document.addEventListener('click', e=>{
      if (![this.$q,this.$sugg].some(n=>n?.contains(e.target)))
        this.$sugg.style.display='none';
    });

    this.$q.addEventListener('focus', ()=>{
      const q=this.$q.value.trim();
      if (q) this.renderSuggestions(q, this.findMatches(q));
    });
  }

  move(dir, items){
    this.activeIndex = (this.activeIndex + dir + items.length) % items.length;
    items.forEach(el=>el.classList.remove('active'));
    const el=items[this.activeIndex]; el.classList.add('active'); el.scrollIntoView({block:'nearest'});
  }

  renderSuggestions(query, names){
    if (!this.$sugg) return;

    if (!names.length){
      this.$sugg.innerHTML = `
        <div class="search-suggestions">
          <div class="search-view-all" data-q="${SmartSearch.esc(query)}">
            Xem tất cả kết quả cho “${SmartSearch.esc(query)}”
          </div>
        </div>`;
      this.$sugg.querySelector('.search-view-all')
        ?.addEventListener('click',()=>this.goSearch(query));
      this.$sugg.style.display='block';
      return;
    }

    this.$sugg.innerHTML = `
      <div class="search-suggestions">
        ${names.map(n=>`
          <div class="search-suggestion-item" data-q="${SmartSearch.esc(n)}">
            <i class="fa-solid fa-search"></i><span>${SmartSearch.esc(n)}</span>
          </div>`).join('')}
        <div class="search-view-all" data-q="${SmartSearch.esc(query)}">
          Xem tất cả kết quả cho “${SmartSearch.esc(query)}”
        </div>
      </div>`;
    this.$sugg.querySelectorAll('.search-suggestion-item, .search-view-all')
      .forEach(it=> it.addEventListener('click',()=>this.goSearch(it.dataset.q)));
    this.$sugg.style.display='block';
  }

  goSearch(q){
    if (!q) return;
    window.location.href = `../pages/search-result.html?q=${encodeURIComponent(q)}`;
    this.$sugg.style.display='none';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{ window.smartSearch = new SmartSearch(); });
