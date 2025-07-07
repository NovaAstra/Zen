const context = require.context('@/icons/svg', false, /\.svg$/)
context.keys().map(context)

console.log(context.keys().map(context))