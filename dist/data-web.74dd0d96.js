// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"index.js":[function(require,module,exports) {

var baseUrl = '';
if (window.location.hostname === 'localhost') {
  baseUrl = 'https://data.opencrypto.io/';
}

function makeUrl(url) {
  return [baseUrl, url].join('/');
}

const client = new ocd.Client({ dataUrl: makeUrl('data.json') });
const defs = {
  Projects: { model: 'project', path: "projects[]" },
  Assets: { model: 'asset', path: "projects[].assets[]" },
  Networks: { model: 'network', path: "projects[].assets[].networks[]" },
  Exchanges: { model: 'exchange', path: "projects[].exchanges[]" },
  Clients: { model: 'client', path: "projects[].clients[]" },
  Apps: { model: 'app', path: "projects[].apps[]" }
};
var counts = {};
var contributors = [];
var formattedSource = null;
var sampleSource = null;
var sampleSourceProject = "ethereum";

var format = "yaml";
var metadata = null;
var sampleId = "ethereum";
var query = "";
var model = "project";
var exampleIds = {
  project: "ethereum",
  asset: "ethereum:eth",
  network: "ethereum:eth:main",
  exchange: "makerdao:oasis",
  market: "makerdao:oasis:market"
};

var Counter = {
  oninit: async function () {
    Object.keys(defs).forEach(async function (d) {
      let cd = defs[d];
      if (!cd.path) {
        counts[d] = 0;
        return null;
      }
      counts[d] = await client.query(cd.path + " | length(@)");
    });
  },
  view: function () {
    return Object.keys(defs).map(function (col) {
      return m(".tile.is-parent", m("article.tile.is-child.has-text-centered", [m("span.col", "# " + col), m("div.count", counts[col] || m("span", { style: "color: gray;" }, "?"))]));
    });
  }
};
var Contributors = {
  oninit: function () {
    contributors = [];
    return m.request({
      url: makeUrl("contributors.json")
    }).then(function (res) {
      contributors = res.slice(0, 40);
    });
  },
  view: function () {
    if (contributors.length === 0) return m("div", "Loading GitHub data ..");
    return m("div", [m("p.title.is-4", [m("b", m("a.silent-link", { href: "https://github.com/opencrypto-io/data/graphs/contributors" }, "Contributors")), " - " + contributors.length + " people"]), m("div.content", contributors.map(function (c) {
      return m("a.contributor", { href: c.html_url }, m("img.avatar", { src: c.avatar_url }, c.login));
    }))]);
  }
};
function setFormat(type) {
  format = type;
  formatSource(sampleSource);
}
async function setQuery(q) {
  query = q;
  redrawSource();
}
async function setModel(q, prev) {
  model = q;
  if (q !== prev) {
    return setId(exampleIds[q]);
  }
  redrawSource();
}
async function setId(q) {
  sampleId = q;
  sampleSourceProject = q.split(":")[0];
  redrawSource();
}
async function redrawSource() {
  if (query === "") {
    query = undefined;
  }
  try {
    sampleSource = await client.get(model, sampleId, query);
  } catch (e) {
    console.error("Query error: " + e);
    sampleSource = e.toString();
  }
  formatSource(sampleSource);
  m.redraw();
}
function formatSource(res) {
  let dump = null;
  if (format === "json") {
    dump = JSON.stringify(res, null, 2);
  } else {
    dump = jsyaml.dump(res);
  }
  formattedSource = hljs.highlightAuto(dump).value;
}
var DataSample = {
  oninit: async function () {
    redrawSource();
    //m.redraw()
  },
  view: function () {
    return m("div", [m(".sample-header", [m(".sample-header-container", [m(".level", [m('.level-item', [
    //m("label", { style: "padding-right: 0.5em;"}, "Model: "),
    m(".select", m("select", { type: "text", value: model, oninput: m.withAttr("value", setModel) }, Object.keys(defs).map(function (k) {
      return m("option", { id: defs[k].model }, defs[k].model);
    })))]), m('.level-item', [
    //m("label", { style: "padding-right: 0.5em;"}, "Id: "),
    m("input.input", { type: "text", value: sampleId, oninput: m.withAttr("value", setId), placeholder: 'Item ID ..' })]), m('.level-item', [
    //m("label", { style: "padding-right: 0.5em;"}, "Query: "),
    m("input.input", { type: "text", value: query, oninput: m.withAttr("value", setQuery), placeholder: 'Query ..' })])])])]), m("pre", m("code", m.trust(formattedSource))), m(".sample-footer", { style: "padding-top: 0.5em;" }, [m(".level", [m(".level-left", [m(".control.level-item", [m("a", { onclick: m.withAttr("value", setFormat), name: "format", value: "yaml", class: format === "yaml" ? 'checked' : '' }, "YAML"), m.trust("&nbsp;-&nbsp;"), m("a", { onclick: m.withAttr("value", setFormat), name: "format", value: "json", class: format === "json" ? 'checked' : '' }, " JSON")])]), m(".level-right", [m(".level-item", m("a", { href: "https://github.com/opencrypto-io/data/blob/master/db/projects/" + sampleSourceProject + "/project.yaml", style: "color: white;" }, [m("i.far.fa-file"), m("span", " Source file")])), m(".level-item", m("a", { href: "https://github.com/opencrypto-io/data/edit/master/db/projects/" + sampleSourceProject + "/project.yaml", style: "color: white;" }, [m("i.far.fa-edit"), m("span", " Edit")]))])])])]);
  }
};
var LastCommit = {
  oninit: async function () {
    metadata = await client.query("metadata");
    m.redraw();
  },
  view: function () {
    if (!metadata) return null;
    return m("div", [m("div", [m("b", "Last commit"), " (" + moment(metadata.time).fromNow() + ")"]), m("a", { href: "https://github.com/opencrypto-io/data/commits/master" }, metadata.commit)]);
  }
};
m.mount(document.getElementById('counters'), Counter);
m.mount(document.getElementById('contributors'), Contributors);
m.mount(document.getElementById('data-sample'), DataSample);
m.mount(document.getElementById('last-commit'), LastCommit);
},{}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '60904' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();

      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';

  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/data-web.74dd0d96.map