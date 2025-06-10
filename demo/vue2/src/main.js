import Vue from 'vue'
import App from './App.vue'
import A from './A/index.vue'
import Dag from './Dag/index.vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const routes = [
  { path: '/foo', component: A },
  { path: '/bar', component: Dag }
]
const router = new VueRouter({
  routes
})


Vue.config.productionTip = false


new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
