
var baseUrl = ''
if (window.location.hostname === 'localhost') {
  baseUrl = 'https://data.opencrypto.io/'
}

function makeUrl(url) {
  return [ baseUrl, url ].join('/')
}

const client = new ocd.Client({ dataUrl: makeUrl('data.json') })
const defs = {
  Projects: { model: 'project', path: "projects[]" },
  Assets: { model: 'asset', path: "projects[].assets[]" },
  Networks: { model: 'network', path: "projects[].assets[].networks[]" },
  Exchanges: { model: 'exchange', path: "projects[].exchanges[]" },
  Clients: { model: 'client', path: "projects[].clients[]" },
  Apps: { model: 'app', path: "projects[].apps[]" }
}
var counts = {}
var contributors = []
var formattedSource = null
var sampleSource = null
var sampleSourceProject = "ethereum"

var format = "yaml"
var metadata = null
var sampleId = "ethereum"
var query = ""
var model = "project"
var exampleIds = {
  project: "ethereum",
  asset: "ethereum:eth",
  network: "ethereum:eth:main",
  exchange: "makerdao:oasis",
  market: "makerdao:oasis:market"
}

var Counter = {
  oninit: async function() {
    Object.keys(defs).forEach(async function(d) {
      let cd = defs[d]
      if (!cd.path) {
        counts[d] = 0
        return null
      }
      counts[d] = await client.query(cd.path + " | length(@)")
    })
  },
  view: function() {
    return Object.keys(defs).map(function(col) {
      return m(".tile.is-parent",
        m("article.tile.is-child.has-text-centered", [
          m("span.col", "# " + col),
          m("div.count", counts[col] || m("span", { style: "color: gray;" }, "?"))
        ])
      )
    })
  }
}
var Contributors = {
  oninit: function() {
    contributors = []
    return m.request({
      url: makeUrl("contributors.json")
    }).then(function(res) {
      contributors = res.slice(0, 40)
    })
  },
  view: function() {
    if (contributors.length === 0) return m("div", "Loading GitHub data ..");
    return m("div", [
      m("p.title.is-4", [
        m("b",m("a.silent-link", { href: "https://github.com/opencrypto-io/data/graphs/contributors"}, "Contributors")),
        " - " + contributors.length + " people"
      ]),
      m("div.content", contributors.map(function(c) {
        return m("a.contributor", { href: c.html_url },
          m("img.avatar", { src: c.avatar_url }, c.login))
      }))
    ])
  }
}
function setFormat(type) {
  format = type
  formatSource(sampleSource)
}
async function setQuery(q) {
  query = q
  redrawSource()
}
async function setModel(q, prev) {
  model = q
  if (q !== prev) {
    return setId(exampleIds[q])
  }
  redrawSource()
}
async function setId(q) {
  sampleId = q
  sampleSourceProject = q.split(":")[0]
  redrawSource()
}
async function redrawSource() {
  if (query === "") {
    query = undefined
  }
  try {
    sampleSource = await client.get(model, sampleId, query)
  } catch (e) {
    console.error("Query error: " + e)
    sampleSource = e.toString()
  }
  formatSource(sampleSource)
  m.redraw()
}
function formatSource(res) {
  let dump = null
  if (format === "json") {
    dump = JSON.stringify(res, null, 2)
  } else {
    dump = jsyaml.dump(res)
  }
  formattedSource = hljs.highlightAuto(dump).value
}
var DataSample = {
  oninit: async function() {
    redrawSource()
    //m.redraw()
  },
  view: function() {
    return m("div", [
      m(".sample-header", [
        m(".sample-header-container", [
          m(".level", [
            m('.level-item', [
              //m("label", { style: "padding-right: 0.5em;"}, "Model: "),
              m(".select", m("select", { type: "text", value: model, oninput: m.withAttr("value", setModel) }, Object.keys(defs).map(function(k) {
                return m("option", { id: defs[k].model }, defs[k].model)
              })))
            ]),
            m('.level-item', [
              //m("label", { style: "padding-right: 0.5em;"}, "Id: "),
              m("input.input", { type: "text", value: sampleId, oninput: m.withAttr("value", setId), placeholder: 'Item ID ..' })
            ]),
            m('.level-item', [
              //m("label", { style: "padding-right: 0.5em;"}, "Query: "),
              m("input.input", { type: "text", value: query, oninput: m.withAttr("value", setQuery), placeholder: 'Query ..' })
            ])
          ])
        ]),
      ]),
      m("pre", m("code", m.trust(formattedSource))),
      m(".sample-footer", { style: "padding-top: 0.5em;" }, [
        m(".level", [
          m(".level-left", [
            m(".control.level-item", [
              m("a", { onclick: m.withAttr("value", setFormat), name: "format", value: "yaml", class: (format === "yaml") ? 'checked' : '' }, "YAML"),
              m.trust("&nbsp;-&nbsp;"),
              m("a", { onclick: m.withAttr("value", setFormat), name: "format", value: "json", class: (format === "json") ? 'checked' : '' }, " JSON")
            ])
          ]),
          m(".level-right", [
            m(".level-item", m("a", { href: "https://github.com/opencrypto-io/data/blob/master/db/projects/"+sampleSourceProject+"/project.yaml", style: "color: white;" }, [
              m("i.far.fa-file"),
              m("span", " Source file")
            ])),
            m(".level-item", m("a", { href: "https://github.com/opencrypto-io/data/edit/master/db/projects/"+sampleSourceProject+"/project.yaml", style: "color: white;" }, [
              m("i.far.fa-edit"),
              m("span", " Edit")
            ])),
          ])
        ])
      ])
    ])
  }
}
var LastCommit = {
  oninit: async function() {
    metadata = await client.query("metadata")
    m.redraw()
  },
  view: function() {
    if (!metadata) return null
    return m("div", [
      m("div", [
        m("b", "Last commit"),
        " ("+moment(metadata.time).fromNow()+")",
      ]),
      m("a", { href: "https://github.com/opencrypto-io/data/commits/master" }, metadata.commit)
    ])
  }
}
m.mount(document.getElementById('counters'), Counter)
m.mount(document.getElementById('contributors'), Contributors)
m.mount(document.getElementById('data-sample'), DataSample)
m.mount(document.getElementById('last-commit'), LastCommit)
