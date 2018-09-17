showdown.extension('codehighlight', function() {
   function htmlunencode(text) {
    return (
      text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
      );
  }
  return [
    {
      type: 'output',
      filter: (text, converter, options) => {
        var left  = '<pre><code\\b[^>]*>',
            right = '</code></pre>',
            flags = 'g',
            replacement = function (wholeMatch, match, left, right) {
              match = htmlunencode(match);
              let m = wholeMatch.match(/code class="([^\s]+)/)
              if (m) {
                return left + hljs.highlight(m[1], match).value + right;
              }
              return left + match + right;
            };
        return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
      }
    }
  ]
})
const markdown = new showdown.Converter({ extensions: [ 'codehighlight'] })

var baseUrl = ''
if (window.location.hostname === 'localhost') {
  baseUrl = 'https://data.opencrypto.io/'
}
if (window.location.hostname.match('localtunnel.me')) {
  baseUrl = 'http://' + window.location.hostname + '/data/'
}

function makeUrl (url) {
  return [ baseUrl, url ].join('/')
}

const client = new ocd.Client({ dataUrl: makeUrl('data.json') })
const pick = [ 'projects', 'ledgers', 'networks', 'assets', 'clients', 'exchanges' ]

var counts = {}
var contributors = []
var formattedSource = null
var sampleSource = null
var sampleSourceProject = 'ethereum'

var format = 'yaml'
var metadata = null
var sampleId = 'ethereum'
var query = ''
var model = 'project'
var exampleIds = {
  project: 'ethereum',
  ledger: 'bitcoin:bitcoin',
  asset: 'makerdao:dai',
  client: 'bitcoin:bitcoin-core',
  network: 'ethereum:ethereum:main',
  exchange: 'binance:binance',
  market: 'makerdao:oasis:market'
}

var defs = null

var Counter = {
  oninit: async function () {
    defs = await ocd.query('collections')
    pick.forEach(async function (d) {
      let cd = defs[d]
      if (!cd.path) {
        cd.path = []
      }
      const q = `${cd.path.map(k => k + 's[]').concat([`${d}[]`]).join('.')} | length(@)`
      counts[d] = await client.query(q) || 0
      console.log(q, counts)
    })
  },
  view: function () {
    if (!defs) {
      return m('center', 'Loading ..')
    }
    function renderCol (col) {
      return m('article.tile.is-child.has-text-centered', [
        m('span.col', `# ${col[0].toUpperCase() + col.substring(1)}`),
        m('div.count', counts[col] || m('span', { style: 'color: gray;' }, '?'))
      ])
    }
    let arrs = []
    let colNum = 3
    pick.forEach((col, i) => {
      let c = Math.floor((i)/colNum)
      if (!arrs[c]) arrs[c] = []
      arrs[c].push(renderCol(col))
    })
    return m('div', { style: 'width:100%;' }, [
      m('.is-hidden-tablet', arrs.map((cols) => {
        return m('.tile.is-parent.is-flex-touch', cols)
      })),
      m('.is-hidden-mobile', [
        m('.tile.is-parent.is-flex-touch', pick.map(renderCol))
      ])
    ])
  }
}
var Contributors = {
  oninit: function () {
    contributors = []
    return m.request({
      url: makeUrl('contributors.json')
    }).then(function (res) {
      contributors = res.slice(0, 40)
    })
  },
  view: function () {
    if (contributors.length === 0) return m('div', 'Loading GitHub data ..')
    return m('div', [
      m('p.title.is-4', [
        m('a.silent-link', { href: 'https://github.com/opencrypto-io/data/graphs/contributors'}, 'Contributors'),
        m('span.light', ' (' + contributors.length + ' people)')
      ]),
      m('div.content', contributors.map(function (c) {
        return m('a.contributor', { href: c.html_url },
          m('img.avatar', { src: c.avatar_url }, c.login))
      }))
    ])
  }
}
function setFormat (type) {
  format = type
  formatSource(sampleSource)
}
async function setQuery (q) {
  query = q
  redrawSource()
}
async function setModel (q, prev) {
  model = q
  if (q !== prev) {
    return setId(exampleIds[q])
  }
  redrawSource()
}
async function setId (q) {
  sampleId = q
  sampleSourceProject = q.split(':')[0]
  redrawSource()
}
async function redrawSource () {
  if (query === '') {
    query = undefined
  }
  try {
    sampleSource = await client.get(model, sampleId, query)
  } catch (e) {
    console.error('Query error: ' + e)
    sampleSource = e.toString()
  }
  formatSource(sampleSource)
  m.redraw()
}
function formatSource (res) {
  let dump = null
  let type = null
  if (format === 'json') {
    dump = JSON.stringify(res, null, 2)
    type = 'json'
  } else {
    dump = jsyaml.dump(res)
    type = 'yaml'
  }
  formattedSource = hljs.highlight(type, dump).value
}
var DataSample = {
  oninit: async function () {
    redrawSource()
    // m.redraw()
  },
  view: function () {
    if (!defs) {
      return m('center', 'Loading ..')
    }
    return m('div', [
      m('.sample-header', [
        m('.sample-header-container', [
          m('.level', [
            m('.level-item', [
              // m("label", { style: "padding-right: 0.5em;"}, "Model: "),
              m('.select', m('select', { type: 'text', value: model, oninput: m.withAttr('value', setModel) }, pick.map(function (k) {
                const sd = defs[k].schema
                return m('option', { id: sd }, sd)
              })))
            ]),
            m('.level-item', [
              // m("label", { style: "padding-right: 0.5em;"}, "Id: "),
              m('input.input', { type: 'text', value: sampleId, oninput: m.withAttr('value', setId), placeholder: 'Item ID ..' })
            ]),
            m('.level-item', [
              // m("label", { style: "padding-right: 0.5em;"}, "Query: "),
              m('input.input', { type: 'text', value: query, oninput: m.withAttr('value', setQuery), placeholder: 'Query ..' })
            ])
          ])
        ])
      ]),
      m('pre', m('code', m.trust(formattedSource))),
      m('.sample-footer', { style: 'padding-top: 0.5em;' }, [
        m('.level', [
          m('.level-left', [
            m('.control.level-item', [
              m('a', { onclick: m.withAttr('value', setFormat), name: 'format', value: 'yaml', class: (format === 'yaml') ? 'checked' : '' }, 'YAML'),
              m.trust('&nbsp;-&nbsp;'),
              m('a', { onclick: m.withAttr('value', setFormat), name: 'format', value: 'json', class: (format === 'json') ? 'checked' : '' }, ' JSON')
            ])
          ]),
          m('.level-right', [
            m('.level-item', m('a', { href: 'https://github.com/opencrypto-io/data/blob/master/db/projects/' + sampleSourceProject + '/project.yaml', style: 'color: white;', target: '_blank' }, [
              m('i.far.fa-file'),
              m('span', ' Source file')
            ])),
            m('.level-item', m('a', { href: 'https://github.com/opencrypto-io/data/edit/master/db/projects/' + sampleSourceProject + '/project.yaml', style: 'color: white;', target: '_blank' }, [
              m('i.far.fa-edit'),
              m('span', ' Edit')
            ]))
          ])
        ])
      ])
    ])
  }
}
var LastCommit = {
  oninit: async function () {
    metadata = await client.query('metadata')
    m.redraw()
  },
  view: function () {
    if (!metadata) return null
    let commitShort = metadata.commit.replace(/^(.{7}).+(.{7})$/, '$1')
    return m('div', [
      m('div.is-hidden-mobile', 'Last commit: '),
      m('a', { href: 'https://github.com/opencrypto-io/data/commits/master', title: metadata.commit }, commitShort),
      m('span', ' (' + moment(metadata.time).fromNow() + ')')
    ])
  }
}

const libs = require('./liblist')
var curLib = null
var curLibHtml = null

function showLib (lib) {
  curLib = lib
	if (libs[lib] && libs[lib].text) {
    let md  = libs[curLib].text
    let html = markdown.makeHtml(libs[curLib].text)
		curLibHtml = m.trust(html)
	} else {
    curLibHtml = null
  }
	//setTimeout(() => hljs.initHighlighting(), 2000)
}
showLib('js')

const Libraries = {
  view: () => {
    return m('div', [
      m('.level.tabs', [
        m('.level-left', Object.keys(libs).map((lk) => {
          let lib = libs[lk]
          if (lib.planned) {
            return m('.level-item', { class: 'planned' }, lib.name + ' (planned)')
          }
          return m('.level-item', { class: curLib === lk ? 'selected' : null }, m('a', { onclick: m.withAttr('id', showLib), id: lk }, lib.name))
        }))
      ]),
      curLibHtml ? m('.content', m('div', [ curLibHtml, m('p', ['Library Source: ',m('a', { href: libs[curLib].url }, libs[curLib].url)])])) : null
    ])
  }
}

m.mount(document.getElementById('libraries'), Libraries)
m.mount(document.getElementById('counters'), Counter)
m.mount(document.getElementById('contributors'), Contributors)
m.mount(document.getElementById('data-sample'), DataSample)
m.mount(document.getElementById('last-commit'), LastCommit)
