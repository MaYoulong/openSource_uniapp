<script>
export default {
  onLaunch: function() {
    console.log('App Launch');
    
    // 设置全屏显示，隐藏系统状态栏和任务栏
    this.setFullScreen();
  },
  
  onShow: function() {
    console.log('App Show');
    
    // 进入前台时再次确保全屏模式
    this.setFullScreen();
  },
  
  onHide: function() {
    console.log('App Hide');
  },
  
  methods: {
    setFullScreen() {
      // 使用setTimeout确保在应用完全加载后执行
      setTimeout(() => {
        if (typeof plus !== 'undefined') {
          try {
            // 强制横屏
            plus.screen.lockOrientation('landscape');
            
            // 隐藏系统状态栏
            plus.navigator.setFullscreen(true);
            
            // 获取当前Webview
            const currentWebview = plus.webview.currentWebview();
            
            // 设置应用全屏显示
            currentWebview.setStyle({
              position: 'absolute',
              top: '0px',
              bottom: '0px',
              left: '0px',
              right: '0px',
              background: '#051020',
              // 以下设置确保全屏显示，隐藏状态栏和底部虚拟按键区
              popGesture: 'none',
              scrollIndicator: 'none',
              softinputMode: 'adjustResize'
            });
            
            // 更彻底的全屏设置
            plus.navigator.setStatusBarBackground('#000000');
            plus.navigator.setStatusBarStyle('dark');
            plus.navigator.setFullscreen(true);
            
            // 使用更高级的隐藏任务栏方法
            if (plus.os.name.toLowerCase() === 'android') {
              // Android平台特定处理
              const context = plus.android.importClass('android.content.Context');
              const window = plus.android.runtimeMainActivity().getWindow();
              const View = plus.android.importClass('android.view.View');
              
              // 设置完全沉浸式显示
              const FLAG_FULLSCREEN = 0x00000400;
              window.setFlags(FLAG_FULLSCREEN, FLAG_FULLSCREEN);
              
              // 隐藏导航栏
              const decorView = window.getDecorView();
              const SYSTEM_UI_FLAG_HIDE_NAVIGATION = 0x00000002;
              const SYSTEM_UI_FLAG_FULLSCREEN = 0x00000004;
              const SYSTEM_UI_FLAG_IMMERSIVE_STICKY = 0x00001000;
              const SYSTEM_UI_FLAG_LAYOUT_STABLE = 0x00000100;
              const SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION = 0x00000200;
              const SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN = 0x00000400;
              
              // 组合所有标志
              const flags = SYSTEM_UI_FLAG_HIDE_NAVIGATION | 
                          SYSTEM_UI_FLAG_FULLSCREEN |
                          SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                          SYSTEM_UI_FLAG_LAYOUT_STABLE |
                          SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                          SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
              
              decorView.setSystemUiVisibility(flags);
            } else if (plus.os.name.toLowerCase() === 'ios') {
              // iOS平台特定处理
              // 通过调整安全区域实现全屏
              const statusBarHeight = plus.navigator.getStatusbarHeight();
              currentWebview.setStyle({
                top: -statusBarHeight + 'px',
                bottom: '0px'
              });
            }
          } catch (e) {
            console.error('设置全屏失败:', e.message);
          }
        }
      }, 300);
    }
  }
};
</script>

<style>
/*每个页面公共css */
/* 处理状态栏安全区域 */
page {
  --status-bar-height: 0px;
  --window-top: 0px;
  --window-bottom: 0px;
  background-color: #051020;
  color: #fff;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

/* 确保内容填满整个屏幕 */
uni-page-body,
uni-page-wrapper,
uni-page {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* 处理iOS刘海屏适配 */
.safe-area-inset-top {
  height: 0;
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.safe-area-inset-bottom {
  height: 0;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
</style>