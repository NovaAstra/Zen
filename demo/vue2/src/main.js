import Vue from 'vue'
import App from './App.vue'
import Scheduler from './Scheduler/index.vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const routes = [
  { path: '/scheduler', component: Scheduler }
]
const router = new VueRouter({
  routes
})


Vue.config.productionTip = false


new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
