/**
 * LinkedIn Alumni Scraper - Frontend Entry Point
 * 
 * [MAIN] Main application bootstrap file for Vue.js 3 frontend.
 * Configures FontAwesome icons, creates the app instance, and mounts to DOM.
 * 
 * [DEPS] Dependencies:
 * - Vue.js 3: Main frontend framework
 * - FontAwesome: Icon library for enhanced UI
 * - Tailwind CSS: Utility-first CSS framework
 * 
 * [CONFIG] Configuration:
 * - Registers FontAwesome icons for UI components
 * - Sets up global FontAwesome component
 * - Mounts app to #app element in index.html
 * 
 * Author: IlhamriSKY
 * Framework: Vue.js 3 + FontAwesome + Tailwind CSS
 */

import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

/* FontAwesome Configuration */
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
    faUser, 
    faLock, 
    faSearch, 
    faDownload, 
    faPlay, 
    faStop, 
    faCheckCircle,
    faExclamationTriangle,
    faSpinner,
    faChartBar,
    faTable,
    faUpload,
    faCog,
    faDatabase,
    faEye,
    faRefresh
} from '@fortawesome/free-solid-svg-icons'

import { 
    faLinkedin 
} from '@fortawesome/free-brands-svg-icons'

/* Add icons to library */
library.add(
    faUser, faLock, faSearch, faDownload, faPlay, faStop, 
    faCheckCircle, faExclamationTriangle, faSpinner, faChartBar,
    faTable, faUpload, faCog, faDatabase, faEye, faRefresh,
    faLinkedin
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
