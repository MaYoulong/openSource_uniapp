<template>
  <view class="container">
    <!-- 顶部状态栏 -->
    <view class="header">
      <view class="app-info">
        <text class="app-title">开源节流-智能灌溉控制系统</text>
        <text class="app-subtitle">MYL</text>
      </view>
      
      <view class="status-bar">
        <view class="status-item">
          <text class="status-label">模式</text>
          <text class="status-value" :class="{ 'auto': isAutoMode }">
            {{ isAutoMode ? '自动' : '手动' }}
          </text>
        </view>
        
        <view class="status-item">
          <text class="status-label">当前规则</text>
          <text class="status-value rule">{{ currentRule || '未设置' }}</text>
        </view>
        
        <view class="status-item settings">
          <view class="setting-btn" @click="showIpDialog = true">
            <view class="setting-icon ip"></view>
            <text>修改IP</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 主内容区域 -->
    <view class="main-content">
      <!-- 左侧区域：语音助手 -->
      <view class="left-panel">
        <voice-assistant/>
      </view>
      
      <!-- 中间区域：设备控制 -->
      <view class="center-panel">
        <device-control/>
      </view>
      
      <!-- 右侧区域：模式切换和规则管理 -->
      <view class="right-panel">
        <view class="top-section">
          <mode-switch/>
        </view>
        <view class="bottom-section">
          <plant-rules/>
        </view>
      </view>
    </view>
    
    <!-- IP地址设置弹出框 -->
    <view class="dialog-overlay" v-if="showIpDialog" @click="showIpDialog = false">
      <view class="dialog-content" @click.stop>
        <text class="dialog-title">修改服务器地址</text>
        <input 
          class="dialog-input" 
          type="text" 
          v-model="newIpAddress" 
          placeholder="请输入新的服务器地址"
        />
        <view class="dialog-actions">
          <button class="dialog-btn cancel" @click="showIpDialog = false">取消</button>
          <button class="dialog-btn confirm" @click="updateServerAddress">确认</button>
        </view>
      </view>
    </view>
    
    <!-- 加载动画 -->
    <loading :show="loading" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { getBaseURL, setBaseURL } from '../../api/index.js';

// 导入组件
import DeviceControl from '../../components/DeviceControl.vue';
import ModeSwitch from '../../components/ModeSwitch.vue';
import PlantRules from '../../components/PlantRules.vue';
import VoiceAssistant from '../../components/VoiceAssistant.vue';
import Loading from '../../components/Loading.vue';

const store = useStore();

// 是否自动模式
const isAutoMode = computed(() => store.getters.isAutoMode);
// 当前规则
const currentRule = computed(() => store.state.currentRule);
// 加载状态
const loading = computed(() => store.state.loading);

// IP地址设置
const showIpDialog = ref(false);
const newIpAddress = ref('');

// 更新服务器地址
const updateServerAddress = () => {
  if (newIpAddress.value) {
    setBaseURL(newIpAddress.value);
    uni.showToast({
      title: '服务器地址已更新',
      icon: 'success'
    });
    showIpDialog.value = false;
    
    // 重新初始化应用数据
    store.dispatch('initApp');
  } else {
    uni.showToast({
      title: '请输入有效地址',
      icon: 'none'
    });
  }
};

// 页面加载时初始化数据
onMounted(() => {
  // 初始化服务器地址
  newIpAddress.value = getBaseURL();
  
  // 初始化应用数据
  store.dispatch('initApp');
  
  // 设置全屏
  if (uni.getSystemInfoSync().platform === 'android') {
    // 确保安卓平台全屏显示
    setTimeout(() => {
      if (typeof plus !== 'undefined' && plus.navigator) {
        plus.navigator.setFullscreen(true);
      }
    }, 1000);
  }
});
</script>

<style>
/* 全局样式 */
page {
  background-color: #051020;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #051025 0%, #0a1a30 100%);
  overflow: hidden;
}

/* 顶部状态栏 */
.header {
  padding: 20rpx 40rpx;
  background: linear-gradient(to right, #0a1525, #0a1a30);
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.2);
}

.app-info {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #0cf;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
}

.app-subtitle {
  font-size: 24rpx;
  color: #8ab4fe;
  margin-top: 5rpx;
}

.status-bar {
  display: flex;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  margin-left: 40rpx;
  background-color: rgba(0, 30, 60, 0.3);
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  border: 1px solid rgba(0, 150, 255, 0.1);
}

.status-label {
  font-size: 24rpx;
  color: #8ab4fe;
  margin-right: 15rpx;
}

.status-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #00ff88;
}

.status-value.auto {
  color: #00a8ff;
}

.status-value.rule {
  color: #ffaa00;
}

.settings {
  background: none;
  border: none;
}

.setting-btn {
  display: flex;
  align-items: center;
  background-color: rgba(0, 100, 200, 0.2);
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
  cursor: pointer;
  border: 1px solid rgba(0, 150, 255, 0.2);
  transition: all 0.3s;
}

.setting-btn:hover {
  background-color: rgba(0, 100, 200, 0.4);
}

.setting-icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 10rpx;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.setting-icon.ip::before {
  content: "IP";
  font-size: 24rpx;
  font-weight: bold;
  color: #0cf;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
  overflow: hidden;
}

.left-panel {
  width: 30%;
  height: 100%;
}

.center-panel {
  width: 35%;
  height: 100%;
}

.right-panel {
  width: 35%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.top-section {
  height: 42%; /* 稍微增加运行模式区域的高度 */
}

.bottom-section {
  height: 58%; /* 相应减小种植物规则区域的高度 */
}

/* IP地址设置弹出框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.dialog-content {
  background: linear-gradient(135deg, #1a2a4a 0%, #0a1525 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  width: 600rpx;
  box-shadow: 0 0 30rpx rgba(0, 150, 255, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.3);
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #0cf;
  margin-bottom: 30rpx;
  display: block;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
  text-align: center;
}

.dialog-input {
  width: 100%;
  height: 80rpx;
  background-color: rgba(0, 30, 60, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 10rpx;
  padding: 0 20rpx;
  color: #fff;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.dialog-btn {
  padding: 15rpx 50rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
}

.dialog-btn.cancel {
  background-color: #444;
  color: #fff;
}

.dialog-btn.confirm {
  background: linear-gradient(to right, #0066cc, #0099ff);
  color: white;
}

/* 媒体查询，确保在不同尺寸平板上布局合理 */
@media screen and (max-height: 1000px) {
  .top-section {
    height: 46%; /* 在较低高度的屏幕上增加运行模式区域比例 */
  }
  
  .bottom-section {
    height: 54%;
  }
}

@media screen and (max-height: 800px) {
  .top-section {
    height: 50%; /* 在更低高度的屏幕上进一步增加运行模式区域比例 */
  }
  
  .bottom-section {
    height: 50%;
  }
}
</style>