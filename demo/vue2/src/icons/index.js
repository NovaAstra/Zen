const context = require.context('./svg', false, /\.svg$/)
context.keys().map(context)

console.log(context.keys().map(context))