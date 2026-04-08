import { useState, useCallback, useRef, useEffect } from "react";

// ─── PDF & CSV YARDIMCI FONKSİYONLAR ─────────────────────────────────────────

const loadJsPDF = () => new Promise((resolve) => {
  if (window.jspdf) { resolve(window.jspdf); return; }
  const s1 = document.createElement("script");
  s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
    s2.onload = () => resolve(window.jspdf);
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
});

function csvIndir(satirlar, basliklar, dosyaAdi) {
  const bom = "\uFEFF";
  const icerik = [basliklar, ...satirlar].map(s => s.map(h => `"${String(h).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([bom + icerik], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = dosyaAdi; a.click();
  URL.revokeObjectURL(url);
}

// Türkçe karakter dönüştürücü
function trChar(metin) {
  if (typeof metin !== "string") return String(metin ?? "");
  return metin
    .replace(/ş/g,"s").replace(/Ş/g,"S")
    .replace(/ğ/g,"g").replace(/Ğ/g,"G")
    .replace(/ü/g,"u").replace(/Ü/g,"U")
    .replace(/ö/g,"o").replace(/Ö/g,"O")
    .replace(/ç/g,"c").replace(/Ç/g,"C")
    .replace(/ı/g,"i").replace(/İ/g,"I")
    .replace(/â/g,"a").replace(/Â/g,"A")
    .replace(/î/g,"i").replace(/Î/g,"I")
    .replace(/û/g,"u").replace(/Û/g,"U");
}

async function pdfIndir(baslik, tablolar, dosyaAdi, altBilgi) {
  const { jsPDF } = await loadJsPDF();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const tarih = new Date().toLocaleDateString("tr-TR");
  doc.setFillColor(15,17,23);
  doc.rect(0,0,297,20,"F");
  doc.setTextColor(124,184,255); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text(trChar(baslik), 14, 13);
  doc.setTextColor(136,146,170); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text("Tarih: " + tarih, 250, 13);
  let y = 26;
  tablolar.forEach(({ altBaslik, kolonlar, satirlar, notlar }) => {
    if (altBaslik) {
      doc.setTextColor(62,207,142); doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(trChar(altBaslik), 14, y); y += 5;
    }
    doc.autoTable({
      startY: y,
      head: [kolonlar.map(trChar)],
      body: satirlar.map(satir => satir.map(trChar)),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, textColor: [40,40,40] },
      headStyles: { fillColor: [31,37,53], textColor: [124,184,255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245,247,250] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
    if (notlar) {
      doc.setTextColor(100,100,100); doc.setFontSize(8);
      doc.text(trChar(notlar), 14, y); y += 8;
    }
  });
  if (altBilgi) {
    doc.setTextColor(150,150,150); doc.setFontSize(7);
    doc.text(trChar(altBilgi), 14, doc.internal.pageSize.height - 8);
  }
  doc.save(dosyaAdi);
}

function IndirButonlari({ onCSV, onPDF, yukleniyor }) {
  return (
    <div style={{display:"flex",gap:6}}>
      <button className="btn btn-ghost btn-sm" onClick={onCSV}
        style={{fontSize:11,padding:"5px 10px",color:"var(--green)",borderColor:"rgba(62,207,142,.3)"}}>
        ⬇ CSV
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onPDF} disabled={yukleniyor}
        style={{fontSize:11,padding:"5px 10px",color:"var(--accent2)",borderColor:"rgba(79,142,247,.3)"}}>
        {yukleniyor ? "⏳ Hazırlanıyor..." : "⬇ PDF"}
      </button>
    </div>
  );
}

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────────
function useLocalState(anahtar, varsayilan) {
  const [deger, setDeger] = useState(() => {
    try {
      const kayitli = localStorage.getItem(anahtar);
      return kayitli ? JSON.parse(kayitli) : varsayilan;
    } catch { return varsayilan; }
  });
  const guncelle = useCallback((yeni) => {
    setDeger(onceki => {
      const sonDeger = typeof yeni === "function" ? yeni(onceki) : yeni;
      try { localStorage.setItem(anahtar, JSON.stringify(sonDeger)); } catch {}
      return sonDeger;
    });
  }, [anahtar]);
  return [deger, guncelle];
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0f1117;
    --surface:   #181c27;
    --surface2:  #1f2535;
    --border:    #2a3145;
    --border2:   #3a4560;
    --accent:    #4f8ef7;
    --accent2:   #7cb8ff;
    --green:     #3ecf8e;
    --amber:     #f0b429;
    --red:       #f55;
    --text:      #e8eaf0;
    --muted:     #8892aa;
    --faint:     #3a4560;
    --mono:      'IBM Plex Mono', monospace;
    --sans:      'IBM Plex Sans', sans-serif;
    --radius:    8px;
    --radius-lg: 14px;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  /* LAYOUT */
  .app { display: flex; flex-direction: column; min-height: 100vh; }
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px; background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-brand { display: flex; align-items: center; gap: 10px; }
  .topbar-logo {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--green));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 13px; font-weight: 500; color: #fff;
  }
  .topbar-title { font-size: 14px; font-weight: 600; letter-spacing: .02em; }
  .topbar-sub { font-size: 11px; color: var(--muted); font-family: var(--mono); }
  .topbar-badge {
    font-size: 10px; font-family: var(--mono); padding: 3px 8px;
    background: rgba(79,142,247,.15); color: var(--accent2);
    border: 1px solid rgba(79,142,247,.3); border-radius: 20px;
  }

  /* TABS */
  .tabs-bar {
    display: flex; gap: 2px; padding: 10px 28px 0;
    background: var(--surface); border-bottom: 1px solid var(--border);
    overflow-x: auto; scrollbar-width: none;
  }
  .tabs-bar::-webkit-scrollbar { display: none; }
  .tab-btn {
    padding: 8px 16px; border: none; background: transparent;
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent;
    transition: all .18s; white-space: nowrap; border-radius: 6px 6px 0 0;
  }
  .tab-btn:hover { color: var(--text); background: var(--surface2); }
  .tab-btn.active { color: var(--accent2); border-bottom-color: var(--accent); background: var(--surface2); }
  .tab-btn .tab-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; border-radius: 50%;
    font-size: 9px; font-family: var(--mono);
    background: var(--faint); margin-right: 5px;
  }
  .tab-btn.active .tab-num { background: rgba(79,142,247,.25); color: var(--accent2); }
  .tab-btn.locked { opacity: .35; cursor: not-allowed; }

  /* MAIN CONTENT */
  .main { flex: 1; padding: 28px; max-width: 1100px; margin: 0 auto; width: 100%; }
  .section-header { margin-bottom: 24px; }
  .section-title { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .section-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }

  /* KART */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 20px 22px; margin-bottom: 16px;
  }
  .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--muted); margin-bottom: 14px; }

  /* FORM */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 11px; color: var(--muted); font-family: var(--mono); }
  .form-input, .form-select {
    background: var(--surface2); border: 1px solid var(--border2);
    border-radius: var(--radius); padding: 9px 12px;
    font-family: var(--mono); font-size: 13px; color: var(--text);
    outline: none; transition: border .15s;
  }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-select option { background: var(--surface2); }

  /* BUTON */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: var(--radius);
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all .15s; border: none;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #6fa3f9; }
  .btn-ghost {
    background: transparent; color: var(--muted);
    border: 1px solid var(--border2);
  }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-danger { background: rgba(255,85,85,.12); color: var(--red); border: 1px solid rgba(255,85,85,.2); }
  .btn-danger:hover { background: rgba(255,85,85,.2); }
  .btn-sm { padding: 5px 11px; font-size: 11px; }

  /* TABLO */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th {
    text-align: left; padding: 8px 12px;
    font-size: 10px; text-transform: uppercase; letter-spacing: .07em;
    color: var(--muted); border-bottom: 1px solid var(--border);
    font-family: var(--mono); font-weight: 500;
  }
  td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }

  /* BADGE */
  .badge {
    display: inline-flex; align-items: center; padding: 2px 8px;
    border-radius: 20px; font-size: 10px; font-family: var(--mono); font-weight: 500;
  }
  .badge-sabit    { background: rgba(79,142,247,.15); color: var(--accent2); }
  .badge-degisken { background: rgba(62,207,142,.15); color: var(--green); }
  .badge-karma    { background: rgba(240,180,41,.15);  color: var(--amber); }
  .badge-direkt   { background: rgba(79,142,247,.12); color: #a5c8ff; border: 1px solid rgba(79,142,247,.2); }
  .badge-endirekt { background: rgba(240,180,41,.12); color: var(--amber); border: 1px solid rgba(240,180,41,.2); }

  /* ÖZET KARTLARI */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 16px;
  }
  .stat-label { font-size: 10px; color: var(--muted); font-family: var(--mono); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .stat-value { font-size: 20px; font-weight: 600; font-family: var(--mono); }
  .stat-value.blue   { color: var(--accent2); }
  .stat-value.green  { color: var(--green); }
  .stat-value.amber  { color: var(--amber); }
  .stat-value.red    { color: var(--red); }

  /* HESAP KODU BADGE */
  .hesap-kodu {
    font-family: var(--mono); font-size: 11px; padding: 2px 7px;
    background: var(--faint); border-radius: 4px; color: var(--muted);
  }

  /* BÖLÜCÜ */
  .divider { height: 1px; background: var(--border); margin: 18px 0; }

  /* DERS PANELI */
  .lesson-box {
    background: rgba(79,142,247,.06); border: 1px solid rgba(79,142,247,.2);
    border-radius: var(--radius-lg); padding: 18px 20px; margin-bottom: 20px;
  }
  .lesson-box h4 { font-size: 12px; color: var(--accent2); font-family: var(--mono); margin-bottom: 10px; text-transform: uppercase; letter-spacing: .08em; }
  .lesson-box p  { font-size: 13px; color: var(--muted); line-height: 1.7; }
  .lesson-box p + p { margin-top: 8px; }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 48px 20px; color: var(--muted); }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }
  .empty p { font-size: 13px; }

  /* PROGRESS BAR */
  .progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .progress-label { font-size: 11px; color: var(--muted); min-width: 100px; font-family: var(--mono); }
  .progress-track { flex: 1; height: 6px; background: var(--faint); border-radius: 3px; overflow: hidden; }
  .progress-fill  { height: 100%; border-radius: 3px; transition: width .4s; }

  /* TOOLTIP */
  .tooltip-wrap { position: relative; display: inline-flex; }
  .tooltip {
    position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
    background: #1a2035; border: 1px solid var(--border2);
    border-radius: 6px; padding: 6px 10px; font-size: 11px; color: var(--text);
    white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s;
    z-index: 100;
  }
  .tooltip-wrap:hover .tooltip { opacity: 1; }

  /* ANIMASYON */
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .fade-in { animation: fadeIn .25s ease forwards; }

  /* RESPONSIVE */
  @media(max-width:640px) {
    .form-grid { grid-template-columns: 1fr; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .main { padding: 16px; }
  }
`;

// ─── SABITLER ────────────────────────────────────────────────────────────────
const HESAP_KODLARI = {
  "710": "Direkt İlk Madde ve Malzeme",
  "720": "Direkt İşçilik",
  "730": "Genel Üretim Giderleri",
  "740": "Hizmet Üretim Maliyeti",
  "750": "Araştırma ve Geliştirme",
  "760": "Pazarlama/Satış Giderleri",
  "770": "Genel Yönetim Giderleri",
  "780": "Finansman Giderleri",
};

const DAVRANIS_TIPLERI = ["Sabit", "Değişken", "Karma"];
const YÜKLEME_TIPLERI  = ["Direkt", "Endirekt"];

const SEKTÖR_ÖRNEKLER = {
  "710": ["Hammadde (çelik, ahşap, kumaş)", "Ambalaj malzemesi", "Yardımcı malzeme"],
  "720": ["Üretim işçisi maaşı", "Fazla mesai ücreti", "İşçi sosyal hakları (SGK)"],
  "730": ["Fabrika kirası", "Makine amortismanı", "Enerji (elektrik/doğalgaz)", "Fabrika müdürü maaşı"],
  "760": ["Reklam gideri", "Satış komisyonu", "Depo kira bedeli"],
  "770": ["Yönetici maaşı", "Ofis kirası", "Muhasebe yazılımı"],
};

const formatTL = (n) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);

// ─── ANA BİLEŞEN ─────────────────────────────────────────────────────────────
export default function MaliyetApp() {
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { label: "Gider Sınıflandırma", emoji: "📋", unlocked: true },
    { label: "GÜG Dağıtım",         emoji: "🔀", unlocked: true },
    { label: "Sipariş Maliyeti",    emoji: "📦", unlocked: true },
    { label: "Safha Maliyeti",      emoji: "🏭", unlocked: true },
    { label: "Standart & Sapma",    emoji: "📐", unlocked: true },
    { label: "CVP Analizi",         emoji: "📈", unlocked: true },
    { label: "Bütçe Kontrolü",      emoji: "🎯", unlocked: true },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="topbar-logo">MM</div>
            <div>
              <div className="topbar-title">Maliyet Muhasebesi</div>
              <div className="topbar-sub">Uzmanlaşma Programı v1.0</div>
            </div>
          </div>
          <span className="topbar-badge">✓ Tüm Modüller</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{fontSize:10,color:"var(--red)",borderColor:"rgba(255,85,85,.2)",marginLeft:8}}
            onClick={()=>{
              if(window.confirm("Tüm veriler sıfırlanacak. Emin misiniz?")) {
                ["mm_giderler","mm_merkezler","mm_gugGiderler","mm_isEmirleri","mm_tahGug","mm_tahSaat","mm_stdUrunler","mm_cvpUrunler","mm_cvpSabit","mm_cvpSecili","mm_butce","mm_safhalar"].forEach(k=>localStorage.removeItem(k));
                window.location.reload();
              }
            }}>
            ↺ Sıfırla
          </button>
        </header>

        {/* TABS */}
        <nav className="tabs-bar">
          {TABS.map((t, i) => (
            <button
              key={i}
              className={`tab-btn ${activeTab === i ? "active" : ""} ${!t.unlocked ? "locked" : ""}`}
              onClick={() => t.unlocked && setActiveTab(i)}
              title={!t.unlocked ? "Bu modülü açmak için önceki aşamayı tamamlayın" : ""}
            >
              <span className="tab-num">{i + 1}</span>
              {t.emoji} {t.label}
            </button>
          ))}
        </nav>

        {/* MODÜL 1 */}
        <main className="main">
          {activeTab === 0 && <ModulGiderSiniflandirma />}
          {activeTab === 1 && <ModulGUGDagitim />}
          {activeTab === 2 && <ModulSiparisUretim />}
          {activeTab === 3 && <ModulSafhaMaliyet />}
          {activeTab === 4 && <ModulStandartMaliyet />}
          {activeTab === 5 && <ModulCVP />}
          {activeTab === 6 && <ModulButceKontrol />}
        </main>
      </div>
    </>
  );
}

