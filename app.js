(() => {
  'use strict';

  const KEY = 'invoice-builder:v1';
  const now = new Date();

  const iso = (d) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

  const defaults = () => ({
    logo: '',
    accent: '#1f5eff',
    currency: 'IDR',
    from: {
      name: 'Nama Usaha Anda',
      address: 'Jl. Contoh No. 1\nKota, Provinsi 00000',
      contact: 'halo@usahaanda.id\n0812-0000-0000'
    },
    to: {
      name: 'Nama Klien',
      address: 'Alamat klien',
      contact: ''
    },
    number: 'INV-' + now.getFullYear() + '-001',
    date: iso(now),
    due: iso(addDays(now, 14)),
    items: [
      { desc: 'Jasa pembuatan website', qty: 1, price: 5000000 },
      { desc: 'Hosting dan domain (1 tahun)', qty: 1, price: 750000 }
    ],
    discount: 0,
    tax: 11,
    payment: 'Bank BCA 000 000 0000\na.n. Nama Usaha Anda',
    notes: 'Terima kasih atas kepercayaan Anda.',
    signer: ''
  });

  let state = load();

  function load() {
    const base = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      return Object.assign(base, saved, {
        from: Object.assign(base.from, saved.from),
        to: Object.assign(base.to, saved.to),
        items: Array.isArray(saved.items) && saved.items.length ? saved.items : base.items
      });
    } catch (e) {
      return base;
    }
  }

  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* penyimpanan penuh atau diblokir */ }
    }, 250);
  }

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const multi = (s) => esc(s).replace(/\n/g, '<br>');

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => {
    const keys = p.split('.');
    const last = keys.pop();
    const target = keys.reduce((a, k) => a[k], o);
    target[last] = v;
  };

  const money = (n) => {
    const d = state.currency === 'IDR' ? 0 : 2;
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: state.currency,
        minimumFractionDigits: d, maximumFractionDigits: d
      }).format(n || 0);
    } catch (e) {
      return String(n);
    }
  };

  const dateLong = (v) => {
    if (!v) return '-';
    const d = new Date(v + 'T00:00:00');
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  function terbilang(num) {
    const n0 = Math.floor(Math.abs(num));
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const t = (n) => {
      if (n < 12) return s[n];
      if (n < 20) return s[n - 10] + ' belas';
      if (n < 100) return s[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + s[n % 10] : '');
      if (n < 200) return 'seratus' + (n % 100 ? ' ' + t(n % 100) : '');
      if (n < 1000) return s[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + t(n % 100) : '');
      if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + t(n % 1000) : '');
      if (n < 1e6) return t(Math.floor(n / 1e3)) + ' ribu' + (n % 1e3 ? ' ' + t(n % 1e3) : '');
      if (n < 1e9) return t(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + t(n % 1e6) : '');
      if (n < 1e12) return t(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + t(n % 1e9) : '');
      return t(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + t(n % 1e12) : '');
    };
    return n0 === 0 ? 'nol' : t(n0);
  }

  function totals() {
    const subtotal = state.items.reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
    const discount = subtotal * (Number(state.discount) || 0) / 100;
    const after = subtotal - discount;
    const tax = after * (Number(state.tax) || 0) / 100;
    return { subtotal, discount, tax, total: after + tax };
  }

  // ---------- render invoice ----------
  function renderPaper() {
    const paper = $('#paper');
    paper.style.setProperty('--accent', state.accent || '#1f5eff');
    const t = totals();

    const rows = state.items.map((i) => {
      const line = (Number(i.qty) || 0) * (Number(i.price) || 0);
      return '<tr>' +
        '<td>' + multi(i.desc) + '</td>' +
        '<td class="c">' + esc(i.qty) + '</td>' +
        '<td class="r">' + money(Number(i.price) || 0) + '</td>' +
        '<td class="r">' + money(line) + '</td>' +
        '</tr>';
    }).join('');

    const logo = state.logo ? '<img class="inv-logo" alt="Logo" src="' + esc(state.logo) + '">' : '';

    const discRow = Number(state.discount) ? '<tr><td>Diskon (' + esc(state.discount) + '%)</td><td>-' + money(t.discount) + '</td></tr>' : '';
    const taxRow = Number(state.tax) ? '<tr><td>Pajak (' + esc(state.tax) + '%)</td><td>' + money(t.tax) + '</td></tr>' : '';

    const words = state.currency === 'IDR'
      ? '<div class="inv-words">Terbilang: ' + esc(terbilang(t.total)) + ' rupiah</div>'
      : '';

    const pay = state.payment ? '<div><div class="label">Pembayaran</div><div>' + multi(state.payment) + '</div></div>' : '<div></div>';
    const notes = state.notes ? '<div><div class="label">Catatan</div><div>' + multi(state.notes) + '</div></div>' : '<div></div>';
    const sign = state.signer
      ? '<div class="inv-sign"><div class="space"></div><div class="who">' + esc(state.signer) + '</div></div>'
      : '';

    paper.innerHTML =
      '<div class="inv-head">' +
        '<div class="inv-from">' + logo +
          '<div><div class="name">' + esc(state.from.name) + '</div>' +
          '<div class="small">' + multi(state.from.address) + '</div>' +
          '<div class="small">' + multi(state.from.contact) + '</div></div>' +
        '</div>' +
        '<div class="inv-title"><h2>INVOICE</h2><div class="num">' + esc(state.number) + '</div></div>' +
      '</div>' +
      '<div class="inv-rule"></div>' +
      '<div class="inv-meta">' +
        '<div class="inv-to"><div class="label">Ditagihkan kepada</div>' +
          '<div class="val">' + esc(state.to.name) + '</div>' +
          '<div class="small">' + multi(state.to.address) + '</div>' +
          '<div class="small">' + multi(state.to.contact) + '</div></div>' +
        '<div><div class="label">Tanggal</div><div class="val">' + dateLong(state.date) + '</div></div>' +
        '<div><div class="label">Jatuh tempo</div><div class="val">' + dateLong(state.due) + '</div></div>' +
      '</div>' +
      '<table class="inv-table"><thead><tr>' +
        '<th>Deskripsi</th><th class="c">Qty</th><th class="r">Harga</th><th class="r">Jumlah</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="inv-totals"><table>' +
        '<tr><td>Subtotal</td><td>' + money(t.subtotal) + '</td></tr>' +
        discRow + taxRow +
        '<tr class="grand"><td>Total</td><td>' + money(t.total) + '</td></tr>' +
      '</table></div>' +
      words +
      '<div class="inv-foot">' + pay + notes + sign + '</div>';
  }

  // ---------- editor: simple fields ----------
  function bindFields() {
    $$('[data-bind]').forEach((el) => {
      const path = el.dataset.bind;
      const v = getPath(state, path);
      el.value = v == null ? '' : v;
      el.addEventListener('input', () => {
        const val = el.dataset.type === 'number' ? (el.value === '' ? 0 : Number(el.value)) : el.value;
        setPath(state, path, val);
        renderPaper();
        save();
      });
    });
  }

  // ---------- editor: items ----------
  function renderItems() {
    const box = $('#items');
    box.innerHTML = '';

    const labels = document.createElement('div');
    labels.className = 'item-labels';
    labels.innerHTML = '<span>Deskripsi</span><span>Qty</span><span>Harga satuan</span><span></span>';
    box.appendChild(labels);

    state.items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML =
        '<input class="desc" type="text" aria-label="Deskripsi item ' + (idx + 1) + '">' +
        '<input class="qty" type="number" min="0" step="any" inputmode="decimal" aria-label="Jumlah">' +
        '<input class="price" type="number" min="0" step="any" inputmode="decimal" aria-label="Harga satuan">' +
        '<button type="button" class="rm" aria-label="Hapus item ' + (idx + 1) + '">&times;</button>';

      const desc = $('.desc', row), qty = $('.qty', row), price = $('.price', row);
      desc.value = item.desc;
      qty.value = item.qty;
      price.value = item.price;

      desc.addEventListener('input', () => { item.desc = desc.value; renderPaper(); save(); });
      qty.addEventListener('input', () => { item.qty = qty.value === '' ? 0 : Number(qty.value); renderPaper(); save(); });
      price.addEventListener('input', () => { item.price = price.value === '' ? 0 : Number(price.value); renderPaper(); save(); });
      $('.rm', row).addEventListener('click', () => {
        if (state.items.length === 1) {
          item.desc = ''; item.qty = 1; item.price = 0;
        } else {
          state.items.splice(idx, 1);
        }
        renderItems(); renderPaper(); save();
      });
      box.appendChild(row);
    });
  }

  $('#add-item').addEventListener('click', () => {
    state.items.push({ desc: '', qty: 1, price: 0 });
    renderItems();
    renderPaper();
    save();
    const descs = $$('#items .desc');
    if (descs.length) descs[descs.length - 1].focus();
  });

  // ---------- logo ----------
  $('#logo-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('Ukuran logo maksimal 1 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { state.logo = String(reader.result); renderPaper(); save(); };
    reader.readAsDataURL(file);
  });

  $('#logo-clear').addEventListener('click', () => {
    state.logo = '';
    $('#logo-file').value = '';
    renderPaper();
    save();
  });

  // ---------- actions ----------
  $('#btn-print').addEventListener('click', () => window.print());

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Kembalikan semua isian ke contoh awal?')) return;
    state = defaults();
    try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    $$('[data-bind]').forEach((el) => {
      const v = getPath(state, el.dataset.bind);
      el.value = v == null ? '' : v;
    });
    $('#logo-file').value = '';
    renderItems();
    renderPaper();
  });

  // Nama file PDF mengikuti nomor invoice
  let prevTitle = document.title;
  window.addEventListener('beforeprint', () => {
    prevTitle = document.title;
    document.title = (state.number || 'invoice').replace(/[^\w.\- ]+/g, '_');
  });
  window.addEventListener('afterprint', () => { document.title = prevTitle; });

  // ---------- init ----------
  bindFields();
  renderItems();
  renderPaper();
})();
