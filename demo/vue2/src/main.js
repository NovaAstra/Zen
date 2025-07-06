import '@/styles/tailwindcss.css'
import '@/styles/element-variables.scss'
import '@/styles/index.scss'

import Vue from 'vue'
import Cookies from 'js-cookie'
import Element from 'element-ui'
import EN from 'element-ui/lib/locale/lang/en'

import App from '@/App.vue'

Vue.use(Element, {
  size: Cookies.get('size') || 'medium', // set element-ui default size
  locale: EN // 如果使用中文，无需设置，请删除
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