// ─── MODÜL 1: GİDER SINIFLANDIRMA ────────────────────────────────────────────
function ModulGiderSiniflandirma() {
  const [giderler, setGiderler] = useLocalState("mm_giderler", [
    { id: 1, ad: "Çelik sac hammadde", hesapKodu: "710", tutar: 45000, davranis: "Değişken", yukleme: "Direkt",   not: "Ocak üretim partisi" },
    { id: 2, ad: "Fabrika kirası",      hesapKodu: "730", tutar: 18000, davranis: "Sabit",    yukleme: "Endirekt", not: "Aylık sabit kira" },
    { id: 3, ad: "Üretim işçisi maaşı", hesapKodu: "720", tutar: 32000, davranis: "Sabit",    yukleme: "Direkt",   not: "4 işçi × 8.000 TL" },
  ]);

  const [form, setForm] = useState({
    ad: "", hesapKodu: "710", tutar: "", davranis: "Değişken", yukleme: "Direkt", not: ""
  });
  const [hata, setHata]   = useState("");
  const [eklendi, setEklendi] = useState(false);
  const [duzenleId, setDuzenleId]     = useState(null);
  const [duzenleForm, setDuzenleForm] = useState(null);

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const duzenleBasla = (g) => { setDuzenleId(g.id); setDuzenleForm({...g}); };
  const duzenleIptal = () => { setDuzenleId(null); setDuzenleForm(null); };
  const duzenleKaydet = () => {
    if (!duzenleForm.ad.trim()) { setHata("Gider adı boş bırakılamaz."); return; }
    if (!duzenleForm.tutar || isNaN(+duzenleForm.tutar) || +duzenleForm.tutar <= 0) { setHata("Geçerli bir tutar girin."); return; }
    setHata("");
    setGiderler(gs => gs.map(g => g.id === duzenleId ? {...duzenleForm, tutar: +duzenleForm.tutar} : g));
    setDuzenleId(null); setDuzenleForm(null);
  };

  const ekle = () => {
    if (!form.ad.trim())       { setHata("Gider adı boş bırakılamaz."); return; }
    if (!form.tutar || isNaN(+form.tutar) || +form.tutar <= 0) {
      setHata("Geçerli bir tutar girin."); return;
    }
    setHata("");
    setGiderler(g => [...g, { ...form, id: Date.now(), tutar: +form.tutar }]);
    setForm({ ad: "", hesapKodu: "710", tutar: "", davranis: "Değişken", yukleme: "Direkt", not: "" });
    setEklendi(true);
    setTimeout(() => setEklendi(false), 2000);
  };

  const sil = (id) => setGiderler(g => g.filter(x => x.id !== id));

  // İSTATİSTİKLER
  const toplam     = giderler.reduce((s, g) => s + g.tutar, 0);
  const sabit      = giderler.filter(g => g.davranis === "Sabit").reduce((s, g) => s + g.tutar, 0);
  const degisken   = giderler.filter(g => g.davranis === "Değişken").reduce((s, g) => s + g.tutar, 0);
  const direkt710  = giderler.filter(g => g.hesapKodu === "710" || g.hesapKodu === "720").reduce((s, g) => s + g.tutar, 0);
  const gup730     = giderler.filter(g => g.hesapKodu === "730").reduce((s, g) => s + g.tutar, 0);

  const hesapGruplari = Object.entries(
    giderler.reduce((acc, g) => {
      acc[g.hesapKodu] = (acc[g.hesapKodu] || 0) + g.tutar;
      return acc;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">📋 Gider Sınıflandırma Modülü</div>
        <div className="section-desc">
          İşletmenizin tüm giderlerini TDH hesap kodlarına, davranış biçimine ve mamule
          yüklenme şekline göre sınıflandırın. Temel ilke: <em>her giderin bir kimliği vardır.</em>
        </div>
      </div>

      {/* DERS KUTUSU */}
      <div className="lesson-box">
        <h4>⚡ Aşama 1 — Temel Kural</h4>
        <p>
          <strong style={{color:"var(--text)"}}>Davranış</strong> sorusu: "Üretim dursa bu gider devam eder mi?"
          → Evet ise <span style={{color:"var(--accent2)"}}>Sabit</span>,
          Hayır ise <span style={{color:"var(--green)"}}>Değişken</span>.
        </p>
        <p>
          <strong style={{color:"var(--text)"}}>Yükleme</strong> sorusu: "Bu gider hangi ürüne ait olduğu belli mi?"
          → Evet ise <span style={{color:"#a5c8ff"}}>Direkt</span> (710/720),
          Hayır ise <span style={{color:"var(--amber)"}}>Endirekt</span> → 730 hesabına alınır, sonra dağıtılır.
        </p>
      </div>

      {/* ÖZET İSTATİSTİKLER */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Toplam Gider</div>
          <div className="stat-value blue">{formatTL(toplam)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sabit Gider</div>
          <div className="stat-value amber">{formatTL(sabit)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Değişken Gider</div>
          <div className="stat-value green">{formatTL(degisken)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">710+720 (Direkt)</div>
          <div className="stat-value blue">{formatTL(direkt710)}</div>
        </div>
      </div>

      {/* HESAP KODU DAĞILIMI */}
      <div className="card">
        <div className="card-title">Hesap Kodu Dağılımı</div>
        {hesapGruplari.map(([kod, tutar]) => {
          const oran = toplam > 0 ? (tutar / toplam) * 100 : 0;
          const renk = kod === "710" ? "var(--green)" : kod === "720" ? "var(--accent2)" : kod === "730" ? "var(--amber)" : "var(--muted)";
          return (
            <div key={kod} className="progress-row">
              <div className="progress-label">
                <span className="hesap-kodu">{kod}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${oran}%`, background: renk }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--muted)", minWidth: 90, textAlign: "right" }}>
                {formatTL(tutar)} <span style={{opacity:.5}}>%{oran.toFixed(0)}</span>
              </div>
            </div>
          );
        })}
        {hesapGruplari.length === 0 && <p style={{fontSize:12,color:"var(--muted)"}}>Henüz gider girilmedi.</p>}
      </div>

      {/* GİDER EKLEME FORMU */}
      <div className="card">
        <div className="card-title">Yeni Gider Ekle</div>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:"1/-1"}}>
            <label className="form-label">Gider Adı *</label>
            <input
              className="form-input" placeholder="Örn: Elektrik gideri, Hammadde, İşçilik..."
              value={form.ad} onChange={e => handleChange("ad", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">TDH Hesap Kodu *</label>
            <select className="form-select" value={form.hesapKodu} onChange={e => handleChange("hesapKodu", e.target.value)}>
              {Object.entries(HESAP_KODLARI).map(([k, v]) => (
                <option key={k} value={k}>{k} — {v}</option>
              ))}
            </select>
            {SEKTÖR_ÖRNEKLER[form.hesapKodu] && (
              <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>
                Örn: {SEKTÖR_ÖRNEKLER[form.hesapKodu].join(", ")}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Tutar (TL) *</label>
            <input
              className="form-input" type="number" placeholder="0.00"
              value={form.tutar} onChange={e => handleChange("tutar", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Davranış Biçimi</label>
            <select className="form-select" value={form.davranis} onChange={e => handleChange("davranis", e.target.value)}>
              {DAVRANIS_TIPLERI.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mamule Yükleme</label>
            <select className="form-select" value={form.yukleme} onChange={e => handleChange("yukleme", e.target.value)}>
              {YÜKLEME_TIPLERI.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:"1/-1"}}>
            <label className="form-label">Not / Açıklama</label>
            <input
              className="form-input" placeholder="İsteğe bağlı açıklama"
              value={form.not} onChange={e => handleChange("not", e.target.value)}
            />
          </div>
        </div>

        {hata && (
          <div style={{fontSize:12,color:"var(--red)",marginTop:10,padding:"8px 12px",background:"rgba(255,85,85,.08)",borderRadius:6}}>
            ⚠ {hata}
          </div>
        )}

        <div style={{display:"flex",gap:8,marginTop:14}}>
          <button className="btn btn-primary" onClick={ekle}>
            {eklendi ? "✓ Eklendi" : "+ Gider Ekle"}
          </button>
          <button className="btn btn-ghost" onClick={() =>
            setForm({ ad:"", hesapKodu:"710", tutar:"", davranis:"Değişken", yukleme:"Direkt", not:"" })
          }>
            Temizle
          </button>
        </div>
      </div>

      {/* GİDER LİSTESİ */}
      <div className="card">
        <div className="card-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Gider Listesi <span style={{fontWeight:400,color:"var(--muted)"}}>{giderler.length} kayıt</span></span>
          <IndirButonlari
            onCSV={()=>{
              const bas = ["Gider Adı","Hesap Kodu","Hesap Adı","Tutar (TL)","Davranış","Yükleme","Not"];
              const sat = giderler.map(g=>[g.ad, g.hesapKodu, HESAP_KODLARI[g.hesapKodu]||"", g.tutar, g.davranis, g.yukleme, g.not||""]);
              csvIndir(sat, bas, `gider-siniflandirma-${new Date().toISOString().slice(0,10)}.csv`);
            }}
            onPDF={async()=>{
              await pdfIndir(
                "Gider Sınıflandırma Raporu",
                [{
                  altBaslik: "Gider Listesi",
                  kolonlar: ["Gider Adı","Hesap Kodu","Tutar (TL)","Davranış","Yükleme","Not"],
                  satirlar: giderler.map(g=>[g.ad, g.hesapKodu+" - "+(HESAP_KODLARI[g.hesapKodu]||""), g.tutar.toLocaleString("tr-TR")+" TL", g.davranis, g.yukleme, g.not||"-"]),
                  notlar: `Toplam: ${toplam.toLocaleString("tr-TR")} TL  |  Sabit: ${sabit.toLocaleString("tr-TR")} TL  |  Değişken: ${degisken.toLocaleString("tr-TR")} TL`
                }],
                `gider-siniflandirma-${new Date().toISOString().slice(0,10)}.pdf`,
                "Maliyet Muhasebesi Uzmanlaşma Programı"
              );
            }}
          />
        </div>
        {giderler.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>Henüz gider eklenmedi.<br/>Yukarıdaki formu kullanarak başlayın.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Gider Adı</th>
                  <th>Hesap Kodu</th>
                  <th>Tutar (TL)</th>
                  <th>Davranış</th>
                  <th>Yükleme</th>
                  <th>Not</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {giderler.map(g => {
                  if (duzenleId === g.id && duzenleForm) {
                    const inpStyle = {background:"var(--surface2)",border:"1px solid var(--accent)",borderRadius:4,padding:"4px 7px",fontFamily:"var(--mono)",fontSize:12,color:"var(--text)",outline:"none",width:"100%"};
                    const selStyle = {...inpStyle, width:"auto"};
                    return (
                      <tr key={g.id} style={{background:"rgba(79,142,247,.05)"}}>
                        <td><input style={inpStyle} value={duzenleForm.ad} onChange={e=>setDuzenleForm(f=>({...f,ad:e.target.value}))}/></td>
                        <td>
                          <select style={selStyle} value={duzenleForm.hesapKodu} onChange={e=>setDuzenleForm(f=>({...f,hesapKodu:e.target.value}))}>
                            {Object.entries(HESAP_KODLARI).map(([k,v])=><option key={k} value={k}>{k} — {v}</option>)}
                          </select>
                        </td>
                        <td><input type="number" style={{...inpStyle,width:100}} value={duzenleForm.tutar} onChange={e=>setDuzenleForm(f=>({...f,tutar:e.target.value}))}/></td>
                        <td>
                          <select style={selStyle} value={duzenleForm.davranis} onChange={e=>setDuzenleForm(f=>({...f,davranis:e.target.value}))}>
                            {DAVRANIS_TIPLERI.map(t=><option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td>
                          <select style={selStyle} value={duzenleForm.yukleme} onChange={e=>setDuzenleForm(f=>({...f,yukleme:e.target.value}))}>
                            {YÜKLEME_TIPLERI.map(t=><option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td><input style={inpStyle} value={duzenleForm.not} onChange={e=>setDuzenleForm(f=>({...f,not:e.target.value}))}/></td>
                        <td>
                          <div style={{display:"flex",gap:4}}>
                            <button className="btn btn-primary btn-sm" onClick={duzenleKaydet}>✓</button>
                            <button className="btn btn-ghost btn-sm" onClick={duzenleIptal}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={g.id}>
                      <td style={{fontWeight:500}}>{g.ad}</td>
                      <td>
                        <span className="hesap-kodu">{g.hesapKodu}</span>{" "}
                        <span style={{fontSize:10,color:"var(--muted)"}}>{HESAP_KODLARI[g.hesapKodu]}</span>
                      </td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--text)"}}>{formatTL(g.tutar)}</td>
                      <td>
                        <span className={`badge badge-${g.davranis==="Sabit"?"sabit":g.davranis==="Değişken"?"degisken":"karma"}`}>
                          {g.davranis}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${g.yukleme==="Direkt"?"direkt":"endirekt"}`}>
                          {g.yukleme}
                        </span>
                      </td>
                      <td style={{fontSize:11,color:"var(--muted)"}}>{g.not || "—"}</td>
                      <td>
                        <div style={{display:"flex",gap:4}}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>duzenleBasla(g)}>✏</button>
                          <button className="btn btn-ghost btn-sm btn-danger" onClick={()=>sil(g.id)}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ÖZET KUTUSU */}
      {giderler.length > 0 && (
        <div className="card" style={{borderColor:"rgba(62,207,142,.25)"}}>
          <div className="card-title" style={{color:"var(--green)"}}>Üretim Maliyeti Özeti (TDH)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              { kod:"710", label:"Direkt İlk Madde", renk:"var(--green)" },
              { kod:"720", label:"Direkt İşçilik",   renk:"var(--accent2)" },
              { kod:"730", label:"Genel Üretim (GÜG)", renk:"var(--amber)" },
            ].map(({ kod, label, renk }) => {
              const tutar = giderler.filter(g => g.hesapKodu === kod).reduce((s, g) => s + g.tutar, 0);
              return (
                <div key={kod} style={{textAlign:"center",padding:"12px",background:"var(--surface2)",borderRadius:8}}>
                  <div style={{fontSize:10,color:"var(--muted)",marginBottom:6,fontFamily:"var(--mono)"}}>{label}</div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:"var(--mono)",color:renk}}>{formatTL(tutar)}</div>
                </div>
              );
            })}
          </div>
          <div className="divider"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:"var(--muted)"}}>Toplam Üretim Maliyeti (710+720+730)</span>
            <span style={{fontSize:20,fontWeight:600,fontFamily:"var(--mono)",color:"var(--green)"}}>
              {formatTL(giderler.filter(g=>["710","720","730"].includes(g.hesapKodu)).reduce((s,g)=>s+g.tutar,0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODÜL 2: GÜG DAĞITIM TABLOSU ───────────────────────────────────────────
const ANAHTARLAR = ["Metrekare (m²)", "Makine Saati", "İşçi Sayısı", "Direkt İşçilik Saati", "Güç (kW)", "Eşit Dağıtım"];

const VARSAYILAN_MERKEZLER = [
  { id: 1, ad: "Döküm",        tip: "Üretim",   degerler: { "Metrekare (m²)": 400, "Makine Saati": 1200, "İşçi Sayısı": 8,  "Direkt İşçilik Saati": 960,  "Güç (kW)": 180, "Eşit Dağıtım": 1 } },
  { id: 2, ad: "Montaj",       tip: "Üretim",   degerler: { "Metrekare (m²)": 300, "Makine Saati": 800,  "İşçi Sayısı": 12, "Direkt İşçilik Saati": 1440, "Güç (kW)": 90,  "Eşit Dağıtım": 1 } },
  { id: 3, ad: "Boyahane",     tip: "Üretim",   degerler: { "Metrekare (m²)": 200, "Makine Saati": 600,  "İşçi Sayısı": 5,  "Direkt İşçilik Saati": 600,  "Güç (kW)": 120, "Eşit Dağıtım": 1 } },
  { id: 4, ad: "Bakım-Onarım", tip: "Yardımcı", degerler: { "Metrekare (m²)": 80,  "Makine Saati": 0,    "İşçi Sayısı": 3,  "Direkt İşçilik Saati": 360,  "Güç (kW)": 20,  "Eşit Dağıtım": 1 } },
  { id: 5, ad: "Yemekhane",    tip: "Yardımcı", degerler: { "Metrekare (m²)": 120, "Makine Saati": 0,    "İşçi Sayısı": 28, "Direkt İşçilik Saati": 0,    "Güç (kW)": 30,  "Eşit Dağıtım": 1 } },
];

const VARSAYILAN_GUGGERLER = [
  { id: 1, ad: "Fabrika kirası",        tutar: 60000, anahtar: "Metrekare (m²)" },
  { id: 2, ad: "Elektrik gideri",       tutar: 24000, anahtar: "Güç (kW)" },
  { id: 3, ad: "Bakım gideri",          tutar: 18000, anahtar: "Makine Saati" },
  { id: 4, ad: "Fabrika müdürü maaşı",  tutar: 35000, anahtar: "Eşit Dağıtım" },
  { id: 5, ad: "Amortismanlar",         tutar: 42000, anahtar: "Makine Saati" },
];

function ModulGUGDagitim() {
  const [merkezler, setMerkezler] = useLocalState("mm_merkezler", VARSAYILAN_MERKEZLER);
  // Modül 1'deki 730 giderlerini oku
  const [tumGiderler] = useLocalState("mm_giderler", []);
  const gider730 = tumGiderler.filter(g => g.hesapKodu === "730");

  // Anahtar seçimlerini ayrı sakla: { [gider.id]: anahtar }
  const [anahtarlar, setAnahtarlar] = useLocalState("mm_gugAnahtarlar", {});

  // Birleştirilmiş GÜG gider listesi — tutar Modül 1'den, anahtar buradan
  const gugGiderler = gider730.map(g => ({
    id: g.id,
    ad: g.ad,
    tutar: g.tutar,
    anahtar: anahtarlar[g.id] || ANAHTARLAR[0],
  }));

  const anahtarGuncelle = (id, anahtar) => {
    setAnahtarlar(a => ({ ...a, [id]: anahtar }));
  };

  const [yeniMerkez, setYeniMerkez] = useState({ ad: "", tip: "Üretim" });
  const [aktifAdim, setAktifAdim] = useState(1);
  const [hata, setHata] = useState("");

  const onDagitim = merkezler.map(merkez => {
    let toplam = 0;
    gugGiderler.forEach(g => {
      const toplamAnahtar = merkezler.reduce((s, m) => s + (m.degerler[g.anahtar] || 0), 0);
      const pay = toplamAnahtar > 0 ? (merkez.degerler[g.anahtar] || 0) / toplamAnahtar : 0;
      toplam += g.tutar * pay;
    });
    return { ...merkez, onDagitimToplam: toplam };
  });

  const kesinDagitim = () => {
    const uretimMerkezleri = onDagitim.filter(m => m.tip === "Üretim");
    const yardimciMerkezleri = onDagitim.filter(m => m.tip === "Yardımcı");
    const toplamIsci = uretimMerkezleri.reduce((s, m) => s + (m.degerler["İşçi Sayısı"] || 0), 0);
    return uretimMerkezleri.map(um => {
      const pay = toplamIsci > 0 ? (um.degerler["İşçi Sayısı"] || 0) / toplamIsci : 0;
      const yardimciPay = yardimciMerkezleri.reduce((s, ym) => s + ym.onDagitimToplam * pay, 0);
      return { ...um, yardimciPay, kesinToplam: um.onDagitimToplam + yardimciPay };
    });
  };

  const kesinSonuc = kesinDagitim();
  const toplamGUG = gugGiderler.reduce((s, g) => s + g.tutar, 0);

  const merkezEkle = () => {
    if (!yeniMerkez.ad.trim()) { setHata("Merkez adı boş olamaz."); return; }
    setHata("");
    const degerler = {};
    ANAHTARLAR.forEach(a => degerler[a] = 0);
    setMerkezler(m => [...m, { ...yeniMerkez, id: Date.now(), degerler }]);
    setYeniMerkez({ ad: "", tip: "Üretim" });
  };

  const merkezdegerGuncelle = (id, anahtar, deger) => {
    setMerkezler(ms => ms.map(m => m.id === id ? { ...m, degerler: { ...m.degerler, [anahtar]: +deger || 0 } } : m));
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">🔀 GÜG Dağıtım Tablosu</div>
        <div className="section-desc">
          730 hesabındaki endirekt giderleri önce maliyet merkezlerine (ön dağıtım), sonra yardımcı merkezlerden üretim merkezlerine (kesin dağıtım) aktarın.
        </div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Aşama 2 — İki Aşamalı Dağıtım</h4>
        <p><strong style={{color:"var(--text)"}}>Ön dağıtım:</strong> Her GÜG kalemi için en anlamlı dağıtım anahtarını seç ve tüm merkezlere dağıt.</p>
        <p><strong style={{color:"var(--text)"}}>Kesin dağıtım:</strong> Yardımcı merkezlerdeki payları üretim merkezlerine aktar. Sonuçta <span style={{color:"var(--green)"}}>sadece üretim merkezlerinde GÜG kalır</span>.</p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[{n:1,label:"1. Ön Dağıtım"},{n:2,label:"2. Kesin Dağıtım"},{n:3,label:"3. Anahtarlar"}].map(({n,label}) => (
          <button key={n} className={`btn ${aktifAdim===n ? "btn-primary" : "btn-ghost"}`} onClick={() => setAktifAdim(n)}>{label}</button>
        ))}
        <div style={{marginLeft:"auto"}}>
          <IndirButonlari
            onCSV={()=>{
              const bas = ["Gider Kalemi","Tutar (TL)","Dağıtım Anahtarı",...merkezler.map(m=>m.ad+" ("+m.tip+")")];
              const sat = gugGiderler.map(g=>{
                const toplamA = merkezler.reduce((s,m)=>s+(m.degerler[g.anahtar]||0),0);
                return [g.ad, g.tutar, g.anahtar, ...merkezler.map(m=>{
                  const pay = toplamA>0?(m.degerler[g.anahtar]||0)/toplamA:0;
                  return (g.tutar*pay).toFixed(2);
                })];
              });
              csvIndir(sat, bas, `gug-dagitim-${new Date().toISOString().slice(0,10)}.csv`);
            }}
            onPDF={async()=>{
              const onDagBas = ["GÜG Kalemi","Tutar (TL)","Anahtar",...merkezler.map(m=>m.ad)];
              const onDagSat = gugGiderler.map(g=>{
                const toplamA = merkezler.reduce((s,m)=>s+(m.degerler[g.anahtar]||0),0);
                return [g.ad, g.tutar.toLocaleString("tr-TR")+" TL", g.anahtar, ...merkezler.map(m=>{
                  const pay = toplamA>0?(m.degerler[g.anahtar]||0)/toplamA:0;
                  return (g.tutar*pay).toLocaleString("tr-TR")+" TL";
                })];
              });
              const kesin = (() => {
                const um = onDagitim.filter(m=>m.tip==="Üretim");
                const ym = onDagitim.filter(m=>m.tip==="Yardımcı");
                const ti = um.reduce((s,m)=>s+(m.degerler["İşçi Sayısı"]||0),0);
                return um.map(u=>{
                  const pay = ti>0?(u.degerler["İşçi Sayısı"]||0)/ti:0;
                  const yp = ym.reduce((s,y)=>s+y.onDagitimToplam*pay,0);
                  return [u.ad, u.degerler["İşçi Sayısı"], (pay*100).toFixed(1)+"%", u.onDagitimToplam.toLocaleString("tr-TR")+" TL", "+"+yp.toLocaleString("tr-TR")+" TL", (u.onDagitimToplam+yp).toLocaleString("tr-TR")+" TL"];
                });
              })();
              await pdfIndir("GÜG Dağıtım Tablosu", [
                { altBaslik:"Ön Dağıtım", kolonlar: onDagBas, satirlar: onDagSat },
                { altBaslik:"Kesin Dağıtım", kolonlar:["Merkez","İşçi","Pay%","Ön Dağıtım","Yardımcı Pay","Kesin Toplam"], satirlar: kesin },
              ], `gug-dagitim-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
            }}
          />
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Toplam GÜG</div><div className="stat-value amber">{formatTL(toplamGUG)}</div></div>
        <div className="stat-card"><div className="stat-label">Gider Kalemi</div><div className="stat-value blue">{gugGiderler.length}</div></div>
        <div className="stat-card"><div className="stat-label">Üretim Merkezi</div><div className="stat-value green">{merkezler.filter(m=>m.tip==="Üretim").length}</div></div>
        <div className="stat-card"><div className="stat-label">Yardımcı Merkez</div><div className="stat-value amber">{merkezler.filter(m=>m.tip==="Yardımcı").length}</div></div>
      </div>

      {aktifAdim === 1 && (
        <div className="card">
          <div className="card-title">Ön Dağıtım Tablosu</div>
          {gugGiderler.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <p>Henüz 730 hesabında gider yok.<br/>Gider Sınıflandırma sekmesinden 730 kodlu gider ekleyin.</p>
            </div>
          ) : (
            <>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,padding:"8px 12px",background:"rgba(79,142,247,.06)",borderRadius:6,border:"1px solid rgba(79,142,247,.15)"}}>
                Giderler <strong style={{color:"var(--accent2)"}}>Gider Sınıflandırma</strong> sekmesindeki 730 hesabından otomatik geliyor. Burada sadece dağıtım anahtarını seçin.
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>GÜG Kalemi</th><th>Tutar</th><th>Dağıtım Anahtarı</th>
                      {merkezler.map(m => (
                        <th key={m.id} style={{color:m.tip==="Üretim"?"var(--green)":"var(--amber)"}}>
                          {m.ad}<div style={{fontSize:9,opacity:.6,fontWeight:400}}>{m.tip}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gugGiderler.map(g => {
                      const toplamAnahtar = merkezler.reduce((s,m)=>s+(m.degerler[g.anahtar]||0),0);
                      return (
                        <tr key={g.id}>
                          <td style={{fontWeight:500}}>{g.ad}</td>
                          <td style={{fontFamily:"var(--mono)",color:"var(--amber)"}}>{formatTL(g.tutar)}</td>
                          <td>
                            <select
                              style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:4,padding:"4px 8px",fontFamily:"var(--mono)",fontSize:11,color:"var(--text)",outline:"none"}}
                              value={g.anahtar}
                              onChange={e=>anahtarGuncelle(g.id, e.target.value)}>
                              {ANAHTARLAR.map(a=><option key={a}>{a}</option>)}
                            </select>
                          </td>
                          {merkezler.map(m => {
                            const pay = toplamAnahtar > 0 ? (m.degerler[g.anahtar]||0)/toplamAnahtar : 0;
                            const tutar = g.tutar * pay;
                            return (
                              <td key={m.id} style={{fontFamily:"var(--mono)",fontSize:12,color:m.tip==="Üretim"?"var(--text)":"var(--muted)"}}>
                                {tutar > 0 ? formatTL(tutar) : "—"}
                                {pay > 0 && <div style={{fontSize:9,color:"var(--muted)",opacity:.7}}>%{(pay*100).toFixed(0)}</div>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr style={{background:"var(--surface2)"}}>
                      <td style={{fontWeight:600,fontSize:12}}>TOPLAM</td>
                      <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--amber)"}}>{formatTL(toplamGUG)}</td>
                      <td></td>
                      {onDagitim.map(m => (
                        <td key={m.id} style={{fontFamily:"var(--mono)",fontWeight:600,color:m.tip==="Üretim"?"var(--green)":"var(--amber)"}}>{formatTL(m.onDagitimToplam)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {aktifAdim === 2 && (
        <div className="card">
          <div className="card-title">Kesin Dağıtım — Yardımcı → Üretim Merkezleri</div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:14,padding:"10px 14px",background:"rgba(240,180,41,.06)",borderRadius:8,border:"1px solid rgba(240,180,41,.15)"}}>
            Dağıtım anahtarı: <strong style={{color:"var(--amber)"}}>İşçi Sayısı</strong> — yardımcı merkezler işçi oranında üretim merkezlerine dağıtılır.
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Üretim Merkezi</th><th>İşçi Sayısı</th><th>Pay %</th><th>Ön Dağıtım</th><th>+ Yardımcı Pay</th><th>KESİN TOPLAM</th></tr>
              </thead>
              <tbody>
                {kesinSonuc.map(m => {
                  const toplamIsci = kesinSonuc.reduce((s,x)=>s+(x.degerler["İşçi Sayısı"]||0),0);
                  const pay = toplamIsci > 0 ? (m.degerler["İşçi Sayısı"]||0)/toplamIsci : 0;
                  return (
                    <tr key={m.id}>
                      <td style={{fontWeight:500}}>{m.ad}</td>
                      <td style={{fontFamily:"var(--mono)"}}>{m.degerler["İşçi Sayısı"]}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--muted)"}}>%{(pay*100).toFixed(1)}</td>
                      <td style={{fontFamily:"var(--mono)"}}>{formatTL(m.onDagitimToplam)}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--amber)"}}>+{formatTL(m.yardimciPay)}</td>
                      <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)",fontSize:14}}>{formatTL(m.kesinToplam)}</td>
                    </tr>
                  );
                })}
                <tr style={{background:"var(--surface2)"}}>
                  <td style={{fontWeight:600}}>TOPLAM</td><td></td><td></td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:600}}>{formatTL(toplamGUG)}</td>
                  <td style={{fontFamily:"var(--mono)",color:"var(--amber)",fontWeight:600}}>dağıtıldı</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)",fontSize:14}}>{formatTL(kesinSonuc.reduce((s,m)=>s+m.kesinToplam,0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="divider"/>
          <div className="card-title">Üretim Merkezi GÜG Dağılımı</div>
          {kesinSonuc.map(m => {
            const oran = toplamGUG > 0 ? (m.kesinToplam / toplamGUG) * 100 : 0;
            return (
              <div key={m.id} className="progress-row">
                <div className="progress-label" style={{minWidth:110}}>{m.ad}</div>
                <div className="progress-track"><div className="progress-fill" style={{width:`${oran}%`,background:"var(--green)"}}/></div>
                <div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",minWidth:120,textAlign:"right"}}>
                  {formatTL(m.kesinToplam)} <span style={{opacity:.5}}>%{oran.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aktifAdim === 3 && (
        <div className="card">
          <div className="card-title">Merkez Dağıtım Anahtarı Değerleri</div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Her maliyet merkezi için anahtarlara karşılık gelen değerleri girin.</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Maliyet Merkezi</th><th>Tür</th>
                  {ANAHTARLAR.map(a => <th key={a} style={{fontSize:9}}>{a}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {merkezler.map(m => (
                  <tr key={m.id}>
                    <td style={{fontWeight:500}}>{m.ad}</td>
                    <td><span className={`badge ${m.tip==="Üretim"?"badge-direkt":"badge-karma"}`}>{m.tip}</span></td>
                    {ANAHTARLAR.map(a => (
                      <td key={a}>
                        <input type="number"
                          style={{width:70,background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:4,padding:"4px 6px",fontFamily:"var(--mono)",fontSize:11,color:"var(--text)",outline:"none"}}
                          value={m.degerler[a]||0} onChange={e => merkezdegerGuncelle(m.id, a, e.target.value)}/>
                      </td>
                    ))}
                    <td>
                      <button className="btn btn-ghost btn-sm btn-danger"
                        onClick={()=>setMerkezler(ms=>ms.filter(x=>x.id!==m.id))}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divider"/>
          <div className="card-title">Yeni Maliyet Merkezi Ekle</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Merkez Adı</label>
              <input className="form-input" placeholder="Örn: Kesimhane" value={yeniMerkez.ad} onChange={e => setYeniMerkez(m=>({...m,ad:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Merkez Türü</label>
              <select className="form-select" value={yeniMerkez.tip} onChange={e => setYeniMerkez(m=>({...m,tip:e.target.value}))}>
                <option>Üretim</option><option>Yardımcı</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{marginTop:12}} onClick={merkezEkle}>+ Merkez Ekle</button>
        </div>
      )}
    </div>
  );
}

// ─── MODÜL 3: SİPARİŞ MALİYETİ ──────────────────────────────────────────────
const IS_EMIRLERI_VARSAYILAN = [
  {
    id: "IE-001", musteri: "Aysan Makine A.Ş.", urun: "Hidrolik Pres (5 adet)",
    acilis: "2024-01-05", durum: "Tamamlandı",
    malzeme: 48000, iscilik: 32000, iscilikSaati: 320, gugYuklenen: 0,
    satirlar: [
      { tip: "Malzeme", aciklama: "Çelik sac 3mm - 200kg", tutar: 28000 },
      { tip: "Malzeme", aciklama: "Bağlantı elemanları",  tutar: 8000  },
      { tip: "Malzeme", aciklama: "Hidrolik silindir",    tutar: 12000 },
      { tip: "İşçilik", aciklama: "Döküm - 160 saat",    tutar: 16000 },
      { tip: "İşçilik", aciklama: "Montaj - 160 saat",   tutar: 16000 },
    ]
  },
  {
    id: "IE-002", musteri: "Kartal İnşaat Ltd.", urun: "Çelik Konstrüksiyon",
    acilis: "2024-01-12", durum: "Devam Ediyor",
    malzeme: 72000, iscilik: 44000, iscilikSaati: 440, gugYuklenen: 0,
    satirlar: [
      { tip: "Malzeme", aciklama: "HEA 200 profil - 4ton", tutar: 52000 },
      { tip: "Malzeme", aciklama: "Kaynak sarf malzemesi",  tutar: 8000  },
      { tip: "Malzeme", aciklama: "Boya ve astar",          tutar: 12000 },
      { tip: "İşçilik", aciklama: "Kesim & kaynak",        tutar: 26000 },
      { tip: "İşçilik", aciklama: "Montaj sahasında",      tutar: 18000 },
    ]
  },
];

function ModulSiparisUretim() {
  const [isEmirleri, setIsEmirleri] = useLocalState("mm_isEmirleri", IS_EMIRLERI_VARSAYILAN);
  const [secili, setSecili] = useState(null);
  const [tahGuG, setTahGuG] = useLocalState("mm_tahGug", 179000);
  const [tahSaat, setTahSaat] = useLocalState("mm_tahSaat", 1800);
  const [yeniForm, setYeniForm] = useState({
    id: "", musteri: "", urun: "", acilis: new Date().toISOString().slice(0,10), durum: "Devam Ediyor",
    malzeme: "", iscilik: "", iscilikSaati: ""
  });
  const [yeniSatir, setYeniSatir] = useState({ tip: "Malzeme", aciklama: "", tutar: "" });
  const [panel, setPanel] = useState("liste"); // liste | detay | yeni
  const [hata, setHata] = useState("");

  const gugOrani = tahSaat > 0 ? tahGuG / tahSaat : 0;

  const emirlerHesapli = isEmirleri.map(e => ({
    ...e,
    gugYuklenen: e.iscilikSaati * gugOrani,
    toplamMaliyet: e.malzeme + e.iscilik + (e.iscilikSaati * gugOrani),
  }));

  const toplamMaliyet = emirlerHesapli.reduce((s, e) => s + e.toplamMaliyet, 0);
  const toplamMalzeme = emirlerHesapli.reduce((s, e) => s + e.malzeme, 0);
  const toplamIscilik = emirlerHesapli.reduce((s, e) => s + e.iscilik, 0);
  const toplamGUGYuk  = emirlerHesapli.reduce((s, e) => s + e.gugYuklenen, 0);

  const seciliEmirHesapli = secili ? emirlerHesapli.find(e => e.id === secili) : null;

  const isSil = (id) => { setIsEmirleri(e => e.filter(x => x.id !== id)); if (secili===id) { setSecili(null); setPanel("liste"); } };

  const satirEkle = () => {
    if (!secili || !yeniSatir.aciklama || !yeniSatir.tutar || +yeniSatir.tutar <= 0) { setHata("Açıklama ve tutar zorunludur."); return; }
    setHata("");
    setIsEmirleri(es => es.map(e => {
      if (e.id !== secili) return e;
      const tutar = +yeniSatir.tutar;
      return {
        ...e,
        satirlar: [...(e.satirlar||[]), { ...yeniSatir, tutar }],
        malzeme:  e.malzeme  + (yeniSatir.tip === "Malzeme" ? tutar : 0),
        iscilik:  e.iscilik  + (yeniSatir.tip === "İşçilik" ? tutar : 0),
        iscilikSaati: e.iscilikSaati + (yeniSatir.tip === "İşçilik" ? Math.round(tutar/100) : 0),
      };
    }));
    setYeniSatir({ tip: "Malzeme", aciklama: "", tutar: "" });
  };

  const yeniEmirEkle = () => {
    if (!yeniForm.id || !yeniForm.musteri || !yeniForm.urun) { setHata("İş emri no, müşteri ve ürün zorunludur."); return; }
    if (isEmirleri.find(e => e.id === yeniForm.id)) { setHata("Bu iş emri no zaten var."); return; }
    setHata("");
    setIsEmirleri(e => [...e, { ...yeniForm, malzeme:+yeniForm.malzeme||0, iscilik:+yeniForm.iscilik||0, iscilikSaati:+yeniForm.iscilikSaati||0, satirlar:[], gugYuklenen:0 }]);
    setYeniForm({ id:"", musteri:"", urun:"", acilis:new Date().toISOString().slice(0,10), durum:"Devam Ediyor", malzeme:"", iscilik:"", iscilikSaati:"" });
    setPanel("liste");
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">📦 Sipariş Maliyeti Yöntemi</div>
        <div className="section-desc">Her iş emrinin tam maliyetini izleyin: 710 Direkt Malzeme + 720 Direkt İşçilik + GÜG Yükleme.</div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Aşama 3 — GÜG Yükleme Oranı</h4>
        <p><strong style={{color:"var(--text)"}}>Formül:</strong> GÜG Yükleme Oranı = Tahmini Yıllık GÜG ÷ Tahmini Yıllık Direkt İşçilik Saati</p>
        <p>Her iş emrine → <span style={{color:"var(--amber)"}}>Fiili İşçilik Saati × Yükleme Oranı</span> kadar GÜG yüklenir. Dönem sonunda gerçek GÜG ile karşılaştırılır.</p>
      </div>

      {/* GÜG ORAN PANELİ */}
      <div className="card" style={{borderColor:"rgba(240,180,41,.25)"}}>
        <div className="card-title" style={{color:"var(--amber)"}}>GÜG Yükleme Oranı Ayarları</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tahmini Yıllık GÜG (TL)</label>
            <input className="form-input" type="number"
              value={tahGuG} onChange={e => setTahGuG(+e.target.value||0)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Tahmini Yıllık İşçilik Saati</label>
            <input className="form-input" type="number"
              value={tahSaat} onChange={e => setTahSaat(+e.target.value||0)}/>
          </div>
        </div>
        <div style={{marginTop:14,padding:"12px 16px",background:"var(--surface2)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:13,color:"var(--muted)"}}>GÜG Yükleme Oranı</span>
          <span style={{fontSize:22,fontWeight:700,fontFamily:"var(--mono)",color:"var(--amber)"}}>
            {formatTL(gugOrani)} <span style={{fontSize:12,color:"var(--muted)"}}>/saat</span>
          </span>
        </div>
      </div>

      {/* ÖZET */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Toplam Maliyet</div><div className="stat-value green">{formatTL(toplamMaliyet)}</div></div>
        <div className="stat-card"><div className="stat-label">710 Malzeme</div><div className="stat-value blue">{formatTL(toplamMalzeme)}</div></div>
        <div className="stat-card"><div className="stat-label">720 İşçilik</div><div className="stat-value blue">{formatTL(toplamIscilik)}</div></div>
        <div className="stat-card"><div className="stat-label">730 GÜG Yüklenen</div><div className="stat-value amber">{formatTL(toplamGUGYuk)}</div></div>
      </div>

      {/* NAV */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <button className={`btn ${panel==="liste"?"btn-primary":"btn-ghost"}`} onClick={()=>{setPanel("liste");setSecili(null);}}>İş Emirleri Listesi</button>
        <button className={`btn ${panel==="yeni"?"btn-primary":"btn-ghost"}`} onClick={()=>setPanel("yeni")}>+ Yeni İş Emri</button>
        {secili && <button className={`btn ${panel==="detay"?"btn-primary":"btn-ghost"}`} onClick={()=>setPanel("detay")}>📄 {secili} Detay</button>}
        <div style={{marginLeft:"auto"}}>
          <IndirButonlari
            onCSV={()=>{
              const bas = ["İş Emri No","Müşteri","Ürün","Açılış","Durum","710 Malzeme","720 İşçilik","GÜG Yüklenen","Toplam Maliyet"];
              const sat = emirlerHesapli.map(e=>[e.id, e.musteri, e.urun, e.acilis, e.durum, e.malzeme, e.iscilik, e.gugYuklenen.toFixed(2), e.toplamMaliyet.toFixed(2)]);
              csvIndir(sat, bas, `siparis-maliyeti-${new Date().toISOString().slice(0,10)}.csv`);
            }}
            onPDF={async()=>{
              await pdfIndir("Sipariş Maliyeti Raporu", [{
                altBaslik: "İş Emirleri",
                kolonlar: ["İş Emri","Müşteri","Ürün","Durum","710 Malzeme","720 İşçilik","GÜG Yüklenen","TOPLAM"],
                satirlar: emirlerHesapli.map(e=>[e.id, e.musteri, e.urun, e.durum, e.malzeme.toLocaleString("tr-TR")+" TL", e.iscilik.toLocaleString("tr-TR")+" TL", Math.round(e.gugYuklenen).toLocaleString("tr-TR")+" TL", Math.round(e.toplamMaliyet).toLocaleString("tr-TR")+" TL"]),
                notlar: `GÜG Yükleme Oranı: ${Math.round(gugOrani).toLocaleString("tr-TR")} TL/saat  |  Toplam Maliyet: ${Math.round(toplamMaliyet).toLocaleString("tr-TR")} TL`
              }], `siparis-maliyeti-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
            }}
          />
        </div>
      </div>

      {/* İŞ EMİRLERİ LİSTESİ */}
      {panel === "liste" && (
        <div className="card">
          <div className="card-title">Açık / Kapalı İş Emirleri</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>İş Emri</th><th>Müşteri / Ürün</th><th>Açılış</th><th>Durum</th><th>710 Malzeme</th><th>720 İşçilik</th><th>GÜG Yüklenen</th><th>TOPLAM</th><th></th></tr>
              </thead>
              <tbody>
                {emirlerHesapli.map(e => (
                  <tr key={e.id} style={{cursor:"pointer"}} onClick={()=>{setSecili(e.id);setPanel("detay");}}>
                    <td style={{fontFamily:"var(--mono)",color:"var(--accent2)",fontWeight:600}}>{e.id}</td>
                    <td>
                      <div style={{fontWeight:500,fontSize:13}}>{e.musteri}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{e.urun}</div>
                    </td>
                    <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{e.acilis}</td>
                    <td>
                      <span className={`badge ${e.durum==="Tamamlandı"?"badge-degisken":"badge-karma"}`}>{e.durum}</span>
                    </td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(e.malzeme)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(e.iscilik)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--amber)"}}>{formatTL(e.gugYuklenen)}</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)"}}>{formatTL(e.toplamMaliyet)}</td>
                    <td onClick={ev=>{ev.stopPropagation();isSil(e.id);}}>
                      <div style={{display:"flex",gap:4}}>
                        <button className="btn btn-ghost btn-sm" onClick={ev=>{ev.stopPropagation();setSecili(e.id);setPanel("duzenle");}}>✏</button>
                        <button className="btn btn-ghost btn-sm btn-danger">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MALİYET YAPISI */}
          {emirlerHesapli.length > 0 && (
            <>
              <div className="divider"/>
              <div className="card-title">Toplam Maliyet Yapısı</div>
              {[
                {label:"710 Direkt Malzeme",  tutar:toplamMalzeme, renk:"var(--green)"},
                {label:"720 Direkt İşçilik",  tutar:toplamIscilik, renk:"var(--accent2)"},
                {label:"730 GÜG Yüklenen",    tutar:toplamGUGYuk,  renk:"var(--amber)"},
              ].map(({label,tutar,renk}) => {
                const oran = toplamMaliyet > 0 ? (tutar/toplamMaliyet)*100 : 0;
                return (
                  <div key={label} className="progress-row">
                    <div className="progress-label" style={{minWidth:170,fontSize:11}}>{label}</div>
                    <div className="progress-track"><div className="progress-fill" style={{width:`${oran}%`,background:renk}}/></div>
                    <div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",minWidth:130,textAlign:"right"}}>
                      {formatTL(tutar)} <span style={{opacity:.5}}>%{oran.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* DETAY PANELİ */}
      {panel === "detay" && seciliEmirHesapli && (
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontFamily:"var(--mono)",fontSize:18,fontWeight:700,color:"var(--accent2)"}}>{seciliEmirHesapli.id}</div>
              <div style={{fontSize:14,fontWeight:500,marginTop:2}}>{seciliEmirHesapli.musteri}</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>{seciliEmirHesapli.urun}</div>
            </div>
            <span className={`badge ${seciliEmirHesapli.durum==="Tamamlandı"?"badge-degisken":"badge-karma"}`} style={{fontSize:12}}>
              {seciliEmirHesapli.durum}
            </span>
          </div>

          {/* MALİYET ÖZET KARTLARI */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[
              {label:"710 Malzeme",  v:seciliEmirHesapli.malzeme,     renk:"var(--green)"},
              {label:"720 İşçilik", v:seciliEmirHesapli.iscilik,     renk:"var(--accent2)"},
              {label:"GÜG Yüklenen",v:seciliEmirHesapli.gugYuklenen, renk:"var(--amber)"},
              {label:"TOPLAM",      v:seciliEmirHesapli.toplamMaliyet,renk:"var(--text)"},
            ].map(({label,v,renk}) => (
              <div key={label} style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--mono)",color:renk}}>{formatTL(v)}</div>
              </div>
            ))}
          </div>

          {/* SATIRLAR */}
          <div className="card-title">Maliyet Kart Satırları</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Tür</th><th>Açıklama</th><th>Tutar</th><th></th></tr>
              </thead>
              <tbody>
                {(seciliEmirHesapli.satirlar||[]).map((s,i) => (
                  <tr key={i}>
                    <td><span className={`badge ${s.tip==="Malzeme"?"badge-degisken":"badge-direkt"}`}>{s.tip}</span></td>
                    <td style={{fontSize:13}}>{s.aciklama}</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(s.tutar)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={()=>{
                        setIsEmirleri(es=>es.map(em=>{
                          if(em.id!==secili) return em;
                          const yeniSatirlar = em.satirlar.filter((_,idx)=>idx!==i);
                          const silinen = em.satirlar[i];
                          return {
                            ...em,
                            satirlar: yeniSatirlar,
                            malzeme: em.malzeme - (silinen.tip==="Malzeme"?silinen.tutar:0),
                            iscilik: em.iscilik - (silinen.tip==="İşçilik"?silinen.tutar:0),
                            iscilikSaati: em.iscilikSaati - (silinen.tip==="İşçilik"?Math.round(silinen.tutar/100):0),
                          };
                        }));
                      }}>Sil</button>
                    </td>
                  </tr>
                ))}
                {/* GÜG SATIRI */}
                <tr style={{background:"rgba(240,180,41,.04)"}}>
                  <td><span className="badge badge-endirekt">GÜG</span></td>
                  <td style={{fontSize:13,color:"var(--muted)"}}>
                    {seciliEmirHesapli.iscilikSaati} saat × {formatTL(gugOrani)}/saat (yükleme oranı)
                  </td>
                  <td style={{fontFamily:"var(--mono)",color:"var(--amber)"}}>{formatTL(seciliEmirHesapli.gugYuklenen)}</td>
                </tr>
                {/* TOPLAM */}
                <tr style={{background:"var(--surface2)"}}>
                  <td colSpan={2} style={{fontWeight:600,fontSize:13}}>TOPLAM İŞ EMRİ MALİYETİ</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:15,color:"var(--green)"}}>{formatTL(seciliEmirHesapli.toplamMaliyet)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SATIR EKLE */}
          <div className="divider"/>
          <div className="card-title">Yeni Maliyet Satırı Ekle</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Tür</label>
              <select className="form-select" value={yeniSatir.tip} onChange={e=>setYeniSatir(s=>({...s,tip:e.target.value}))}>
                <option>Malzeme</option><option>İşçilik</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tutar (TL)</label>
              <input className="form-input" type="number" value={yeniSatir.tutar} onChange={e=>setYeniSatir(s=>({...s,tutar:e.target.value}))}/>
            </div>
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Açıklama</label>
              <input className="form-input" placeholder="Örn: Çelik profil 50kg" value={yeniSatir.aciklama} onChange={e=>setYeniSatir(s=>({...s,aciklama:e.target.value}))}/>
            </div>
          </div>
          {hata && <div style={{fontSize:12,color:"var(--red)",margin:"8px 0",padding:"8px 12px",background:"rgba(255,85,85,.08)",borderRadius:6}}>⚠ {hata}</div>}
          <button className="btn btn-primary" style={{marginTop:12}} onClick={satirEkle}>+ Satır Ekle</button>
        </div>
      )}

      {/* İŞ EMRİ DÜZENLE */}
      {panel === "duzenle" && secili && (() => {
        const e = isEmirleri.find(x=>x.id===secili);
        if (!e) return null;
        return (
          <div className="card">
            <div className="card-title">İş Emrini Düzenle — {e.id}</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Müşteri</label>
                <input className="form-input" value={e.musteri} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,musteri:ev.target.value}:x))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Ürün / Proje</label>
                <input className="form-input" value={e.urun} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,urun:ev.target.value}:x))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Açılış Tarihi</label>
                <input className="form-input" type="date" value={e.acilis} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,acilis:ev.target.value}:x))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Durum</label>
                <select className="form-select" value={e.durum} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,durum:ev.target.value}:x))}>
                  <option>Devam Ediyor</option><option>Tamamlandı</option><option>Beklemede</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Direkt Malzeme (TL)</label>
                <input className="form-input" type="number" value={e.malzeme} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,malzeme:+ev.target.value||0}:x))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Direkt İşçilik (TL)</label>
                <input className="form-input" type="number" value={e.iscilik} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,iscilik:+ev.target.value||0}:x))}/>
              </div>
              <div className="form-group">
                <label className="form-label">İşçilik Saati</label>
                <input className="form-input" type="number" value={e.iscilikSaati} onChange={ev=>setIsEmirleri(es=>es.map(x=>x.id===secili?{...x,iscilikSaati:+ev.target.value||0}:x))}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn btn-primary" onClick={()=>setPanel("liste")}>✓ Kaydet</button>
              <button className="btn btn-ghost" onClick={()=>setPanel("liste")}>İptal</button>
            </div>
          </div>
        );
      })()}

      {/* YENİ İŞ EMRİ */}
      {panel === "yeni" && (
        <div className="card">
          <div className="card-title">Yeni İş Emri Aç</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">İş Emri No *</label>
              <input className="form-input" placeholder="IE-003" value={yeniForm.id} onChange={e=>setYeniForm(f=>({...f,id:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Açılış Tarihi</label>
              <input className="form-input" type="date" value={yeniForm.acilis} onChange={e=>setYeniForm(f=>({...f,acilis:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Müşteri *</label>
              <input className="form-input" placeholder="Firma adı" value={yeniForm.musteri} onChange={e=>setYeniForm(f=>({...f,musteri:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Ürün / Proje *</label>
              <input className="form-input" placeholder="Üretilecek ürün" value={yeniForm.urun} onChange={e=>setYeniForm(f=>({...f,urun:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Direkt Malzeme (TL)</label>
              <input className="form-input" type="number" value={yeniForm.malzeme} onChange={e=>setYeniForm(f=>({...f,malzeme:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Direkt İşçilik (TL)</label>
              <input className="form-input" type="number" value={yeniForm.iscilik} onChange={e=>setYeniForm(f=>({...f,iscilik:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">İşçilik Saati</label>
              <input className="form-input" type="number" value={yeniForm.iscilikSaati} onChange={e=>setYeniForm(f=>({...f,iscilikSaati:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Durum</label>
              <select className="form-select" value={yeniForm.durum} onChange={e=>setYeniForm(f=>({...f,durum:e.target.value}))}>
                <option>Devam Ediyor</option><option>Tamamlandı</option><option>Beklemede</option>
              </select>
            </div>
          </div>
          {hata && <div style={{fontSize:12,color:"var(--red)",margin:"8px 0",padding:"8px 12px",background:"rgba(255,85,85,.08)",borderRadius:6}}>⚠ {hata}</div>}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button className="btn btn-primary" onClick={yeniEmirEkle}>İş Emri Aç</button>
            <button className="btn btn-ghost" onClick={()=>setPanel("liste")}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODÜL 4: STANDART MALİYET & SAPMA ANALİZİ ──────────────────────────────
const URUN_STANDARTLARI_VARSAYILAN = [
  {
    id: 1, urun: "Çelik Konstrüksiyon A",
    stdMalzemeMiktar: 50,   stdMalzemeFiyat: 120,
    stdIscilikSaat:   8,    stdIscilikUcret: 100,
    stdGugOrani:      80,
    gercekMalzemeMiktar: 54, gercekMalzemeFiyat: 115,
    gercekIscilikSaat:   9,  gercekIscilikUcret: 105,
    uretimMiktari: 100,
  },
  {
    id: 2, urun: "Alüminyum Profil B",
    stdMalzemeMiktar: 20,   stdMalzemeFiyat: 200,
    stdIscilikSaat:   4,    stdIscilikUcret: 100,
    stdGugOrani:      80,
    gercekMalzemeMiktar: 19, gercekMalzemeFiyat: 210,
    gercekIscilikSaat:   4,  gercekIscilikUcret: 98,
    uretimMiktari: 200,
  },
];

function sapmaHesapla(u) {
  const adet = u.uretimMiktari;
  // Malzeme
  const malzemeFiyatSapma   = (u.stdMalzemeFiyat - u.gercekMalzemeFiyat) * u.gercekMalzemeMiktar * adet;
  const malzemeMiktarSapma  = (u.stdMalzemeMiktar - u.gercekMalzemeMiktar) * u.stdMalzemeFiyat * adet;
  const malzemeToplam       = malzemeFiyatSapma + malzemeMiktarSapma;
  // İşçilik
  const iscilikUcretSapma   = (u.stdIscilikUcret - u.gercekIscilikUcret) * u.gercekIscilikSaat * adet;
  const iscilikVerimSapma   = (u.stdIscilikSaat  - u.gercekIscilikSaat)  * u.stdIscilikUcret   * adet;
  const iscilikToplam       = iscilikUcretSapma + iscilikVerimSapma;
  // Standart & Gerçek toplam
  const stdToplam  = (u.stdMalzemeMiktar*u.stdMalzemeFiyat + u.stdIscilikSaat*u.stdIscilikUcret + u.stdIscilikSaat*u.stdGugOrani) * adet;
  const gercToplam = (u.gercekMalzemeMiktar*u.gercekMalzemeFiyat + u.gercekIscilikSaat*u.gercekIscilikUcret + u.gercekIscilikSaat*u.stdGugOrani) * adet;
  return { malzemeFiyatSapma, malzemeMiktarSapma, malzemeToplam, iscilikUcretSapma, iscilikVerimSapma, iscilikToplam, stdToplam, gercToplam, netSapma: stdToplam - gercToplam };
}

function SapmaBadge({ deger }) {
  const lehte = deger >= 0;
  return (
    <span style={{
      fontFamily:"var(--mono)", fontSize:12, fontWeight:600,
      padding:"3px 8px", borderRadius:4,
      background: lehte ? "rgba(62,207,142,.12)" : "rgba(255,85,85,.12)",
      color: lehte ? "var(--green)" : "var(--red)",
    }}>
      {lehte ? "▲" : "▼"} {formatTL(Math.abs(deger))} {lehte ? "Lehte" : "Aleyhte"}
    </span>
  );
}

function ModulStandartMaliyet() {
  const [urunler, setUrunler] = useLocalState("mm_stdUrunler", URUN_STANDARTLARI_VARSAYILAN);
  const [secili, setSecili]   = useState(urunler[0].id);
  const [duzenle, setDuzenle] = useState(false);
  const [form, setForm]       = useState(null);

  const aktifUrun = urunler.find(u => u.id === secili);
  const sapma     = aktifUrun ? sapmaHesapla(aktifUrun) : null;

  const baslaDuzenle = () => { setForm({...aktifUrun}); setDuzenle(true); };
  const kaydet = () => {
    setUrunler(us => us.map(u => u.id === form.id ? {...form,
      stdMalzemeMiktar:+form.stdMalzemeMiktar, stdMalzemeFiyat:+form.stdMalzemeFiyat,
      stdIscilikSaat:+form.stdIscilikSaat,     stdIscilikUcret:+form.stdIscilikUcret,
      stdGugOrani:+form.stdGugOrani,
      gercekMalzemeMiktar:+form.gercekMalzemeMiktar, gercekMalzemeFiyat:+form.gercekMalzemeFiyat,
      gercekIscilikSaat:+form.gercekIscilikSaat,     gercekIscilikUcret:+form.gercekIscilikUcret,
      uretimMiktari:+form.uretimMiktari,
    } : u));
    setDuzenle(false);
  };

  const yeniEkle = () => {
    const id = Date.now();
    const yeni = { id, urun:"Yeni Ürün", stdMalzemeMiktar:10, stdMalzemeFiyat:100, stdIscilikSaat:5, stdIscilikUcret:100, stdGugOrani:80, gercekMalzemeMiktar:10, gercekMalzemeFiyat:100, gercekIscilikSaat:5, gercekIscilikUcret:100, uretimMiktari:50 };
    setUrunler(us => [...us, yeni]);
    setSecili(id);
    setForm({...yeni});
    setDuzenle(true);
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">📐 Standart Maliyet & Sapma Analizi</div>
        <div className="section-desc">Standart (hedef) maliyetle gerçekleşen maliyeti karşılaştırın. Sapmayı fiyat ve miktar/verimlilik olarak ayrıştırın.</div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Aşama 4 — Sapma Yorumu</h4>
        <p><strong style={{color:"var(--green)"}}>Lehte sapma:</strong> Gerçek maliyet standartın altında → olumlu. <strong style={{color:"var(--red)"}}>Aleyhte sapma:</strong> Gerçek maliyet standartın üstünde → araştır.</p>
        <p>Malzeme sapmasi → <span style={{color:"var(--accent2)"}}>fiyat (satın alma sorumlu)</span> + <span style={{color:"var(--amber)"}}>miktar (üretim sorumlu)</span>. İşçilik sapması → <span style={{color:"var(--accent2)"}}>ücret (İK sorumlu)</span> + <span style={{color:"var(--amber)"}}>verimlilik (üretim sorumlu)</span>.</p>
      </div>

      {/* ÜRÜN SEÇICI */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        {urunler.map(u => {
          const s = sapmaHesapla(u);
          return (
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:2}}>
              <button
                className={`btn ${secili===u.id?"btn-primary":"btn-ghost"}`}
                onClick={()=>{setSecili(u.id);setDuzenle(false);}}>
                {u.urun}
                <span style={{fontSize:10,marginLeft:6,color:s.netSapma>=0?"var(--green)":"var(--red)"}}>
                  {s.netSapma>=0?"▲":"▼"}
                </span>
              </button>
              {urunler.length > 1 && (
                <button className="btn btn-ghost btn-sm btn-danger" style={{padding:"5px 7px"}}
                  onClick={()=>{
                    const kalanlar = urunler.filter(x=>x.id!==u.id);
                    setUrunler(kalanlar);
                    if(secili===u.id){ setSecili(kalanlar[0].id); setDuzenle(false); }
                  }}>✕</button>
              )}
            </div>
          );
        })}
        <button className="btn btn-ghost" onClick={yeniEkle}>+ Ürün Ekle</button>
      </div>

      {aktifUrun && sapma && !duzenle && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <IndirButonlari
              onCSV={()=>{
                const bas = ["Sapma Türü","Standart","Gerçek","Sapma (TL)","Lehte/Aleyhte","Sorumluluk"];
                const sat = [
                  ["Malzeme Fiyat", aktifUrun.stdMalzemeFiyat+" TL/kg", aktifUrun.gercekMalzemeFiyat+" TL/kg", sapma.malzemeFiyatSapma.toFixed(2), sapma.malzemeFiyatSapma>=0?"Lehte":"Aleyhte","Satın Alma"],
                  ["Malzeme Miktar", aktifUrun.stdMalzemeMiktar+" kg/adet", aktifUrun.gercekMalzemeMiktar+" kg/adet", sapma.malzemeMiktarSapma.toFixed(2), sapma.malzemeMiktarSapma>=0?"Lehte":"Aleyhte","Üretim"],
                  ["İşçilik Ücret", aktifUrun.stdIscilikUcret+" TL/saat", aktifUrun.gercekIscilikUcret+" TL/saat", sapma.iscilikUcretSapma.toFixed(2), sapma.iscilikUcretSapma>=0?"Lehte":"Aleyhte","İnsan Kaynakları"],
                  ["İşçilik Verimlilik", aktifUrun.stdIscilikSaat+" saat/adet", aktifUrun.gercekIscilikSaat+" saat/adet", sapma.iscilikVerimSapma.toFixed(2), sapma.iscilikVerimSapma>=0?"Lehte":"Aleyhte","Üretim"],
                  ["NET SAPMA", sapma.stdToplam.toFixed(2)+" TL", sapma.gercToplam.toFixed(2)+" TL", sapma.netSapma.toFixed(2), sapma.netSapma>=0?"Lehte":"Aleyhte",""],
                ];
                csvIndir(sat, bas, `standart-sapma-${aktifUrun.urun}-${new Date().toISOString().slice(0,10)}.csv`);
              }}
              onPDF={async()=>{
                await pdfIndir(`Standart Maliyet & Sapma Analizi — ${aktifUrun.urun}`, [{
                  altBaslik: "Sapma Analizi",
                  kolonlar: ["Sapma Türü","Standart","Gerçek","Sapma (TL)","Lehte/Aleyhte","Sorumluluk"],
                  satirlar: [
                    ["Malzeme Fiyat", aktifUrun.stdMalzemeFiyat+" TL/kg", aktifUrun.gercekMalzemeFiyat+" TL/kg", sapma.malzemeFiyatSapma.toLocaleString("tr-TR")+" TL", sapma.malzemeFiyatSapma>=0?"Lehte":"Aleyhte","Satın Alma"],
                    ["Malzeme Miktar", aktifUrun.stdMalzemeMiktar+" kg/adet", aktifUrun.gercekMalzemeMiktar+" kg/adet", sapma.malzemeMiktarSapma.toLocaleString("tr-TR")+" TL", sapma.malzemeMiktarSapma>=0?"Lehte":"Aleyhte","Üretim"],
                    ["İşçilik Ücret", aktifUrun.stdIscilikUcret+" TL/saat", aktifUrun.gercekIscilikUcret+" TL/saat", sapma.iscilikUcretSapma.toLocaleString("tr-TR")+" TL", sapma.iscilikUcretSapma>=0?"Lehte":"Aleyhte","İnsan Kaynakları"],
                    ["İşçilik Verimlilik", aktifUrun.stdIscilikSaat+" saat/adet", aktifUrun.gercekIscilikSaat+" saat/adet", sapma.iscilikVerimSapma.toLocaleString("tr-TR")+" TL", sapma.iscilikVerimSapma>=0?"Lehte":"Aleyhte","Üretim"],
                    ["NET SAPMA", Math.round(sapma.stdToplam).toLocaleString("tr-TR")+" TL", Math.round(sapma.gercToplam).toLocaleString("tr-TR")+" TL", Math.round(sapma.netSapma).toLocaleString("tr-TR")+" TL", sapma.netSapma>=0?"Lehte":"Aleyhte",""],
                  ],
                  notlar: `Üretim Miktarı: ${aktifUrun.uretimMiktari} adet`
                }], `standart-sapma-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
              }}
            />
          </div>
          {/* ÖZET KARTLARI */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Standart Maliyet</div>
              <div className="stat-value blue">{formatTL(sapma.stdToplam)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gerçek Maliyet</div>
              <div className="stat-value amber">{formatTL(sapma.gercToplam)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Net Sapma</div>
              <div className={`stat-value ${sapma.netSapma>=0?"green":"red"}`}>{formatTL(sapma.netSapma)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Üretim Miktarı</div>
              <div className="stat-value blue">{aktifUrun.uretimMiktari} adet</div>
            </div>
          </div>

          {/* SAPMA TABLOSU */}
          <div className="card">
            <div className="card-title">Sapma Analizi Detayı</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Sapma Türü</th><th>Standart</th><th>Gerçek</th><th>Formül</th><th>Sapma</th><th>Sorumluluk</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{fontWeight:500}}>Malzeme Fiyat</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(aktifUrun.stdMalzemeFiyat)}/kg</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(aktifUrun.gercekMalzemeFiyat)}/kg</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>(Std.F − Ger.F) × Ger.Miktar × Adet</td>
                    <td><SapmaBadge deger={sapma.malzemeFiyatSapma}/></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>Satın Alma</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>Malzeme Miktar</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{aktifUrun.stdMalzemeMiktar} kg/adet</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{aktifUrun.gercekMalzemeMiktar} kg/adet</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>(Std.M − Ger.M) × Std.F × Adet</td>
                    <td><SapmaBadge deger={sapma.malzemeMiktarSapma}/></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>Üretim</td>
                  </tr>
                  <tr style={{background:"rgba(79,142,247,.03)"}}>
                    <td style={{fontWeight:600}}>Malzeme Toplam</td>
                    <td colSpan={3}></td>
                    <td><SapmaBadge deger={sapma.malzemeToplam}/></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>İşçilik Ücret</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(aktifUrun.stdIscilikUcret)}/saat</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{formatTL(aktifUrun.gercekIscilikUcret)}/saat</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>(Std.Ü − Ger.Ü) × Ger.Saat × Adet</td>
                    <td><SapmaBadge deger={sapma.iscilikUcretSapma}/></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>İnsan Kaynakları</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>İşçilik Verimlilik</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{aktifUrun.stdIscilikSaat} saat/adet</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12}}>{aktifUrun.gercekIscilikSaat} saat/adet</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>(Std.S − Ger.S) × Std.Ü × Adet</td>
                    <td><SapmaBadge deger={sapma.iscilikVerimSapma}/></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>Üretim</td>
                  </tr>
                  <tr style={{background:"rgba(79,142,247,.03)"}}>
                    <td style={{fontWeight:600}}>İşçilik Toplam</td>
                    <td colSpan={3}></td>
                    <td><SapmaBadge deger={sapma.iscilikToplam}/></td>
                    <td></td>
                  </tr>
                  <tr style={{background:"var(--surface2)"}}>
                    <td style={{fontWeight:700,fontSize:13}}>NET SAPMA</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600}}>{formatTL(sapma.stdToplam)}</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--amber)"}}>{formatTL(sapma.gercToplam)}</td>
                    <td></td>
                    <td><SapmaBadge deger={sapma.netSapma}/></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{marginTop:14,textAlign:"right"}}>
              <button className="btn btn-ghost" onClick={baslaDuzenle}>✏ Standart / Gerçek Değerleri Düzenle</button>
            </div>
          </div>

          {/* GÖRSEL KARŞILAŞTIRMA */}
          <div className="card">
            <div className="card-title">Bileşen Bazında Maliyet Karşılaştırması</div>
            {[
              { label:"Malzeme", std: aktifUrun.stdMalzemeMiktar*aktifUrun.stdMalzemeFiyat*aktifUrun.uretimMiktari, gec: aktifUrun.gercekMalzemeMiktar*aktifUrun.gercekMalzemeFiyat*aktifUrun.uretimMiktari },
              { label:"İşçilik", std: aktifUrun.stdIscilikSaat*aktifUrun.stdIscilikUcret*aktifUrun.uretimMiktari,   gec: aktifUrun.gercekIscilikSaat*aktifUrun.gercekIscilikUcret*aktifUrun.uretimMiktari },
            ].map(({label, std, gec}) => {
              const max = Math.max(std, gec, 1);
              return (
                <div key={label} style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>{label}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--accent2)",minWidth:56}}>Standart</span>
                      <div style={{flex:1,height:8,background:"var(--faint)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{width:`${(std/max)*100}%`,height:"100%",background:"var(--accent2)",borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",minWidth:90,textAlign:"right"}}>{formatTL(std)}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--amber)",minWidth:56}}>Gerçek</span>
                      <div style={{flex:1,height:8,background:"var(--faint)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{width:`${(gec/max)*100}%`,height:"100%",background: gec>std?"var(--red)":"var(--green)",borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",minWidth:90,textAlign:"right"}}>{formatTL(gec)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* DÜZENLEME FORMU */}
      {duzenle && form && (
        <div className="card">
          <div className="card-title">Standart ve Gerçek Değerleri Düzenle — {form.urun}</div>
          <div className="form-grid">
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Ürün Adı</label>
              <input className="form-input" value={form.urun} onChange={e=>setForm(f=>({...f,urun:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Üretim Miktarı (adet)</label>
              <input className="form-input" type="number" value={form.uretimMiktari} onChange={e=>setForm(f=>({...f,uretimMiktari:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Std. GÜG Oranı (TL/saat)</label>
              <input className="form-input" type="number" value={form.stdGugOrani} onChange={e=>setForm(f=>({...f,stdGugOrani:e.target.value}))}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:16}}>
            {[
              {title:"Malzeme Standartları", fields:[
                {k:"stdMalzemeMiktar",  label:"Standart Miktar (kg/adet)"},
                {k:"stdMalzemeFiyat",   label:"Standart Fiyat (TL/kg)"},
                {k:"gercekMalzemeMiktar", label:"Gerçek Miktar (kg/adet)"},
                {k:"gercekMalzemeFiyat",  label:"Gerçek Fiyat (TL/kg)"},
              ]},
              {title:"İşçilik Standartları", fields:[
                {k:"stdIscilikSaat",    label:"Standart Saat (saat/adet)"},
                {k:"stdIscilikUcret",   label:"Standart Ücret (TL/saat)"},
                {k:"gercekIscilikSaat", label:"Gerçek Saat (saat/adet)"},
                {k:"gercekIscilikUcret",label:"Gerçek Ücret (TL/saat)"},
              ]},
            ].map(({title, fields}) => (
              <div key={title}>
                <div style={{fontSize:11,color:"var(--accent2)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>{title}</div>
                {fields.map(({k,label}) => (
                  <div key={k} className="form-group" style={{marginBottom:10}}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" type="number" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button className="btn btn-primary" onClick={kaydet}>Kaydet</button>
            <button className="btn btn-ghost" onClick={()=>setDuzenle(false)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODÜL 5: CVP ANALİZİ & BAŞABAŞ NOKTASI ─────────────────────────────────
function ModulCVP() {
  const [urunler, setUrunler] = useLocalState("mm_cvpUrunler", [
    { id: 1, ad: "Ürün A", satisF: 500, degiskenM: 300, sabitM: 0 },
    { id: 2, ad: "Ürün B", satisF: 800, degiskenM: 450, sabitM: 0 },
  ]);
  const [sabitGider, setSabitGider] = useLocalState("mm_cvpSabit", 120000);
  const [secili, setSecili] = useLocalState("mm_cvpSecili", 1);
  const [hedefKar, setHedefKar]     = useState(50000);
  const [gosterGrafik, setGosterGrafik] = useState(true);

  const urun = urunler.find(u => u.id === secili) || urunler[0];
  const km         = urun.satisF - urun.degiskenM;           // katkı marjı
  const kmOrani    = urun.satisF > 0 ? km / urun.satisF : 0; // KM oranı
  const bbAdet     = km > 0 ? Math.ceil(sabitGider / km) : 0;
  const bbTL       = bbAdet * urun.satisF;
  const hedefAdet  = km > 0 ? Math.ceil((sabitGider + hedefKar) / km) : 0;
  const guvenlikPaylasi = bbAdet > 0 ? ((hedefAdet - bbAdet) / hedefAdet) * 100 : 0;

  // Grafik verileri
  const maxAdet   = Math.max(bbAdet * 2, hedefAdet * 1.3, 100);
  const noktalar  = Array.from({length: 11}, (_, i) => {
    const adet    = Math.round((maxAdet / 10) * i);
    return {
      adet,
      gelir:      adet * urun.satisF,
      toplamM:    sabitGider + adet * urun.degiskenM,
      kar:        adet * km - sabitGider,
    };
  });

  // SVG grafik boyutları
  const GW = 580, GH = 260, PAD = 40;
  const maxY = Math.max(...noktalar.map(n => Math.max(n.gelir, n.toplamM)));
  const scaleX = (adet) => PAD + (adet / maxAdet) * (GW - PAD * 2);
  const scaleY = (val)  => GH - PAD - (val / (maxY * 1.05)) * (GH - PAD * 2);
  const pts = (arr, key) => arr.map(n => `${scaleX(n.adet)},${scaleY(n[key])}`).join(" ");

  const kaydet = (field, val) => setUrunler(us => us.map(u => u.id === secili ? {...u, [field]: +val||0} : u));

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">📈 CVP Analizi & Başabaş Noktası</div>
        <div className="section-desc">Maliyet-Hacim-Kâr ilişkisini analiz edin. Başabaş noktasını ve hedef kâra ulaşmak için gereken satış miktarını hesaplayın.</div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Aşama 5 — Temel Kavramlar</h4>
        <p><strong style={{color:"var(--text)"}}>Katkı Marjı (KM):</strong> Satış Fiyatı − Değişken Maliyet. Her satılan birim sabit giderleri karşılamaya ve kâr oluşturmaya bu kadar katkıda bulunur.</p>
        <p><strong style={{color:"var(--text)"}}>Başabaş Noktası:</strong> Sabit Gider ÷ Katkı Marjı = ne kadar satarsan ne kâr ne zarar. Bu noktanın altı zarar, üstü kârdır.</p>
      </div>

      {/* ÜRÜN SEÇİCİ */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        {urunler.map(u => (
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:2}}>
            <button className={`btn ${secili===u.id?"btn-primary":"btn-ghost"}`} onClick={()=>setSecili(u.id)}>{u.ad}</button>
            {urunler.length > 1 && (
              <button className="btn btn-ghost btn-sm btn-danger" style={{padding:"5px 7px"}}
                onClick={()=>{
                  const kalanlar = urunler.filter(x=>x.id!==u.id);
                  setUrunler(kalanlar);
                  if(secili===u.id) setSecili(kalanlar[0].id);
                }}>✕</button>
            )}
          </div>
        ))}
        <button className="btn btn-ghost" onClick={()=>{
          const id=Date.now();
          setUrunler(us=>[...us,{id,ad:`Ürün ${us.length+1}`,satisF:600,degiskenM:350,sabitM:0}]);
          setSecili(id);
        }}>+ Ürün Ekle</button>
      </div>

      {/* GİRİŞ FORMU */}
      <div className="card">
        <div className="card-title">Parametreler — {urun.ad}</div>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:"1/-1"}}>
            <label className="form-label">Ürün Adı</label>
            <input className="form-input" value={urun.ad} onChange={e=>setUrunler(us=>us.map(u=>u.id===secili?{...u,ad:e.target.value}:u))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Satış Fiyatı (TL/adet)</label>
            <input className="form-input" type="number" value={urun.satisF} onChange={e=>kaydet("satisF",e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Değişken Maliyet (TL/adet)</label>
            <input className="form-input" type="number" value={urun.degiskenM} onChange={e=>kaydet("degiskenM",e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Toplam Sabit Gider (TL/dönem)</label>
            <input className="form-input" type="number" value={sabitGider} onChange={e=>setSabitGider(+e.target.value||0)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Hedef Kâr (TL)</label>
            <input className="form-input" type="number" value={hedefKar} onChange={e=>setHedefKar(+e.target.value||0)}/>
          </div>
        </div>
      </div>

      {/* SONUÇ KARTLARI */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
        <IndirButonlari
          onCSV={()=>{
            const bas = ["Parametre","Değer"];
            const sat = [
              ["Ürün",urun.ad],["Satış Fiyatı",urun.satisF+" TL/adet"],["Değişken Maliyet",urun.degiskenM+" TL/adet"],
              ["Sabit Gider",sabitGider+" TL"],["Katkı Marjı",km+" TL"],["KM Oranı","%"+(kmOrani*100).toFixed(1)],
              ["Başabaş (Adet)",bbAdet],["Başabaş (TL)",bbTL],["Hedef Kâr",hedefKar+" TL"],["Hedef Satış (Adet)",hedefAdet],
            ];
            csvIndir(sat, bas, `cvp-analizi-${new Date().toISOString().slice(0,10)}.csv`);
          }}
          onPDF={async()=>{
            await pdfIndir(`CVP Analizi — ${urun.ad}`, [{
              altBaslik: "Başabaş ve Kâr Analizi",
              kolonlar: ["Parametre","Değer"],
              satirlar: [
                ["Satış Fiyatı", urun.satisF.toLocaleString("tr-TR")+" TL/adet"],
                ["Değişken Maliyet", urun.degiskenM.toLocaleString("tr-TR")+" TL/adet"],
                ["Katkı Marjı", km.toLocaleString("tr-TR")+" TL  (%"+(kmOrani*100).toFixed(1)+")"],
                ["Sabit Gider", sabitGider.toLocaleString("tr-TR")+" TL"],
                ["Başabaş Noktası", bbAdet.toLocaleString("tr-TR")+" adet  /  "+bbTL.toLocaleString("tr-TR")+" TL"],
                ["Hedef Kâr", hedefKar.toLocaleString("tr-TR")+" TL"],
                ["Hedef Satış Miktarı", hedefAdet.toLocaleString("tr-TR")+" adet"],
                ["Güvenlik Marjı", "%"+guvenlikPaylasi.toFixed(1)],
              ],
            }], `cvp-analizi-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
          }}
        />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Katkı Marjı",        v:formatTL(km),                              renk:"var(--green)"},
          {label:"KM Oranı",           v:`%${(kmOrani*100).toFixed(1)}`,            renk:"var(--accent2)"},
          {label:"Başabaş (adet)",     v:`${bbAdet.toLocaleString("tr-TR")} adet`,  renk:"var(--amber)"},
          {label:"Başabaş (TL)",       v:formatTL(bbTL),                            renk:"var(--amber)"},
        ].map(({label,v,renk})=>(
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div style={{fontSize:17,fontWeight:700,fontFamily:"var(--mono)",color:renk,marginTop:4}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div className="card" style={{margin:0,borderColor:"rgba(62,207,142,.25)"}}>
          <div className="card-title" style={{color:"var(--green)"}}>Hedef Kâr Analizi</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>
            {formatTL(hedefKar)} kâr için gereken satış:
          </div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:"var(--mono)",color:"var(--green)"}}>{hedefAdet.toLocaleString("tr-TR")} adet</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{formatTL(hedefAdet*urun.satisF)} ciro</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:8,padding:"6px 10px",background:"var(--surface2)",borderRadius:6}}>
            Formül: (Sabit Gider + Hedef Kâr) ÷ KM = ({formatTL(sabitGider)} + {formatTL(hedefKar)}) ÷ {formatTL(km)}
          </div>
        </div>
        <div className="card" style={{margin:0}}>
          <div className="card-title">Güvenlik Marjı</div>
          <div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}>
            Hedef satışın başabaşın ne kadar üstünde:
          </div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:"var(--mono)",color:"var(--accent2)"}}>%{guvenlikPaylasi.toFixed(1)}</div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{(hedefAdet-bbAdet).toLocaleString("tr-TR")} adet tampon</div>
          <div className="progress-track" style={{marginTop:10,height:8}}>
            <div className="progress-fill" style={{width:`${Math.min(guvenlikPaylasi,100)}%`,background:"var(--accent2)"}}/>
          </div>
        </div>
      </div>

      {/* GRAFİK */}
      <div className="card">
        <div className="card-title" style={{display:"flex",justifyContent:"space-between"}}>
          <span>CVP Grafiği</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setGosterGrafik(g=>!g)}>
            {gosterGrafik?"Gizle":"Göster"}
          </button>
        </div>
        {gosterGrafik && (
          <div style={{overflowX:"auto"}}>
            <svg width="100%" viewBox={`0 0 ${GW+20} ${GH+20}`} style={{minWidth:400}}>
              {/* Izgara */}
              {[0,.25,.5,.75,1].map(t=>(
                <g key={t}>
                  <line x1={PAD} y1={scaleY(maxY*1.05*t)} x2={GW-PAD} y2={scaleY(maxY*1.05*t)}
                    stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4"/>
                  <text x={PAD-4} y={scaleY(maxY*1.05*t)+4} textAnchor="end"
                    style={{fontSize:9,fill:"var(--muted)",fontFamily:"var(--mono)"}}>
                    {(maxY*1.05*t/1000).toFixed(0)}K
                  </text>
                </g>
              ))}

              {/* Sabit gider çizgisi */}
              <line x1={scaleX(0)} y1={scaleY(sabitGider)} x2={scaleX(maxAdet)} y2={scaleY(sabitGider)}
                stroke="var(--muted)" strokeWidth="1" strokeDasharray="6 3"/>

              {/* Toplam maliyet */}
              <polyline points={pts(noktalar,"toplamM")} fill="none" stroke="var(--amber)" strokeWidth="2"/>

              {/* Gelir */}
              <polyline points={pts(noktalar,"gelir")} fill="none" stroke="var(--green)" strokeWidth="2"/>

              {/* Başabaş dikey çizgi */}
              <line x1={scaleX(bbAdet)} y1={PAD} x2={scaleX(bbAdet)} y2={GH-PAD}
                stroke="var(--accent2)" strokeWidth="1.5" strokeDasharray="5 3"/>
              <circle cx={scaleX(bbAdet)} cy={scaleY(bbTL)} r="5" fill="var(--accent2)"/>
              <text x={scaleX(bbAdet)+6} y={scaleY(bbTL)-8}
                style={{fontSize:10,fill:"var(--accent2)",fontFamily:"var(--mono)"}}>
                BB: {bbAdet} adet
              </text>

              {/* Hedef kar noktası */}
              <circle cx={scaleX(hedefAdet)} cy={scaleY(hedefAdet*urun.satisF)} r="5" fill="var(--green)"/>
              <text x={scaleX(hedefAdet)+6} y={scaleY(hedefAdet*urun.satisF)-8}
                style={{fontSize:10,fill:"var(--green)",fontFamily:"var(--mono)"}}>
                Hedef: {hedefAdet} adet
              </text>

              {/* Eksen */}
              <line x1={PAD} y1={PAD} x2={PAD} y2={GH-PAD} stroke="var(--border)" strokeWidth="1"/>
              <line x1={PAD} y1={GH-PAD} x2={GW-PAD} y2={GH-PAD} stroke="var(--border)" strokeWidth="1"/>

              {/* Legend */}
              <line x1={GW-160} y1={22} x2={GW-140} y2={22} stroke="var(--green)"  strokeWidth="2"/>
              <text x={GW-134} y={26} style={{fontSize:10,fill:"var(--muted)",fontFamily:"var(--mono)"}}>Gelir</text>
              <line x1={GW-100} y1={22} x2={GW-80}  y2={22} stroke="var(--amber)"  strokeWidth="2"/>
              <text x={GW-74}  y={26} style={{fontSize:10,fill:"var(--muted)",fontFamily:"var(--mono)"}}>T.Maliyet</text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODÜL 6: BÜTÇE KONTROLÜ ─────────────────────────────────────────────────
const AYLAR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

const BUTCE_VARSAYILAN = {
  urun: "Standart Ürün",
  stdBirimMaliyet: 400,
  satisF: 650,
  aylar: [
    { ay:0, planAdet:800,  gercekAdet:820,  planSabit:60000, gercekSabit:62000, planDegisken:320000, gercekDegisken:336200 },
    { ay:1, planAdet:850,  gercekAdet:790,  planSabit:60000, gercekSabit:59500, planDegisken:340000, gercekDegisken:314100 },
    { ay:2, planAdet:900,  gercekAdet:950,  planSabit:60000, gercekSabit:61000, planDegisken:360000, gercekDegisken:386500 },
    { ay:3, planAdet:920,  gercekAdet:900,  planSabit:62000, gercekSabit:63000, planDegisken:368000, gercekDegisken:361800 },
    { ay:4, planAdet:1000, gercekAdet:1050, planSabit:62000, gercekSabit:64000, planDegisken:400000, gercekDegisken:428100 },
    { ay:5, planAdet:1100, gercekAdet:1080, planSabit:65000, gercekSabit:65500, planDegisken:440000, gercekDegisken:434160 },
  ],
};

function ModulButceKontrol() {
  const [veri, setVeri] = useLocalState("mm_butce", BUTCE_VARSAYILAN);
  const [seciliAy, setSeciliAy]   = useState(0);
  const [gorunum, setGorunum]     = useState("ozet"); // ozet | esnek | trend
  const [duzenle, setDuzenle]     = useState(false);

  const ay = veri.aylar[seciliAy];

  // Hesaplamalar
  const planToplamM  = ay.planSabit  + ay.planDegisken;
  const gercToplamM  = ay.gercekSabit + ay.gercekDegisken;
  const esnek = {
    sabit:    ay.planSabit,  // sabit bütçe değişmez
    degisken: ay.gercekAdet * (ay.planDegisken / Math.max(ay.planAdet,1)),
    toplam:   ay.planSabit  + ay.gercekAdet * (ay.planDegisken / Math.max(ay.planAdet,1)),
  };

  const hacimSapma    = (ay.gercekAdet - ay.planAdet) * (veri.satisF - (ay.planDegisken/Math.max(ay.planAdet,1)));
  const faaliyetSapma = esnek.toplam - gercToplamM;
  const gelirSapma    = (ay.gercekAdet - ay.planAdet) * veri.satisF;

  const planKar  = ay.planAdet  * veri.satisF - planToplamM;
  const gercKar  = ay.gercekAdet * veri.satisF - gercToplamM;
  const karSapma = gercKar - planKar;

  const alanGuncelle = (alan, val) => {
    setVeri(v => ({
      ...v,
      aylar: v.aylar.map((a,i) => i===seciliAy ? {...a, [alan]: +val||0} : a)
    }));
  };

  // Trend verileri
  const trendW = 560, trendH = 160, tPad = 30;
  const aylarData = veri.aylar;
  const maxKar = Math.max(...aylarData.map(a => Math.abs(a.gercekAdet*veri.satisF - a.gercekSabit - a.gercekDegisken)), 1);
  const tScaleX = (i) => tPad + (i / (aylarData.length-1)) * (trendW - tPad*2);
  const tScaleY = (v,mx) => trendH - tPad - ((v + mx) / (mx*2)) * (trendH - tPad*2);

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">🎯 Bütçe Kontrolü</div>
        <div className="section-desc">Sabit bütçe vs gerçekleşen kıyaslaması, esnek bütçe analizi ve hacim/faaliyet sapması ayrıştırması.</div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Aşama 6 — Esnek Bütçe Mantığı</h4>
        <p><strong style={{color:"var(--text)"}}>Sabit bütçe sapması</strong> yanıltıcıdır: üretim arttıysa değişken gider de artar, bu suç değil. <strong style={{color:"var(--text)"}}>Esnek bütçe</strong> gerçekleşen üretime göre yeniden hesaplanır; fark gerçek verimsizliği gösterir.</p>
        <p><span style={{color:"var(--accent2)"}}>Hacim sapması</span> = satış/üretim miktarı farkı (satış sorumlusu). <span style={{color:"var(--amber)"}}>Faaliyet sapması</span> = aynı miktarda standarttan sapma (üretim sorumlusu).</p>
      </div>

      {/* AY SEÇİCİ */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {veri.aylar.map((a,i) => {
          const k = a.gercekAdet*veri.satisF - a.gercekSabit - a.gercekDegisken;
          return (
            <button key={i} className={`btn ${seciliAy===i?"btn-primary":"btn-ghost"}`}
              onClick={()=>{setSeciliAy(i);setDuzenle(false);}}>
              {AYLAR[a.ay]}
              <span style={{fontSize:9,marginLeft:4,color:k>=0?"var(--green)":"var(--red)"}}>
                {k>=0?"▲":"▼"}
              </span>
            </button>
          );
        })}
      </div>

      {/* GÖRÜNÜM SEÇİCİ */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[{k:"ozet",l:"Özet"},{k:"esnek",l:"Esnek Bütçe"},{k:"trend",l:"Trend"}].map(({k,l})=>(
          <button key={k} className={`btn ${gorunum===k?"btn-primary":"btn-ghost"}`} onClick={()=>setGorunum(k)}>{l}</button>
        ))}
        <button className="btn btn-ghost" onClick={()=>setDuzenle(d=>!d)}>✏ Düzenle</button>
        <div style={{marginLeft:"auto"}}>
          <IndirButonlari
            onCSV={()=>{
              const bas = ["Ay","Plan Adet","Gerçek Adet","Plan Sabit","Gerçek Sabit","Plan Değişken","Gerçek Değişken","Plan Kâr","Gerçek Kâr","Kâr Sapması"];
              const sat = veri.aylar.map(a=>{
                const pk = a.planAdet*veri.satisF - a.planSabit - a.planDegisken;
                const gk = a.gercekAdet*veri.satisF - a.gercekSabit - a.gercekDegisken;
                return [AYLAR[a.ay], a.planAdet, a.gercekAdet, a.planSabit, a.gercekSabit, a.planDegisken, a.gercekDegisken, pk.toFixed(2), gk.toFixed(2), (gk-pk).toFixed(2)];
              });
              csvIndir(sat, bas, `butce-kontrol-${new Date().toISOString().slice(0,10)}.csv`);
            }}
            onPDF={async()=>{
              const satirlar = veri.aylar.map(a=>{
                const pk = a.planAdet*veri.satisF - a.planSabit - a.planDegisken;
                const gk = a.gercekAdet*veri.satisF - a.gercekSabit - a.gercekDegisken;
                return [AYLAR[a.ay], a.planAdet, a.gercekAdet, Math.round(pk).toLocaleString("tr-TR")+" TL", Math.round(gk).toLocaleString("tr-TR")+" TL", (gk-pk>=0?"+":"")+Math.round(gk-pk).toLocaleString("tr-TR")+" TL"];
              });
              await pdfIndir("Bütçe Kontrol Raporu", [{
                altBaslik: "Aylık Plan / Gerçekleşen Karşılaştırması",
                kolonlar: ["Ay","Plan Adet","Gerçek Adet","Plan Kâr","Gerçek Kâr","Kâr Sapması"],
                satirlar,
              }], `butce-kontrol-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
            }}
          />
        </div>
      </div>

      {/* ÖZET GÖRÜNÜM */}
      {gorunum==="ozet" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
            {[
              {label:"Plan Adet",    v:`${ay.planAdet} adet`,       renk:"var(--muted)"},
              {label:"Gerçek Adet",  v:`${ay.gercekAdet} adet`,     renk:"var(--text)"},
              {label:"Plan Kâr",     v:formatTL(planKar),            renk:"var(--accent2)"},
              {label:"Gerçek Kâr",   v:formatTL(gercKar),            renk:gercKar>=0?"var(--green)":"var(--red)"},
            ].map(({label,v,renk})=>(
              <div key={label} className="stat-card">
                <div className="stat-label">{label}</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--mono)",color:renk,marginTop:4}}>{v}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Kâr Sapması Analizi — {AYLAR[ay.ay]}</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Kalem</th><th>Sabit Bütçe</th><th>Gerçekleşen</th><th>Sapma</th><th>Yorum</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{fontWeight:500}}>Gelir</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.planAdet*veri.satisF)}</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.gercekAdet*veri.satisF)}</td>
                    <td><span style={{fontFamily:"var(--mono)",fontSize:12,color:gelirSapma>=0?"var(--green)":"var(--red)",fontWeight:600}}>{gelirSapma>=0?"+":""}{formatTL(gelirSapma)}</span></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>{Math.abs(ay.gercekAdet-ay.planAdet)} adet {ay.gercekAdet>ay.planAdet?"fazla":"eksik"}</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>Sabit Gider</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.planSabit)}</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.gercekSabit)}</td>
                    <td><span style={{fontFamily:"var(--mono)",fontSize:12,color:(ay.planSabit-ay.gercekSabit)>=0?"var(--green)":"var(--red)",fontWeight:600}}>{(ay.planSabit-ay.gercekSabit)>=0?"+":""}{formatTL(ay.planSabit-ay.gercekSabit)}</span></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>Kontrol edilebilir</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>Değişken Gider</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.planDegisken)}</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.gercekDegisken)}</td>
                    <td><span style={{fontFamily:"var(--mono)",fontSize:12,color:(ay.planDegisken-ay.gercekDegisken)>=0?"var(--green)":"var(--red)",fontWeight:600}}>{(ay.planDegisken-ay.gercekDegisken)>=0?"+":""}{formatTL(ay.planDegisken-ay.gercekDegisken)}</span></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>Hacim etkisi var</td>
                  </tr>
                  <tr style={{background:"var(--surface2)"}}>
                    <td style={{fontWeight:700}}>NET KÂR SAPMASI</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600}}>{formatTL(planKar)}</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600,color:gercKar>=0?"var(--green)":"var(--red)"}}>{formatTL(gercKar)}</td>
                    <td><span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:karSapma>=0?"var(--green)":"var(--red)"}}>{karSapma>=0?"+":""}{formatTL(karSapma)}</span></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ESNEK BÜTÇE GÖRÜNÜM */}
      {gorunum==="esnek" && (
        <div className="card">
          <div className="card-title">Esnek Bütçe Analizi — {AYLAR[ay.ay]}</div>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:14,padding:"10px 14px",background:"rgba(79,142,247,.06)",borderRadius:8,border:"1px solid rgba(79,142,247,.2)"}}>
            Esnek bütçe gerçekleşen <strong style={{color:"var(--accent2)"}}>{ay.gercekAdet} adet</strong> üretim üzerinden hesaplandı.
            Değişken gider birim maliyeti: {formatTL(ay.planDegisken/Math.max(ay.planAdet,1))}/adet
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Kalem</th><th>Sabit Bütçe ({ay.planAdet} adet)</th><th>Esnek Bütçe ({ay.gercekAdet} adet)</th><th>Gerçekleşen</th><th>Faaliyet Sapması</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{fontWeight:500}}>Sabit Gider</td>
                  <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.planSabit)}</td>
                  <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(esnek.sabit)}</td>
                  <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.gercekSabit)}</td>
                  <td><span style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:600,color:(esnek.sabit-ay.gercekSabit)>=0?"var(--green)":"var(--red)"}}>{(esnek.sabit-ay.gercekSabit)>=0?"+":""}{formatTL(esnek.sabit-ay.gercekSabit)}</span></td>
                </tr>
                <tr>
                  <td style={{fontWeight:500}}>Değişken Gider</td>
                  <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.planDegisken)}</td>
                  <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(esnek.degisken)}</td>
                  <td style={{fontFamily:"var(--mono)"}}>{formatTL(ay.gercekDegisken)}</td>
                  <td><span style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:600,color:(esnek.degisken-ay.gercekDegisken)>=0?"var(--green)":"var(--red)"}}>{(esnek.degisken-ay.gercekDegisken)>=0?"+":""}{formatTL(esnek.degisken-ay.gercekDegisken)}</span></td>
                </tr>
                <tr style={{background:"var(--surface2)"}}>
                  <td style={{fontWeight:700}}>Toplam</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:600}}>{formatTL(planToplamM)}</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--accent2)"}}>{formatTL(esnek.toplam)}</td>
                  <td style={{fontFamily:"var(--mono)",fontWeight:600}}>{formatTL(gercToplamM)}</td>
                  <td><span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:faaliyetSapma>=0?"var(--green)":"var(--red)"}}>{faaliyetSapma>=0?"+":""}{formatTL(faaliyetSapma)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
            <div style={{padding:"14px 16px",background:"rgba(79,142,247,.06)",borderRadius:8,border:"1px solid rgba(79,142,247,.15)"}}>
              <div style={{fontSize:10,color:"var(--accent2)",fontFamily:"var(--mono)",textTransform:"uppercase",marginBottom:6}}>Hacim Sapması (KM etkisi)</div>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--mono)",color:hacimSapma>=0?"var(--green)":"var(--red)"}}>{hacimSapma>=0?"+":""}{formatTL(hacimSapma)}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Satış/Üretim miktarı farkından — Satış sorumlusu</div>
            </div>
            <div style={{padding:"14px 16px",background:"rgba(240,180,41,.06)",borderRadius:8,border:"1px solid rgba(240,180,41,.15)"}}>
              <div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--mono)",textTransform:"uppercase",marginBottom:6}}>Faaliyet Sapması (verimlilik)</div>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--mono)",color:faaliyetSapma>=0?"var(--green)":"var(--red)"}}>{faaliyetSapma>=0?"+":""}{formatTL(faaliyetSapma)}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Aynı hacimde standarttan sapma — Üretim sorumlusu</div>
            </div>
          </div>
        </div>
      )}

      {/* TREND GÖRÜNÜM */}
      {gorunum==="trend" && (
        <div className="card">
          <div className="card-title">Aylık Kâr Trendi</div>
          <svg width="100%" viewBox={`0 0 ${trendW+20} ${trendH+20}`} style={{minWidth:320}}>
            <line x1={tPad} y1={trendH-tPad} x2={trendW-tPad} y2={trendH-tPad} stroke="var(--border)" strokeWidth="1"/>
            <line x1={tPad} y1={tPad} x2={tPad} y2={trendH-tPad} stroke="var(--border)" strokeWidth="1"/>
            <line x1={tPad} y1={tScaleY(0,maxKar)} x2={trendW-tPad} y2={tScaleY(0,maxKar)} stroke="var(--border2)" strokeWidth="0.5" strokeDasharray="4 4"/>

            {aylarData.map((a,i) => {
              const planK = a.planAdet*veri.satisF - a.planSabit - a.planDegisken;
              const gercK = a.gercekAdet*veri.satisF - a.gercekSabit - a.gercekDegisken;
              const x = tScaleX(i);
              return (
                <g key={i}>
                  <circle cx={x} cy={tScaleY(planK,maxKar)} r="4" fill="var(--accent2)" opacity=".7"/>
                  <circle cx={x} cy={tScaleY(gercK,maxKar)} r="4" fill={gercK>=0?"var(--green)":"var(--red)"}/>
                  <text x={x} y={trendH-tPad+14} textAnchor="middle" style={{fontSize:9,fill:"var(--muted)",fontFamily:"var(--mono)"}}>{AYLAR[a.ay]}</text>
                  {i < aylarData.length-1 && (() => {
                    const nx = tScaleX(i+1);
                    const nextPlanK = aylarData[i+1].planAdet*veri.satisF - aylarData[i+1].planSabit - aylarData[i+1].planDegisken;
                    const nextGercK = aylarData[i+1].gercekAdet*veri.satisF - aylarData[i+1].gercekSabit - aylarData[i+1].gercekDegisken;
                    return (
                      <>
                        <line x1={x} y1={tScaleY(planK,maxKar)} x2={nx} y2={tScaleY(nextPlanK,maxKar)} stroke="var(--accent2)" strokeWidth="1.5" opacity=".5"/>
                        <line x1={x} y1={tScaleY(gercK,maxKar)} x2={nx} y2={tScaleY(nextGercK,maxKar)} stroke={gercK>=0?"var(--green)":"var(--red)"} strokeWidth="2"/>
                      </>
                    );
                  })()}
                </g>
              );
            })}
            <circle cx={trendW-80} cy={20} r="4" fill="var(--accent2)" opacity=".7"/>
            <text x={trendW-72} y={24} style={{fontSize:9,fill:"var(--muted)",fontFamily:"var(--mono)"}}>Plan</text>
            <circle cx={trendW-40} cy={20} r="4" fill="var(--green)"/>
            <text x={trendW-32} y={24} style={{fontSize:9,fill:"var(--muted)",fontFamily:"var(--mono)"}}>Gerçek</text>
          </svg>
        </div>
      )}

      {/* DÜZENLEME */}
      {duzenle && (
        <div className="card">
          <div className="card-title">Veri Düzenle — {AYLAR[ay.ay]}</div>
          <div className="form-grid">
            {[
              {k:"planAdet",      label:"Plan Adet"},
              {k:"gercekAdet",    label:"Gerçek Adet"},
              {k:"planSabit",     label:"Plan Sabit Gider (TL)"},
              {k:"gercekSabit",   label:"Gerçek Sabit Gider (TL)"},
              {k:"planDegisken",  label:"Plan Değişken Gider (TL)"},
              {k:"gercekDegisken",label:"Gerçek Değişken Gider (TL)"},
            ].map(({k,label})=>(
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input className="form-input" type="number" value={ay[k]} onChange={e=>alanGuncelle(k,e.target.value)}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODÜL: SAFHA MALİYETİ ───────────────────────────────────────────────────
const SAFHA_VARSAYILAN = [
  {
    id: 1, ad: "Karıştırma",
    donemBasiYM: 200, donemBasiTamamlanma: 60,
    donemGiren: 1800,
    donemTamamlanan: 1600,
    donemSonuYM: 400, donemSonuTamamlanma: 50,
    malzemeMaliyet: 180000,
    iscilikMaliyet: 96000,
    gugMaliyet: 48000,
    oncekiSafhaMaliyet: 0,
  },
  {
    id: 2, ad: "Pişirme",
    donemBasiYM: 150, donemBasiTamamlanma: 40,
    donemGiren: 1600,
    donemTamamlanan: 1500,
    donemSonuYM: 300, donemSonuTamamlanma: 70,
    malzemeMaliyet: 0,
    iscilikMaliyet: 120000,
    gugMaliyet: 60000,
    oncekiSafhaMaliyet: 324000,
  },
];

function ModulSafhaMaliyet() {
  const [safhalar, setSafhalar] = useLocalState("mm_safhalar", SAFHA_VARSAYILAN);
  const [secili, setSecili]     = useState(1);
  const [duzenle, setDuzenle]   = useState(false);
  const [form, setForm]         = useState(null);

  const safha = safhalar.find(s => s.id === secili);

  const hesapla = (s) => {
    // Eşdeğer birim (ağırlıklı ortalama yöntemi)
    const ebMalzeme  = s.donemTamamlanan + s.donemSonuYM * (s.malzemeMaliyet > 0 ? s.donemSonuTamamlanma / 100 : 1);
    const ebIscilik  = s.donemTamamlanan + s.donemSonuYM * (s.donemSonuTamamlanma / 100);
    const ebGug      = ebIscilik;

    // Toplam maliyet havuzu
    const toplamMalzeme = s.malzemeMaliyet;
    const toplamIscilik = s.iscilikMaliyet;
    const toplamGug     = s.gugMaliyet;
    const toplamOnceki  = s.oncekiSafhaMaliyet;
    const toplamHavuz   = toplamMalzeme + toplamIscilik + toplamGug + toplamOnceki;

    // Birim maliyet
    const bmMalzeme  = ebMalzeme  > 0 ? toplamMalzeme / ebMalzeme  : 0;
    const bmIscilik  = ebIscilik  > 0 ? toplamIscilik / ebIscilik  : 0;
    const bmGug      = ebGug      > 0 ? toplamGug     / ebGug      : 0;
    const bmOnceki   = s.donemTamamlanan + s.donemSonuYM > 0 ? toplamOnceki / (s.donemTamamlanan + s.donemSonuYM) : 0;
    const bmToplam   = bmMalzeme + bmIscilik + bmGug + bmOnceki;

    // Dağıtım
    const tamamlananMaliyet = s.donemTamamlanan * bmToplam;
    const ymMaliyet = s.donemSonuYM * (
      (s.malzemeMaliyet > 0 ? bmMalzeme * (s.donemSonuTamamlanma/100) : 0) +
      bmIscilik * (s.donemSonuTamamlanma/100) +
      bmGug     * (s.donemSonuTamamlanma/100) +
      bmOnceki
    );
    const kontrolToplam = tamamlananMaliyet + ymMaliyet;

    return { ebMalzeme, ebIscilik, ebGug, bmMalzeme, bmIscilik, bmGug, bmOnceki, bmToplam, tamamlananMaliyet, ymMaliyet, toplamHavuz, kontrolToplam };
  };

  const h = safha ? hesapla(safha) : null;

  const baslaDuzenle = () => { setForm({...safha}); setDuzenle(true); };
  const kaydet = () => {
    setSafhalar(ss => ss.map(s => s.id === form.id ? {
      ...form,
      donemBasiYM:+form.donemBasiYM, donemBasiTamamlanma:+form.donemBasiTamamlanma,
      donemGiren:+form.donemGiren, donemTamamlanan:+form.donemTamamlanan,
      donemSonuYM:+form.donemSonuYM, donemSonuTamamlanma:+form.donemSonuTamamlanma,
      malzemeMaliyet:+form.malzemeMaliyet, iscilikMaliyet:+form.iscilikMaliyet,
      gugMaliyet:+form.gugMaliyet, oncekiSafhaMaliyet:+form.oncekiSafhaMaliyet,
    } : s));
    setDuzenle(false);
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div className="section-title">🏭 Safha Maliyeti Yöntemi</div>
        <div className="section-desc">
          Sürekli ve homojen üretimde dönem maliyetlerini eşdeğer birime bölerek birim maliyet hesaplayın.
          Tamamlanan ve yarı mamul ürünlere paylaştırın.
        </div>
      </div>

      <div className="lesson-box">
        <h4>⚡ Safha Maliyeti — Temel Akış</h4>
        <p>
          <strong style={{color:"var(--text)"}}>1. Fiziksel akış:</strong> Dönem başı YM + Giren = Tamamlanan + Dönem sonu YM.{" "}
          <strong style={{color:"var(--text)"}}>2. Eşdeğer birim:</strong> Tamamlanan + (Dönem sonu YM × Tamamlanma %).{" "}
          <strong style={{color:"var(--text)"}}>3. Birim maliyet:</strong> Toplam maliyet ÷ Eşdeğer birim.
        </p>
        <p>
          <span style={{color:"var(--amber)"}}>Yarı mamul</span> = üretim sürecinde olan, henüz tamamlanmamış ürün.
          Tamamlanma yüzdesi malzeme, işçilik ve GÜG için farklı olabilir — genellikle malzeme başta tam yüklenir, işçilik ve GÜG süreç boyunca.
        </p>
      </div>

      {/* SAFHA SEÇİCİ */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        {safhalar.map(s => (
          <button key={s.id}
            className={`btn ${secili===s.id?"btn-primary":"btn-ghost"}`}
            onClick={()=>{setSecili(s.id);setDuzenle(false);}}>
            {s.id}. Safha: {s.ad}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={()=>{
          const id = safhalar.length+1;
          setSafhalar(ss=>[...ss,{id,ad:`Safha ${id}`,donemBasiYM:0,donemBasiTamamlanma:0,donemGiren:1000,donemTamamlanan:900,donemSonuYM:100,donemSonuTamamlanma:50,malzemeMaliyet:100000,iscilikMaliyet:50000,gugMaliyet:25000,oncekiSafhaMaliyet:0}]);
          setSecili(id);
        }}>+ Safha Ekle</button>
        {safha && h && (
          <div style={{marginLeft:"auto"}}>
            <IndirButonlari
              onCSV={()=>{
                const bas = ["Kalem","Değer"];
                const sat = [
                  ["Safha",safha.ad],
                  ["Dönem Başı YM",safha.donemBasiYM+" adet (%"+safha.donemBasiTamamlanma+")"],
                  ["Dönemde Giren",safha.donemGiren+" adet"],
                  ["Tamamlanan",safha.donemTamamlanan+" adet"],
                  ["Dönem Sonu YM",safha.donemSonuYM+" adet (%"+safha.donemSonuTamamlanma+")"],
                  ["Toplam Maliyet Havuzu",h.toplamHavuz.toFixed(2)+" TL"],
                  ["Eşdeğer Birim (İşçilik)",Math.round(h.ebIscilik)],
                  ["Birim Maliyet",h.bmToplam.toFixed(4)+" TL"],
                  ["Tamamlanan Maliyet",h.tamamlananMaliyet.toFixed(2)+" TL"],
                  ["Dönem Sonu YM Maliyeti",h.ymMaliyet.toFixed(2)+" TL"],
                ];
                csvIndir(sat, bas, `safha-maliyeti-${safha.ad}-${new Date().toISOString().slice(0,10)}.csv`);
              }}
              onPDF={async()=>{
                await pdfIndir(`Safha Maliyeti — ${safha.ad}`, [
                  { altBaslik:"Fiziksel Akım", kolonlar:["Kalem","Giriş","Çıkış"], satirlar:[
                    ["Dönem Başı YM / Tamamlanan", safha.donemBasiYM+" adet", safha.donemTamamlanan+" adet"],
                    ["Dönemde Giren / Dönem Sonu YM", safha.donemGiren+" adet", safha.donemSonuYM+" adet (%"+safha.donemSonuTamamlanma+")"],
                  ]},
                  { altBaslik:"Birim Maliyet Hesabı", kolonlar:["Maliyet Unsuru","Toplam","Eşdeğer Birim","Birim Maliyet"], satirlar:[
                    ["Direkt Malzeme", safha.malzemeMaliyet.toLocaleString("tr-TR")+" TL", Math.round(h.ebMalzeme), h.bmMalzeme.toFixed(2)+" TL"],
                    ["Direkt İşçilik", safha.iscilikMaliyet.toLocaleString("tr-TR")+" TL", Math.round(h.ebIscilik), h.bmIscilik.toFixed(2)+" TL"],
                    ["GÜG", safha.gugMaliyet.toLocaleString("tr-TR")+" TL", Math.round(h.ebGug), h.bmGug.toFixed(2)+" TL"],
                    ["TOPLAM", Math.round(h.toplamHavuz).toLocaleString("tr-TR")+" TL", "", h.bmToplam.toFixed(2)+" TL"],
                  ]},
                  { altBaslik:"Maliyet Dağıtımı", kolonlar:["Kalem","Tutar"], satirlar:[
                    ["Tamamlanan ("+safha.donemTamamlanan+" adet)", Math.round(h.tamamlananMaliyet).toLocaleString("tr-TR")+" TL"],
                    ["Dönem Sonu YM ("+safha.donemSonuYM+" adet)", Math.round(h.ymMaliyet).toLocaleString("tr-TR")+" TL"],
                  ]},
                ], `safha-maliyeti-${new Date().toISOString().slice(0,10)}.pdf`, "Maliyet Muhasebesi Uzmanlaşma Programı");
              }}
            />
          </div>
        )}
      </div>

      {safha && h && !duzenle && (
        <>
          {/* ÖZET STAT */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Toplam Maliyet Havuzu</div>
              <div className="stat-value amber">{formatTL(h.toplamHavuz)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Birim Maliyet</div>
              <div className="stat-value green">{formatTL(h.bmToplam)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tamamlanan ({safha.donemTamamlanan} adet)</div>
              <div className="stat-value blue">{formatTL(h.tamamlananMaliyet)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Dönem Sonu YM ({safha.donemSonuYM} adet)</div>
              <div className="stat-value amber">{formatTL(h.ymMaliyet)}</div>
            </div>
          </div>

          {/* FİZİKSEL AKIM TABLOSU */}
          <div className="card">
            <div className="card-title">1. Fiziksel Akım Tablosu</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Giriş</th><th>Adet</th><th>Çıkış</th><th>Adet</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Dönem başı yarı mamul</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--amber)"}}>{safha.donemBasiYM} <span style={{fontSize:10,opacity:.6}}>(%{safha.donemBasiTamamlanma})</span></td>
                    <td>Tamamlanan ve devredilen</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--green)",fontWeight:600}}>{safha.donemTamamlanan}</td>
                  </tr>
                  <tr>
                    <td>Dönemde giren</td>
                    <td style={{fontFamily:"var(--mono)"}}>{safha.donemGiren}</td>
                    <td>Dönem sonu yarı mamul</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--amber)",fontWeight:600}}>{safha.donemSonuYM} <span style={{fontSize:10,opacity:.6}}>(%{safha.donemSonuTamamlanma})</span></td>
                  </tr>
                  <tr style={{background:"var(--surface2)"}}>
                    <td style={{fontWeight:600}}>TOPLAM GİRİŞ</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--accent2)"}}>{safha.donemBasiYM + safha.donemGiren}</td>
                    <td style={{fontWeight:600}}>TOPLAM ÇIKIŞ</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--accent2)"}}>{safha.donemTamamlanan + safha.donemSonuYM}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {safha.donemBasiYM + safha.donemGiren !== safha.donemTamamlanan + safha.donemSonuYM && (
              <div style={{fontSize:12,color:"var(--red)",marginTop:8,padding:"6px 10px",background:"rgba(255,85,85,.08)",borderRadius:6}}>
                ⚠ Fiziksel akım denklemi tutmuyor: Giriş ≠ Çıkış. Verileri kontrol edin.
              </div>
            )}
          </div>

          {/* EŞDEĞer BİRİM TABLOSU */}
          <div className="card">
            <div className="card-title">2. Eşdeğer Birim Hesabı</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Maliyet Unsuru</th><th>Tamamlanan</th><th>+ Dönem Sonu YM × %</th><th>= Eşdeğer Birim</th></tr>
                </thead>
                <tbody>
                  {safha.malzemeMaliyet > 0 && (
                    <tr>
                      <td style={{fontWeight:500}}>Direkt Malzeme</td>
                      <td style={{fontFamily:"var(--mono)"}}>{safha.donemTamamlanan}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>
                        {safha.donemSonuYM} × %{safha.donemSonuTamamlanma} = {Math.round(safha.donemSonuYM * safha.donemSonuTamamlanma/100)}
                      </td>
                      <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--green)"}}>{Math.round(h.ebMalzeme)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{fontWeight:500}}>Direkt İşçilik</td>
                    <td style={{fontFamily:"var(--mono)"}}>{safha.donemTamamlanan}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>
                      {safha.donemSonuYM} × %{safha.donemSonuTamamlanma} = {Math.round(safha.donemSonuYM * safha.donemSonuTamamlanma/100)}
                    </td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--green)"}}>{Math.round(h.ebIscilik)}</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>GÜG</td>
                    <td style={{fontFamily:"var(--mono)"}}>{safha.donemTamamlanan}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>
                      {safha.donemSonuYM} × %{safha.donemSonuTamamlanma} = {Math.round(safha.donemSonuYM * safha.donemSonuTamamlanma/100)}
                    </td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--green)"}}>{Math.round(h.ebGug)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BİRİM MALİYET & DAĞITIM */}
          <div className="card">
            <div className="card-title">3. Birim Maliyet ve Maliyet Dağıtımı</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Maliyet Unsuru</th><th>Toplam Maliyet</th><th>Eşdeğer Birim</th><th>Birim Maliyet</th></tr>
                </thead>
                <tbody>
                  {safha.oncekiSafhaMaliyet > 0 && (
                    <tr>
                      <td style={{fontWeight:500}}>Önceki Safha Maliyeti</td>
                      <td style={{fontFamily:"var(--mono)"}}>{formatTL(safha.oncekiSafhaMaliyet)}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--muted)"}}>{safha.donemTamamlanan + safha.donemSonuYM}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(h.bmOnceki)}</td>
                    </tr>
                  )}
                  {safha.malzemeMaliyet > 0 && (
                    <tr>
                      <td style={{fontWeight:500}}>Direkt Malzeme</td>
                      <td style={{fontFamily:"var(--mono)"}}>{formatTL(safha.malzemeMaliyet)}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--muted)"}}>{Math.round(h.ebMalzeme)}</td>
                      <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(h.bmMalzeme)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{fontWeight:500}}>Direkt İşçilik</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(safha.iscilikMaliyet)}</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--muted)"}}>{Math.round(h.ebIscilik)}</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(h.bmIscilik)}</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight:500}}>GÜG</td>
                    <td style={{fontFamily:"var(--mono)"}}>{formatTL(safha.gugMaliyet)}</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--muted)"}}>{Math.round(h.ebGug)}</td>
                    <td style={{fontFamily:"var(--mono)",color:"var(--accent2)"}}>{formatTL(h.bmGug)}</td>
                  </tr>
                  <tr style={{background:"var(--surface2)"}}>
                    <td style={{fontWeight:700}}>TOPLAM</td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--amber)"}}>{formatTL(h.toplamHavuz)}</td>
                    <td></td>
                    <td style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)",fontSize:15}}>{formatTL(h.bmToplam)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="divider"/>
            <div className="card-title">Maliyet Dağıtımı</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{padding:"14px 16px",background:"rgba(62,207,142,.06)",borderRadius:8,border:"1px solid rgba(62,207,142,.2)"}}>
                <div style={{fontSize:10,color:"var(--green)",fontFamily:"var(--mono)",textTransform:"uppercase",marginBottom:6}}>
                  Tamamlanan ve Devredilen
                </div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>{safha.donemTamamlanan} adet × {formatTL(h.bmToplam)}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--mono)",color:"var(--green)"}}>{formatTL(h.tamamlananMaliyet)}</div>
              </div>
              <div style={{padding:"14px 16px",background:"rgba(240,180,41,.06)",borderRadius:8,border:"1px solid rgba(240,180,41,.2)"}}>
                <div style={{fontSize:10,color:"var(--amber)",fontFamily:"var(--mono)",textTransform:"uppercase",marginBottom:6}}>
                  Dönem Sonu Yarı Mamul
                </div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>{safha.donemSonuYM} adet × %{safha.donemSonuTamamlanma} tamamlanma</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"var(--mono)",color:"var(--amber)"}}>{formatTL(h.ymMaliyet)}</div>
              </div>
            </div>

            {/* KONTROL */}
            <div style={{marginTop:12,padding:"10px 14px",background:"var(--surface2)",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"var(--muted)"}}>Kontrol: Tamamlanan + YM = Toplam Havuz</span>
              <span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:600,
                color:Math.abs(h.kontrolToplam - h.toplamHavuz) < 1 ? "var(--green)" : "var(--red)"}}>
                {formatTL(h.kontrolToplam)} {Math.abs(h.kontrolToplam - h.toplamHavuz) < 1 ? "✓ Eşit" : "✗ Fark var"}
              </span>
            </div>
          </div>

          <div style={{marginTop:14,textAlign:"right"}}>
            <button className="btn btn-ghost" onClick={baslaDuzenle}>✏ Değerleri Düzenle</button>
          </div>
        </>
      )}

      {/* DÜZENLEME FORMU */}
      {duzenle && form && (
        <div className="card">
          <div className="card-title">Safha Verilerini Düzenle — {form.ad}</div>
          <div className="form-grid">
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Safha Adı</label>
              <input className="form-input" value={form.ad} onChange={e=>setForm(f=>({...f,ad:e.target.value}))}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:12}}>
            {[
              {title:"Fiziksel Akım", fields:[
                {k:"donemBasiYM",         label:"Dönem Başı YM (adet)"},
                {k:"donemBasiTamamlanma", label:"Dönem Başı Tamamlanma (%)"},
                {k:"donemGiren",          label:"Dönemde Giren (adet)"},
                {k:"donemTamamlanan",     label:"Tamamlanan ve Devredilen"},
                {k:"donemSonuYM",         label:"Dönem Sonu YM (adet)"},
                {k:"donemSonuTamamlanma", label:"Dönem Sonu Tamamlanma (%)"},
              ]},
              {title:"Maliyet Havuzu", fields:[
                {k:"oncekiSafhaMaliyet",  label:"Önceki Safha Maliyeti (TL)"},
                {k:"malzemeMaliyet",      label:"Direkt Malzeme (TL)"},
                {k:"iscilikMaliyet",      label:"Direkt İşçilik (TL)"},
                {k:"gugMaliyet",          label:"GÜG (TL)"},
              ]},
            ].map(({title,fields})=>(
              <div key={title}>
                <div style={{fontSize:11,color:"var(--accent2)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>{title}</div>
                {fields.map(({k,label})=>(
                  <div key={k} className="form-group" style={{marginBottom:10}}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" type="number" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button className="btn btn-primary" onClick={kaydet}>Kaydet</button>
            <button className="btn btn-ghost" onClick={()=>setDuzenle(false)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}
