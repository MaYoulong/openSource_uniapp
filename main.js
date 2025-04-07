import App from './App'
import { createSSRApp } from 'vue'
import store from './store/index.js'

export function createApp() {
  const app = createSSRApp(App)
  
  // 添加状态管理
  app.use(store)
  
  // 禁用UniApp自动调整机制，使用自定义全屏处理
  app.config.globalProperties.$autoAdjustStatusBar = false
  
  // 添加全局错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('应用错误:', err, info)
  }
  
  // 注册全局方法
  app.config.globalProperties.$setFullScreen = () => {
    // 适用于应用内部页面动态调用全屏
    if (typeof plus !== 'undefined') {
      plus.navigator.setFullscreen(true)
      
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({
          popGesture: 'none',
          background: '#051020'
        })
      }
      
      if (plus.os.name.toLowerCase() === 'android') {
        try {
          const window = plus.android.runtimeMainActivity().getWindow()
          const View = plus.android.importClass('android.view.View')
          const decorView = window.getDecorView()
          
          // Android全屏标志组合
          const flags = 
            0x00000002 | // SYSTEM_UI_FLAG_HIDE_NAVIGATION
            0x00000004 | // SYSTEM_UI_FLAG_FULLSCREEN
            0x00001000 | // SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            0x00000100 | // SYSTEM_UI_FLAG_LAYOUT_STABLE
            0x00000200 | // SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            0x00000400;  // SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          
          decorView.setSystemUiVisibility(flags)
        } catch (e) {
          console.error('Android全屏设置失败:', e)
        }
      }
    }
  }
  
  return {
    app
  }
}