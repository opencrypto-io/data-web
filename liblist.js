const jsUse = `
\`\`\`js
const ocd = require('opencrypto-data-js')

// get data directly
let data = await ocd.get("project", "ethereum")

// get data via client instance
const client = new ocd.Client({ preload: true })
let data = await client.get("project", "ethereum")
\`\`\``

module.exports = {
  js: {
    name: 'JavaScript (Node.js)',
    url: 'https://github.com/opencrypto-io/data-js',
    text: `
Install package using NPM:
\`\`\`
npm install --save opencrypto-data-js
\`\`\`

Include library in your script and use:
${jsUse}
`
  },
  jsweb: {
    name: 'JavaScript (Browser)',
    url: 'https://github.com/opencrypto-io/data-js',
    text: `
Insert script loader into your html:
\`\`\`html
<script src="https://opencrypto-io.github.io/data-js/dist/ocd.lib.min.js"></script>
\`\`\`

And use in your scripts:
${jsUse}
`
  },
  php: {
    name: 'PHP',
    planned: true
  },
  ruby: {
    name: 'Ruby',
    planned: true
  }
}
