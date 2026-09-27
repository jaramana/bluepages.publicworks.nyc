/* The Blue Pages. One page, four views: listing, Org Chart,
   quiz, about. State lives in the URL (?a=, ?view=, ?type=, ?staff=, ?sort=, ?focus=).
   Joins three sources by listing id: the agency list, the Green Book, payroll. */

(function () {

  /* ---- Tunables ------------------------------------------------- */

  var SITE            = 'The Blue Pages';
  var QUIZ_LENGTH     = 8;
  var RELATED_MAX     = 12;
  var OFFICIALS_SHOWN = 10;
  var LOGO_ROOT       = '';
  var NONE            = '<span class="none">—</span><span class="visually-hidden">Not listed</span>';

  var SOURCES = {
    list: { name: 'Agency list',  title: 'NYC Agencies and Governance Organizations', url: 'https://data.cityofnewyork.us/d/t3jq-9nkf',
            when: 'Retrieved 25 September 2026', what: 'Names, types, heads, reporting lines, websites.' },
    gb:   { name: 'Green Book',   title: 'Green Book, the City’s official directory', url: 'https://data.cityofnewyork.us/d/mdcw-n682',
            when: 'Retrieved 25 September 2026', what: 'Officials, divisions, addresses, main phone numbers.' },
    pay:  { name: 'City payroll', title: 'Citywide Payroll Data, as summarized by paygap.publicworks.nyc', url: 'https://paygap.publicworks.nyc',
            when: 'Fiscal years 2014 to 2025', what: 'Staff counts per year.' }
  };

  // Types come from the agency list. Each family shares one color; text always names the type.
  var TYPES = [
    { k: 'agency',    g: 'exec',  label: 'Mayoral agencies',       one: 'Mayoral agency',       type: 'Mayoral Agency' },
    { k: 'office',    g: 'exec',  label: 'Mayoral offices',        one: 'Mayoral office',       type: 'Mayoral Office' },
    { k: 'division',  g: 'exec',  label: 'Divisions',              one: 'Division',             type: 'Division' },
    { k: 'elected',   g: 'elect', label: 'Elected offices',        one: 'Elected office',       type: 'Elected Office' },
    { k: 'pension',   g: 'elect', label: 'Pension funds',          one: 'Pension fund',         type: 'Pension Fund' },
    { k: 'board',     g: 'board', label: 'Boards and commissions', one: 'Board or commission',  type: 'Advisory or Regulatory Organization' },
    { k: 'corp',      g: 'out',   label: 'Public corporations',    one: 'Public corporation',   type: 'Public Benefit or Development Organization' },
    { k: 'state',     g: 'out',   label: 'State agencies',         one: 'State agency',         type: 'State Government Agency' },
    { k: 'nonprofit', g: 'out',   label: 'Nonprofits',             one: 'Nonprofit',            type: 'Nonprofit Organization' }
  ];
  var SIZES = [
    { k: 's4',   label: '10,000 or more', test: function (n) { return n >= 10000; } },
    { k: 's3',   label: '1,000 to 9,999', test: function (n) { return n >= 1000 && n < 10000; } },
    { k: 's2',   label: '100 to 999',     test: function (n) { return n >= 100 && n < 1000; } },
    { k: 's1',   label: 'Fewer than 100', test: function (n) { return n != null && n < 100; } },
    { k: 'none', label: 'No payroll match', test: function (n) { return n == null; } }
  ];
  var SORTS = [ { k: 'az', label: 'A to Z' }, { k: 'staff', label: 'Most staff' } ];

  /* ---- Data ----------------------------------------------------- */

  var A = window.AGENCIES || [], GB = window.GREENBOOK || {}, PAY = window.PAYROLL || {};
  var byId = {}, byName = {}, typeByK = {};
  TYPES.forEach(function (t) {
    typeByK[t.k] = t;
    t.entries = A.filter(function (a) { return a.type === t.type; }).sort(function (x, y) { return x.alpha.localeCompare(y.alpha); });
    t.entries.forEach(function (a) { a.t = t; });
  });
  var ORDER = [].concat.apply([], TYPES.map(function (t) { return t.entries; }));
  ORDER.forEach(function (a) {
    byId[a.id] = a; byName[a.name] = a;
    var p = PAY[a.id];
    a.staff = p ? p.headcount[p.headcount.length - 1][1] : null;
    a.staffYear = p ? p.headcount[p.headcount.length - 1][0] : null;
  });

  function parents(a) {
    return a.reportsTo ? a.reportsTo.split(';').map(function (s) { return s.trim(); }) : [];
  }
  var CHILDREN = {};
  ORDER.forEach(function (a) {
    parents(a).forEach(function (p) { (CHILDREN[p] = CHILDREN[p] || []).push(a); });
  });

  /* ---- Helpers -------------------------------------------------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function href(a) { return '?a=' + a.id; }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function shortUrl(u) { return u.replace(/^https?:\/\/(www1?\.)?/, '').replace(/\/(index\.page)?$/, ''); }
  function shuffle(xs) {
    xs = xs.slice();
    for (var i = xs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = xs[i]; xs[i] = xs[j]; xs[j] = t; }
    return xs;
  }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function sw(g) { return '<span class="sw" data-g="' + g + '" aria-hidden="true"></span>'; }
  function badge(t) { return '<span class="badge" data-g="' + t.g + '">' + esc(t.one) + '</span>'; }
  function the(name) { return /^(Mayor|First|Deputy|Chief|Office|Department)/.test(name) ? 'the ' + name : name; }
  function thumb(a) {
    return a.logo
      ? '<span class="thumb"><img src="' + LOGO_ROOT + a.logo + '" alt="" loading="lazy"></span>'
      : '<span class="thumb thumb-none" aria-hidden="true">' + esc((a.acronym || '').slice(0, 4)) + '</span>';
  }
  function row(a, aside, hit) {
    return '<li><a class="row" href="' + href(a) + '" data-nav data-id="' + a.id + '">' + thumb(a) +
      '<span class="row-name">' + esc(a.alpha) + (hit ? '<span class="hit">' + esc(hit) + '</span>' : '') + '</span>' +
      '<span class="row-aside">' + esc(aside == null ? (a.acronym || '') : aside) + '</span></a></li>';
  }

  /* ---- State ---------------------------------------------------- */

  var state = { id: null, view: '', types: [], sizes: [], sort: 'az', q: '', focus: '' };

  function readURL() {
    var p = new URLSearchParams(location.search);
    state.id = p.get('a');
    state.view = p.get('view') || '';
    state.types = (p.get('type') || '').split(',').filter(function (k) { return typeByK[k]; });
    state.sizes = (p.get('staff') || '').split(',').filter(Boolean);
    state.sort = p.get('sort') === 'staff' ? 'staff' : 'az';
    state.focus = p.get('focus') || '';
  }
  function go(url, replace) {
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
    readURL();
    render();
    window.scrollTo(0, 0);
    if (state.id || state.view) $('#main').focus({ preventScroll: true });
  }
  function urlWith(changes) {
    var p = new URLSearchParams(location.search);
    Object.keys(changes).forEach(function (k) { if (changes[k]) p.set(k, changes[k]); else p.delete(k); });
    var s = p.toString();
    return s ? '?' + s : './';
  }
  function setFilters() {
    history.replaceState(null, '', urlWith({ type: state.types.join(','), staff: state.sizes.join(','), sort: state.sort === 'staff' ? 'staff' : '' }));
    syncFilters();
    renderRail();
  }

  /* ---- Rail: filters -------------------------------------------- */

  function dropdown(id, label, items, kind, right) {
    return '<details class="dd' + (right ? ' dd-right' : '') + '" id="' + id + '"><summary>' + label + '</summary><div class="dd-menu">' +
      items.map(function (it) {
        return '<label><input type="' + kind + '" name="' + id + '" value="' + it.k + '">' + (it.g ? sw(it.g) : '') + esc(it.label) +
          (it.n != null ? '<span class="count">' + it.n + '</span>' : '') + '</label>';
      }).join('') +
      (kind === 'checkbox' ? '<div class="dd-foot"><button type="button" data-clear="' + id + '">Clear</button></div>' : '') +
      '</div></details>';
  }

  function renderFilters() {
    var sizes = SIZES.map(function (s) {
      return { k: s.k, label: s.label, n: ORDER.filter(function (a) { return s.test(a.staff); }).length };
    });
    var types = TYPES.map(function (t) { return { k: t.k, g: t.g, label: t.label, n: t.entries.length }; });
    $('#filters').innerHTML =
      dropdown('dd-type', 'Type', types, 'checkbox') +
      dropdown('dd-staff', 'Staff', sizes, 'checkbox') +
      dropdown('dd-sort', 'Sort', SORTS, 'radio', true);
    syncFilters();
  }

  function syncFilters() {
    function sync(id, on, label) {
      var d = document.getElementById(id);
      d.classList.toggle('is-on', !!label.on);
      d.querySelector('summary').textContent = label.text;
      d.querySelectorAll('input').forEach(function (i) { i.checked = on.indexOf(i.value) > -1; });
    }
    var nt = state.types.length, ns = state.sizes.length;
    sync('dd-type', state.types, { on: nt, text: nt === 1 ? typeByK[state.types[0]].label : nt ? 'Type · ' + nt : 'Type' });
    sync('dd-staff', state.sizes, { on: ns, text: ns ? 'Staff · ' + ns : 'Staff' });
    sync('dd-sort', [state.sort], { on: false, text: state.sort === 'staff' ? 'Sort: most staff' : 'Sort: A to Z' });
  }

  /* ---- Rail: list ----------------------------------------------- */

  // Search covers names, acronyms and former names. A head's name also finds the listing.
  function match(a, t) {
    if (!t) return { ok: true };
    var own = (a.name + ' ' + a.alpha + ' ' + (a.acronym || '') + ' ' + (a.aka || '')).toLowerCase();
    if (own.indexOf(t) > -1) return { ok: true };
    if (t.length > 3 && a.head && a.head.toLowerCase().indexOf(t) > -1) return { ok: true, hit: (a.headTitle || 'Head') + ': ' + a.head };
    return { ok: false };
  }

  function visible() {
    var t = state.q.trim().toLowerCase();
    return ORDER.map(function (a) {
      if (state.types.length && state.types.indexOf(a.t.k) < 0) return null;
      if (state.sizes.length && !SIZES.some(function (s) { return state.sizes.indexOf(s.k) > -1 && s.test(a.staff); })) return null;
      var m = match(a, t);
      return m.ok ? { a: a, hit: m.hit } : null;
    }).filter(Boolean);
  }

  function renderRail() {
    var rows = visible(), html;
    if (state.sort === 'staff') {
      rows.sort(function (x, y) { return (y.a.staff == null ? -1 : y.a.staff) - (x.a.staff == null ? -1 : x.a.staff) || x.a.alpha.localeCompare(y.a.alpha); });
      html = rows.length ? '<section class="rail-group"><h2 class="rail-group-h" data-g="out">Most staff first<span class="count">' + rows.length + '</span></h2><ul>' +
        rows.map(function (r) { return row(r.a, r.a.staff == null ? '—' : fmt(r.a.staff), r.hit); }).join('') + '</ul></section>' : '';
    } else {
      html = TYPES.map(function (t) {
        var es = rows.filter(function (r) { return r.a.t === t; });
        if (!es.length) return '';
        return '<section class="rail-group"><h2 class="rail-group-h" data-g="' + t.g + '">' + esc(t.label) +
          '<span class="count">' + es.length + '</span></h2><ul>' + es.map(function (r) { return row(r.a, null, r.hit); }).join('') + '</ul></section>';
      }).join('');
    }
    $('#rail-list').innerHTML = html || '<p class="rail-empty">No listing matches.</p>';
    var filtered = state.types.length || state.sizes.length || state.q;
    $('#rail-status').innerHTML = (filtered ? rows.length + ' of ' + ORDER.length + ' listings' : ORDER.length + ' listings') +
      (state.types.length || state.sizes.length ? ' <button type="button" data-clear="all">Clear filters</button>' : '');
    markSelected();
  }

  function markSelected() {
    $$('.row[aria-current]').forEach(function (r) { r.removeAttribute('aria-current'); });
    var id = state.id || (state.view === 'chart' && state.focus);
    if (!id) return;
    var r = document.querySelector('#rail-list .row[data-id="' + id + '"]');
    if (r) {
      r.setAttribute('aria-current', 'true');
      var list = $('#rail-list'), top = r.offsetTop, h = list.clientHeight;
      if (top < list.scrollTop || top > list.scrollTop + h - 60) list.scrollTop = top - h / 3;
    }
  }

  /* ---- Home ----------------------------------------------------- */

  function viewHome() {
    document.title = SITE;
    var noParent = ORDER.filter(function (a) { return !a.reportsTo; }).length;
    return '<article class="prose home">' +
      '<h1 class="title">Look up a City organization</h1>' +
      '<p class="lead">The City’s agency list has ' + ORDER.length + ' organizations, from departments and elected offices to boards and nonprofits. Look up a listing to see its published leadership and reporting line. Where records can be matched, you’ll also find Green Book contacts and City payroll counts.</p>' +
      '<div class="stats">' +
        '<div class="stat"><b>' + ORDER.length + '</b><span>listings</span></div>' +
        '<div class="stat"><b>' + ORDER.filter(function (a) { return GB[a.id]; }).length + '</b><span>with officials in the Green Book</span></div>' +
        '<div class="stat"><b>' + ORDER.filter(function (a) { return a.staff != null; }).length + '</b><span>with staff counts from payroll</span></div>' +
        '<div class="stat"><b>' + noParent + '</b><span>with no reporting line listed</span></div>' +
      '</div>' +
      notice() +
      '<p>Look up any listing in the index, open the <a href="?view=chart" data-nav>Org Chart</a>, or browse by type.</p>' +
      '<table class="types-table"><thead><tr><th scope="col"><span class="visually-hidden">Color</span></th><th scope="col">Type</th><th scope="col" class="num">Listings</th></tr></thead><tbody>' +
      TYPES.map(function (t) {
        return '<tr><td>' + sw(t.g) + '</td><td><a href="?type=' + t.k + '" data-nav>' + esc(t.label) + '</a></td><td class="num">' + t.entries.length + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '</article>' + footer();
  }

  /* ---- Listing -------------------------------------------------- */

  function spark(series) {
    var W = 150, H = 28, n = series.length;
    if (n < 2) return '';
    var vs = series.map(function (d) { return d[1]; });
    var lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs), span = hi - lo || 1;
    var pts = series.map(function (d, i) { return [i / (n - 1) * W, H - (d[1] - lo) / span * H]; });
    var last = pts[n - 1];
    return '<svg class="spark" width="' + (W + 40) + '" height="' + (H + 14) + '" role="img" aria-label="Staff by fiscal year, ' +
      series[0][0] + ' to ' + series[n - 1][0] + '"><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L') +
      '"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="3"/><text x="0" y="' + (H + 12) + '">' + series[0][0] + '</text><text x="' + W +
      '" y="' + (H + 12) + '" text-anchor="end">' + series[n - 1][0] + '</text></svg>';
  }

  function src(k) { return '<a href="#sources">' + SOURCES[k].name + '</a>'; }
  function fact(label, value, source) {
    return '<div class="fact"><dt>' + label + '</dt><dd>' + (value || NONE) + '</dd><p class="src-note">' + src(source) + '</p></div>';
  }
  function section(title, count, body, source, id) {
    return '<section' + (id ? ' id="' + id + '" tabindex="-1"' : '') + '><h2 class="h-sec">' + title + (count != null ? ' <span class="count">' + count + '</span>' : '') +
      (source ? '<span class="src">' + SOURCES[source].name + '</span>' : '') + '</h2>' + body + '</section>';
  }
  function listOf(list, a, empty) {
    if (!list.length) return '<p class="empty-sec">' + empty + '</p>';
    return '<ul class="related-list">' + list.slice(0, RELATED_MAX).map(function (x) { return row(x); }).join('') + '</ul>' +
      (list.length > RELATED_MAX ? '<p class="muted small">And ' + (list.length - RELATED_MAX) + ' more in the <a href="?view=chart&focus=' + a.id + '" data-nav>Org Chart</a>.</p>' : '');
  }

  function viewEntry(a) {
    document.title = a.name + ' · ' + SITE;
    var ps = parents(a), gb = GB[a.id], pay = PAY[a.id];
    function ref(n) {
      var x = byName[n];
      return x ? '<a href="' + href(x) + '" data-nav>' + esc(n) + '</a>' : esc(n) + ' <span class="sub">(no separate listing)</span>';
    }
    var children = CHILDREN[a.name] || [];
    var siblings = ps.length ? (CHILDREN[ps[0]] || []).filter(function (x) { return x !== a; }) : [];

    var mount = a.logo
      ? '<figure class="mount"><img src="' + LOGO_ROOT + a.logo + '" alt="' + esc(a.name) + ' logo"></figure>'
      : '<figure class="mount mount-none"><span>No logo on file</span></figure>';

    var officials = gb
      ? '<table class="officials"><thead><tr><th scope="col">Title</th><th scope="col">Name and division</th></tr></thead><tbody>' +
        gb.officials.map(function (o, k) {
          return '<tr' + (k >= OFFICIALS_SHOWN ? ' class="extra" hidden' : '') + '><td>' + esc(o.title || '') + '</td><td>' + esc(o.name) +
            (o.path.length ? '<br><span class="div">' + esc(o.path.join(' › ')) + '</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' +
        (gb.officials.length > OFFICIALS_SHOWN ? '<button type="button" class="more" data-more>Show ' + (gb.officials.length - OFFICIALS_SHOWN) + ' more</button>' : '') +
        (gb.count > gb.officials.length ? '<p class="muted small">The Green Book lists ' + gb.count + ' officials here. This prototype shows the first ' + gb.officials.length + '.</p>' : '')
      : '<p class="empty-sec">' + NONE + '</p>';

    return '<article class="entry">' +
      '<a class="back" href="' + urlWith({ a: '' }) + '" data-nav>Index</a>' +
      '<div class="entry-head"><div>' + badge(a.t) + '<h1 class="title">' + esc(a.name) + '</h1></div>' + mount + '</div>' +
      '<dl class="facts">' +
        fact('Acronym', a.acronym ? '<span class="acro">' + esc(a.acronym) + '</span>' : '', 'list') +
        fact('Head', a.head ? esc(a.head) + (a.headTitle ? ' <span class="sub">' + esc(a.headTitle) + '</span>' : '') : '', 'list') +
        fact('Reports to', (ps.length ? ps.map(ref).join('<br>') : '<span class="none">No reporting line listed</span>') +
          '<br><a class="chart-link" href="?view=chart&focus=' + a.id + '" data-nav>Show in Org Chart</a>', 'list') +
        fact('Also known as', a.aka ? esc(a.aka).split(';').join('<br>') : '', 'list') +
        fact('Address', gb && gb.address ? esc(gb.address) : '', 'gb') +
        fact('Main phone', gb && gb.phone ? esc(gb.phone) : '', 'gb') +
        fact('Website', a.url ? '<a href="' + esc(a.url) + '">' + esc(shortUrl(a.url)) + '</a>' : '', 'list') +
        fact('Staff', pay ? fmt(a.staff) + ' <span class="sub">in fiscal year ' + a.staffYear + '</span>' + spark(pay.headcount) +
          '<span class="def">Payroll records marked active that year, across salaried, hourly and daily pay.</span>' : '', 'pay') +
      '</dl>' +
      section('Officials', gb ? gb.count : null, officials, 'gb') +
      section('Who reports here', children.length, listOf(children, a, 'None listed in this source.'), 'list') +
      (ps.length ? section('Also reporting to ' + esc(the(ps[0])), siblings.length, listOf(siblings, a, 'None listed in this source.'), 'list') : '') +
      section('Sources', null, sourcesList(), null, 'sources') +
      '</article>' + footer();
  }

  function sourcesList() {
    return '<ul class="sources">' + Object.keys(SOURCES).map(function (k) {
      var s = SOURCES[k];
      return '<li><b>' + s.name + '</b><span><a href="' + s.url + '">' + esc(s.title) + '</a>. ' + esc(s.what) + ' ' + esc(s.when) + '.</span></li>';
    }).join('') + '</ul>';
  }

  /* ---- Org Chart ------------------------------------------------ */

  var chart = null, chartNodes = null, selected = null;
  var chartMode = { divisions: false, layout: 'left', outline: false, types: [] };

  // Flat node list for d3-org-chart. One parent per node: the first listed.
  // _expanded marks a node to be shown on first draw, which opens its ancestors.
  function chartData() {
    var nodes = [], seen = {};
    function add(n) { if (!seen[n.id]) { seen[n.id] = n; nodes.push(n); } return seen[n.id]; }

    add({ id: 'root', parentId: null, kind: 'group', name: 'City of New York', label: 'Directory grouping', meta: 'Not a reporting line', _expanded: true });

    function parentOf(a) {
      var ps = parents(a);
      if (!ps.length) {
        if (CHILDREN[a.name]) return 'root';
        add({ id: 'none:' + a.t.k, parentId: 'none', kind: 'group', name: a.t.label, meta: '' });
        return 'none:' + a.t.k;
      }
      var x = byName[ps[0]];
      if (x) return x.id;
      var pid = 'pos:' + slug(ps[0]);
      add({ id: pid, parentId: 'root', kind: 'position', name: ps[0], meta: 'No separate listing' });
      return pid;
    }

    ORDER.forEach(function (a) {
      var ps = parents(a);
      add({ id: a.id, parentId: parentOf(a), kind: 'entry', a: a, g: a.t.g, name: a.name,
        label: a.t.one + (a.acronym ? ' · ' + a.acronym : ''),
        meta: [a.head, a.staff != null ? fmt(a.staff) + ' staff' : '', ps.length > 1 ? 'also reports elsewhere' : ''].filter(Boolean).join(' · '),
        _expanded: ps[0] === 'Office of the Mayor' });
    });
    add({ id: 'none', parentId: 'root', kind: 'group', name: 'No reporting line listed', meta: '' });

    if (chartMode.divisions) {
      Object.keys(GB).forEach(function (eid) {
        if (!seen[eid]) return;
        GB[eid].divisions.forEach(function (path) {
          var bits = path.split(' > ');
          add({ id: 'div:' + eid + ':' + path, parentId: bits.length > 1 ? 'div:' + eid + ':' + bits.slice(0, -1).join(' > ') : eid,
            kind: 'division', eid: eid, path: bits, name: bits[bits.length - 1], label: 'Division', meta: '' });
        });
      });
    }

    // Root's children in reading order: the Mayor, other listings, named positions, then the unlisted.
    var rank = function (n) {
      return n.parentId !== 'root' ? 0 : n.id === 'office-of-the-mayor' ? 1 : n.kind === 'entry' ? 2 : n.kind === 'position' ? 3 : 4;
    };
    nodes = nodes.map(function (n, i) { return [n, i]; })
      .sort(function (x, y) { return rank(x[0]) - rank(y[0]) || x[1] - y[1]; })
      .map(function (x) { return x[0]; });

    // Break cycles: a node whose ancestry loops back hangs from the root.
    nodes.forEach(function (n) {
      var cur = n, hops = 0;
      while (cur && cur.parentId && hops < 50) { cur = seen[cur.parentId]; hops++; if (cur === n) { n.parentId = 'root'; break; } }
    });

    nodes.forEach(function (n) {
      if (n.kind !== 'group' || n.meta) return;
      var k = nodes.filter(function (m) { return m.parentId === n.id; }).length;
      n.meta = k + (k === 1 ? ' listing' : ' listings');
    });
    if (state.focus && seen[state.focus]) seen[state.focus]._focus = true;
    return nodes;
  }

  function dimmed(n) {
    return chartMode.types.length && n.kind === 'entry' && chartMode.types.indexOf(n.a.t.k) < 0;
  }

  function card(d) {
    var n = d.data;
    var cls = 'card is-' + n.kind + (n._focus ? ' is-focus' : '') + (dimmed(n) ? ' is-dim' : '');
    var kind = n.label || (n.kind === 'position' ? 'Position' : '');
    return '<div class="' + cls + '" data-g="' + (n.g || 'out') + '" style="width:' + d.width + 'px;height:' + d.height + 'px">' +
      (n.kind === 'entry' ? '<span class="card-bar"></span>' : '') +
      '<div class="card-body">' + (kind ? '<span class="card-kind">' + esc(kind) + '</span>' : '') +
      '<span class="card-name">' + esc(n.name) + '</span>' +
      (n.meta ? '<span class="card-meta">' + esc(n.meta) + '</span>' : '') + '</div></div>';
  }

  function viewChart() {
    document.title = 'Org Chart · ' + SITE;
    var on = function (b) { return ' aria-pressed="' + !!b + '"'; };
    var types = TYPES.map(function (t) { return { k: t.k, g: t.g, label: t.label, n: t.entries.length }; });
    return '<div class="chart-bar"><h1>Org Chart</h1>' +
        '<label class="visually-hidden" for="chart-find">Find a listing</label>' +
        '<input id="chart-find" class="tool" list="chart-names" placeholder="Find a listing" autocomplete="off">' +
        '<span class="bar-break"></span>' +
        '<datalist id="chart-names">' + ORDER.map(function (a) { return '<option value="' + esc(a.name) + '">'; }).join('') + '</datalist>' +
        dropdown('dd-ctype', 'Highlight type', types, 'checkbox') +
        '<button type="button" class="tool" data-tool="divisions"' + on(chartMode.divisions) + '>Divisions</button>' +
        '<span class="seg" role="group" aria-label="Layout"><button type="button" class="tool" data-tool="left"' + on(chartMode.layout === 'left') + '>Sideways</button>' +
          '<button type="button" class="tool" data-tool="top"' + on(chartMode.layout === 'top') + '>Top down</button></span>' +
        '<span class="seg" role="group" aria-label="View"><button type="button" class="tool" data-tool="chart"' + on(!chartMode.outline) + '>Chart</button>' +
          '<button type="button" class="tool" data-tool="outline"' + on(chartMode.outline) + '>Outline</button></span>' +
        '<button type="button" class="tool" data-tool="fit">Fit</button>' +
        '<details class="dd dd-right" id="dd-more"><summary>More</summary><div class="dd-menu dd-actions">' +
          '<button type="button" data-tool="expand">Expand everything</button>' +
          '<button type="button" data-tool="collapse">Collapse everything</button>' +
          '<button type="button" data-tool="png">Save as image</button>' +
        '</div></details>' +
      '</div>' +
      '<p class="chart-note">Lines come from the City agency list. A blank reporting field does not establish that an organization has no parent. ' +
        'The chart shows the first listed parent; the outline shows both when two are listed.</p>' +
      '<p class="chart-hint">Drag to move, scroll to zoom. Click a box for details. Pick a listing in the index to find it here.</p>' +
      '<div class="chart-stage">' +
        '<div class="chart-canvas" id="chart-canvas"' + (chartMode.outline ? ' hidden' : '') + '></div>' +
        '<div class="chart-outline" id="chart-outline"' + (chartMode.outline ? '' : ' hidden') + '>' + (chartMode.outline ? outline() : '') + '</div>' +
        '<aside class="panel" id="panel" hidden aria-live="polite"></aside>' +
      '</div>';
  }

  function drawChart() {
    var el = $('#chart-canvas');
    syncChartTypes();
    if (!el || chartMode.outline) return;
    if (!window.d3 || !d3.OrgChart) { el.innerHTML = '<p style="padding:20px">The chart library did not load. Try the Outline view.</p>'; return; }
    var ink = getComputedStyle(document.documentElement).getPropertyValue('--ink-faint');
    chartNodes = chartData();
    chart = new d3.OrgChart()
      .container(el)
      .data(chartNodes)
      .svgHeight(el.clientHeight)
      .layout(chartMode.layout)
      .compact(false)
      .nodeWidth(function (d) { return d.data.kind === 'division' ? 230 : 250; })
      .nodeHeight(function (d) { return d.data.kind === 'division' ? 62 : 84; })
      .childrenMargin(function () { return 48; })
      .siblingsMargin(function () { return 14; })
      .neighbourMargin(function () { return 24; })
      .nodeContent(card)
      .nodeUpdate(function () {})
      .linkUpdate(function (d) {
        d3.select(this).style('stroke', ink).style('stroke-width', d.data._focus ? 3 : 1.25);
      })
      .buttonContent(function (o) {
        return '<div class="node-btn">' + (o.node.children ? '−' : '+') + ' ' + o.node.data._directSubordinatesPaging + '</div>';
      })
      .nodeButtonWidth(function () { return 48; }).nodeButtonHeight(function () { return 22; })
      .nodeButtonX(function () { return -24; }).nodeButtonY(function () { return -11; })
      .onNodeClick(function (d) { showPanel(d.data || d); })
      .render();
    if (state.focus && byId[state.focus]) focusNode(state.focus);
    else chart.setCentered('office-of-the-mayor').render();
  }

  function focusNode(id) {
    chartNodes.forEach(function (n) { n._focus = n.id === id; });
    chart.setExpanded(id).setCentered(id).render();
    var n = chartNodes.filter(function (m) { return m.id === id; })[0];
    if (n) showPanel(n);
  }

  function showPanel(n) {
    selected = n;
    var p = $('#panel'), body;
    if (n.kind === 'entry') {
      var a = n.a, ps = parents(a), gb = GB[a.id];
      body = badge(a.t) + '<h2>' + esc(a.name) + '</h2><dl>' +
        '<dt>Head</dt><dd>' + (a.head ? esc(a.head) : NONE) + '</dd>' +
        '<dt>Reports to</dt><dd>' + (ps.length ? ps.map(esc).join('<br>') : NONE) + '</dd>' +
        '<dt>Staff</dt><dd>' + (a.staff != null ? fmt(a.staff) + ' <span class="muted small">active payroll records, FY' + a.staffYear + '</span>' : NONE) + '</dd>' +
        '<dt>Officials</dt><dd>' + (gb ? gb.count + ' in the Green Book' : NONE) + '</dd>' +
        '<dt>Direct reports</dt><dd>' + (CHILDREN[a.name] || []).length + '</dd></dl>' +
        '<div class="panel-actions"><a class="btn" href="' + href(a) + '" data-nav>Open listing</a>' +
        '<button type="button" class="btn btn-quiet" data-tool="branch">Open branch</button></div>';
    } else if (n.kind === 'division') {
      var host = byId[n.eid], here = (GB[n.eid].officials || []).filter(function (o) { return o.path.join(' > ') === n.path.join(' > '); });
      body = '<span class="badge" data-g="out">Division</span><h2>' + esc(n.name) + '</h2><dl>' +
        '<dt>Part of</dt><dd>' + esc(n.path.length > 1 ? n.path.slice(0, -1).join(' › ') + ', ' : '') + '<a href="' + href(host) + '" data-nav>' + esc(host.name) + '</a></dd>' +
        '<dt>Officials</dt><dd>' + (here.length ? here.map(function (o) { return esc(o.name) + ' <span class="muted small">' + esc(o.title || '') + '</span>'; }).join('<br>') : NONE) + '</dd></dl>' +
        '<p class="muted small">From the Green Book.</p>';
    } else if (n.kind === 'position') {
      body = '<span class="badge" data-g="out">Position</span><h2>' + esc(n.name) + '</h2>' +
        '<p>The agency list names this as a parent but has no separate listing for it.</p>' +
        '<div class="panel-actions"><button type="button" class="btn btn-quiet" data-tool="branch">Open branch</button></div>';
    } else if (n.id === 'root') {
      body = '<h2>' + esc(n.name) + '</h2><p>A grouping for this directory, not a documented reporting relationship. It holds the ' + ORDER.length + ' listings so the chart has one top.</p>' +
        '<div class="panel-actions"><button type="button" class="btn btn-quiet" data-tool="branch">Open branch</button></div>';
    } else {
      body = '<h2>' + esc(n.name) + '</h2><p>' + esc(n.meta) + '.' + (n.id === 'none' || n.parentId === 'none' ? ' These listings have no reporting line in the agency list. A blank field does not establish that they have no parent.' : '') + '</p>' +
        '<div class="panel-actions"><button type="button" class="btn btn-quiet" data-tool="branch">Open branch</button></div>';
    }
    p.innerHTML = '<button type="button" class="panel-close" data-tool="close" aria-label="Close details">×</button>' + body;
    p.hidden = false;
  }

  function syncChartTypes() {
    var d = document.getElementById('dd-ctype');
    if (!d) return;
    var n = chartMode.types.length;
    d.classList.toggle('is-on', !!n);
    d.querySelector('summary').textContent = n === 1 ? typeByK[chartMode.types[0]].label : n ? 'Highlight · ' + n : 'Highlight type';
    d.querySelectorAll('input').forEach(function (i) { i.checked = chartMode.types.indexOf(i.value) > -1; });
  }

  function outline() {
    function node(name, stack) {
      var kids = (CHILDREN[name] || []).filter(function (c) { return !stack[c.name]; })
        .sort(function (x, y) { return x.alpha.localeCompare(y.alpha); });
      var x = byName[name];
      var label = x ? sw(x.t.g) + '<a href="' + href(x) + '" data-nav>' + esc(name) + '</a>' : '<span>' + esc(name) + '</span> <span class="muted small">(no separate listing)</span>';
      if (!kids.length) return '<li><span class="twisty-gap"></span>' + label + '</li>';
      var s = Object.assign({}, stack); s[name] = 1;
      return branch(label, name, kids.length, kids.map(function (k) { return node(k.name, s); }).join(''), true);
    }
    function branch(label, name, n, inner, open) {
      var id = 'tree-' + (++uid);
      return '<li><button type="button" class="twisty" data-twisty aria-expanded="' + open + '" aria-controls="' + id + '" aria-label="' +
        (open ? 'Collapse ' : 'Expand ') + esc(name) + '"></button>' + label + ' <span class="count">' + n + '</span>' +
        '<ul id="' + id + '"' + (open ? '' : ' hidden') + '>' + inner + '</ul></li>';
    }
    var uid = 0;
    var roots = Object.keys(CHILDREN).filter(function (p) { var x = byName[p]; return !x || !parents(x).length; })
      .sort(function (x, y) { return (CHILDREN[y] || []).length - (CHILDREN[x] || []).length; });
    var loose = ORDER.filter(function (a) { return !a.reportsTo && !CHILDREN[a.name]; });
    return '<ul class="tree">' + roots.map(function (r) { return node(r, {}); }).join('') +
      branch('<span>No reporting line listed</span>', 'No reporting line listed', loose.length,
        loose.map(function (a) { return '<li><span class="twisty-gap"></span>' + sw(a.t.g) + '<a href="' + href(a) + '" data-nav>' + esc(a.name) + '</a></li>'; }).join(''), false) +
      '</ul>';
  }

  function chartTool(t) {
    if (t === 'outline' || t === 'chart') { chartMode.outline = t === 'outline'; render(); return; }
    if (t === 'divisions') { chartMode.divisions = !chartMode.divisions; render(); return; }
    if (t === 'close') { $('#panel').hidden = true; selected = null; return; }
    if (!chart) return;
    if (t === 'fit') chart.fit();
    if (t === 'expand') chart.expandAll().fit();
    if (t === 'collapse') { chart.collapseAll(); chart.render().fit(); }
    if (t === 'left' || t === 'top') {
      chartMode.layout = t;
      chart.layout(t).render().fit();
      $$('[data-tool="left"],[data-tool="top"]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === t); });
    }
    if (t === 'branch' && selected) {
      chartNodes.filter(function (n) { return n.parentId === selected.id; }).forEach(function (n) { n._expanded = true; });
      chart.setCentered(selected.id).render();
    }
    if (t === 'png') chart.exportImg({ full: true, backgroundColor: '#ffffff' });
  }

  /* ---- About, notice, footer ------------------------------------ */

  function viewAbout() {
    document.title = 'About · ' + SITE;
    return '<article class="prose">' +
      '<h1 class="title">About</h1>' +
      '<p class="lead">' + SITE + ' brings the City’s agency list, Green Book contacts and payroll counts into one directory.</p>' +
      '<h2 class="h-sec">Why</h2>' +
      '<p>The City’s agency list, Green Book and payroll publish related information in separate places. This directory brings their matched records together.</p>' +
      '<h2 class="h-sec">Scope</h2>' +
      '<p>The agency list defines all 307 listings. Green Book and payroll records are matched by name or acronym, with manual mappings for exceptions. A dash means there is no value or match to show; it does not mean zero. The list gives no reporting line for 175 entries.</p>' +
      '<p>The Org Chart places an organization with two parents under its first listed parent; the outline shows both.</p>' +
      '<h2 class="h-sec">Built</h2>' +
      '<p>Python’s standard library joins Green Book and payroll records to the agency list. The website uses static HTML, CSS and JavaScript, served from GitHub Pages, with vendored D3, d3-flextree and d3-org-chart for the Org Chart.</p>' +
      '<h2 class="h-sec">Independence</h2>' +
      '<p>No agency reviewed this site.</p>' +
      '<h2 class="h-sec">Credits</h2>' +
      '<p>Data from the City’s agency list, Green Book and Citywide Payroll. Logos come from the organizations’ official web pages and are shown for identification. Claude was used in development.</p>' +
      '<section id="sources" tabindex="-1"><h2 class="h-sec">Sources</h2>' + sourcesList() + '</section>' +
      '<h2 class="h-sec">Reuse</h2>' +
      '<p>Code is BSD 3-Clause licensed. City data retain their source terms. Logos belong to their organizations.</p>' +
      '<h2 class="h-sec">Contact</h2>' +
      '<p>If you find an error, <a href="https://github.com/jaramana/bluepages.publicworks.nyc/issues">open an issue</a>.</p>' +
      '</article>' + footer();
  }
  function disclaimer() {
    return '<strong>This is not an official product.</strong> It is an independent initiative, not affiliated with, endorsed by, or produced by the City of New York. Please refer to <a href="https://www.nyc.gov/main/your-government/agency-directory">NYC.gov</a> for authoritative information.';
  }
  function notice() {
    return '<div class="notice"><p>' + disclaimer() + '</p></div>';
  }
  function footer() {
    return '<footer class="colophon"><p class="disclaimer">' + disclaimer() + '</p>' +
      '<p class="portfolio">A <a href="https://publicworks.nyc/">publicworks.nyc</a> project.</p></footer>';
  }

  /* ---- Quiz ---------------------------------------------------- */

  var quiz = null;

  function buildQuiz() {
    var withLogo = ORDER.filter(function (a) { return a.logo && !a.logoShared; });
    var withAcro = ORDER.filter(function (a) { return a.acronym && a.acronym.length > 2; });
    var withHead = ORDER.filter(function (a) { return a.head; });
    var withParent = ORDER.filter(function (a) { return parents(a).length === 1; });
    var parentPool = Object.keys(CHILDREN);
    function opts(right, pool, key) {
      var wrong = shuffle(pool).map(key).filter(function (v, i, s) { return v !== key(right) && s.indexOf(v) === i; }).slice(0, 3);
      return shuffle([key(right)].concat(wrong));
    }
    var makers = [
      function () { var a = shuffle(withLogo)[0]; return { logo: a.logo, q: 'The logo shown belongs to which body?', opts: opts(a, withLogo, function (x) { return x.name; }), ans: a.name, a: a }; },
      function () { var a = shuffle(withAcro)[0]; return { q: 'What does ' + a.acronym + ' stand for?', opts: opts(a, withAcro, function (x) { return x.name; }), ans: a.name, a: a }; },
      function () { var a = shuffle(withHead)[0]; return { q: 'Who is listed as ' + (a.headTitle || 'head') + ' of the ' + a.name + '?', opts: opts(a, withHead, function (x) { return x.head; }), ans: a.head, a: a }; },
      function () {
        var a = shuffle(withParent)[0], right = parents(a)[0];
        return { q: 'To whom does the ' + a.name + ' report?', opts: shuffle([right].concat(shuffle(parentPool.filter(function (p) { return p !== right; })).slice(0, 3))), ans: right, a: a };
      }
    ];
    var qs = [];
    for (var i = 0; i < QUIZ_LENGTH; i++) qs.push(makers[i % makers.length]());
    return shuffle(qs);
  }

  function viewQuiz() {
    document.title = 'Quiz · ' + SITE;
    quiz = buildQuiz();
    var L = 'ABCD';
    return '<article class="prose quiz">' +
      '<h1 class="title">Quiz</h1>' +
      '<p class="lead">' + QUIZ_LENGTH + ' questions drawn from the directory. Fill one circle per question.</p>' +
      '<ol class="questions">' + quiz.map(function (q, qi) {
        return '<li class="question" data-q="' + qi + '">' +
          (q.logo ? '<div class="q-logo"><img src="' + LOGO_ROOT + q.logo + '" alt="Logo for question ' + (qi + 1) + '"></div>' : '') +
          '<fieldset><legend>' + esc(q.q) + '</legend>' + q.opts.map(function (o, oi) {
            return '<label class="bubble"><input type="radio" name="q' + qi + '" value="' + oi + '"><span class="dot" aria-hidden="true">' + L[oi] + '</span><span>' + esc(o) + '</span></label>';
          }).join('') + '</fieldset><p class="q-ref" hidden></p></li>';
      }).join('') + '</ol>' +
      '<div class="quiz-foot"><button type="button" class="btn" id="submit">Submit</button>' +
      '<button type="button" class="btn btn-quiet" id="clear">Clear</button><p class="score" aria-live="polite"></p></div>' +
      '</article>' + footer();
  }

  function gradeQuiz() {
    var right = 0, marks = [];
    quiz.forEach(function (q, qi) {
      var li = document.querySelector('[data-q="' + qi + '"]');
      var picked = li.querySelector('input:checked');
      var ok = !!picked && q.opts[picked.value] === q.ans;
      right += ok; marks.push(ok ? '🟦' : '🟥');
      li.classList.add(ok ? 'is-right' : 'is-wrong');
      li.querySelectorAll('input').forEach(function (inp) {
        inp.disabled = true;
        if (q.opts[inp.value] === q.ans) inp.parentNode.classList.add('is-answer');
      });
      var ref = li.querySelector('.q-ref');
      ref.hidden = false;
      ref.innerHTML = 'See <a href="' + href(q.a) + '" data-nav>' + esc(q.a.name) + '</a>.';
    });
    var best = Math.max(right, +store('bp-best') || 0);
    store('bp-best', best);
    var share = SITE + ', Quiz: ' + right + '/' + quiz.length + '\n' + marks.join('');
    $('.score').innerHTML = '<span class="grade">' + right + '/' + quiz.length + '</span> Personal best ' + best + '. <button type="button" class="btn btn-quiet" id="copy">Copy result</button>';
    $('#copy').addEventListener('click', function (e) {
      try { navigator.clipboard.writeText(share); e.target.textContent = 'Copied'; } catch (err) { e.target.textContent = share; }
    });
    $('#submit').disabled = true;
  }

  // Clear keeps the same questions. A reload draws new ones.
  function clearQuiz() {
    $$('.question').forEach(function (li) {
      li.classList.remove('is-right', 'is-wrong');
      li.querySelector('.q-ref').hidden = true;
      li.querySelectorAll('input').forEach(function (inp) {
        inp.checked = false; inp.disabled = false;
        inp.parentNode.classList.remove('is-answer');
      });
    });
    $('.score').innerHTML = '';
    $('#submit').disabled = false;
    $('.questions input').focus();
  }

  /* ---- Render --------------------------------------------------- */

  function render() {
    var a = state.id && byId[state.id];
    var view = a ? 'entry' : (state.view || 'home');
    drawn = location.search;
    document.body.dataset.view = view;
    chart = null; selected = null;
    $('#main').innerHTML =
      view === 'entry' ? viewEntry(a) :
      view === 'chart' ? viewChart() :
      view === 'quiz'  ? viewQuiz() :
      view === 'about' ? viewAbout() : viewHome();
    $$('.topnav a').forEach(function (l) {
      var on = l.dataset.view === (view === 'entry' || view === 'home' ? '' : view);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    syncFilters();
    renderRail();
    if (view === 'chart') drawChart();
  }

  /* ---- Events --------------------------------------------------- */

  document.addEventListener('click', function (e) {
    $$('details.dd[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
    var tw = e.target.closest('[data-twisty]');
    if (tw) {
      var open = tw.getAttribute('aria-expanded') !== 'true', label = tw.getAttribute('aria-label').replace(/^\w+ /, '');
      tw.setAttribute('aria-expanded', open);
      tw.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + label);
      document.getElementById(tw.getAttribute('aria-controls')).hidden = !open;
      return;
    }
    var l = e.target.closest('a[data-nav]');
    if (l && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();

      // In the Org Chart, the index finds a listing in the chart instead of leaving it.
      if (chart && l.closest('#rail-list')) {
        state.focus = l.dataset.id;
        history.replaceState(null, '', urlWith({ focus: state.focus }));
        focusNode(state.focus);
        markSelected();
        return;
      }
      go(l.getAttribute('href'));
      return;
    }
    var c = e.target.closest('[data-clear]');
    if (c) {
      var k = c.dataset.clear;
      if (k === 'dd-ctype') { chartMode.types = []; syncChartTypes(); if (chart) chart.render(); return; }
      if (k === 'dd-type' || k === 'all') state.types = [];
      if (k === 'dd-staff' || k === 'all') state.sizes = [];
      setFilters();
      return;
    }
    var t = e.target.closest('[data-tool]');
    if (t) { var dd = t.closest('details'); if (dd) dd.open = false; chartTool(t.dataset.tool); return; }
    if (e.target.matches('[data-more]')) {
      $$('.officials .extra').forEach(function (r) { r.hidden = false; });
      e.target.remove();
      return;
    }
    if (e.target.id === 'submit') gradeQuiz();
    if (e.target.id === 'clear') clearQuiz();
  });

  document.addEventListener('change', function (e) {
    var n = e.target.name;
    function checked() { return $$('input[name="' + n + '"]:checked').map(function (i) { return i.value; }); }
    if (n === 'dd-type')  { state.types = checked(); setFilters(); }
    if (n === 'dd-staff') { state.sizes = checked(); setFilters(); }
    if (n === 'dd-sort')  { state.sort = e.target.value; setFilters(); e.target.closest('details').open = false; }
    if (n === 'dd-ctype') { chartMode.types = checked(); syncChartTypes(); if (chart) chart.render(); }
    if (e.target.id === 'chart-find' && chart) {
      var x = byName[e.target.value];
      if (x) focusNode(x.id);
    }
  });

  $('#q').addEventListener('input', function (e) { state.q = e.target.value; renderRail(); });

  document.addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== 'radio' && e.target.type !== 'checkbox';
    if (e.key === 'Escape') $$('details.dd[open]').forEach(function (d) { d.open = false; });
    if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); return; }
    if (e.key === 'Escape' && e.target.id === 'q') { e.target.value = ''; state.q = ''; renderRail(); }
  });

  // Following #sources changes only the hash. Leave the page as drawn and move focus to the target.
  var drawn = location.search;
  window.addEventListener('popstate', function () {
    if (location.search === drawn) return;
    readURL(); render();
  });
  window.addEventListener('hashchange', function () {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (t) t.focus({ preventScroll: true });
  });

  $$('[data-total]').forEach(function (el) { el.textContent = ORDER.length; });

  readURL();
  renderFilters();
  render();
})();
