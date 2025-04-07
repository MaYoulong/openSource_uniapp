<template>
  <view class="mode-switch-panel">
    <view class="panel-header">
      <text class="panel-title">运行模式</text>
    </view>
    
    <view class="mode-content">
      <view class="mode-options">
        <view 
          class="mode-option" 
          :class="{ 'active': currentMode === 'auto' }"
          @click="switchMode('auto')"
        >
          <view class="option-icon auto-icon">
            <view class="icon-animation" v-if="currentMode === 'auto'"></view>
          </view>
          <view class="option-text-container">
            <text class="option-text">自动模式</text>
            <text class="option-desc">根据规则自动控制</text>
          </view>
        </view>
        
        <view 
          class="mode-option" 
          :class="{ 'active': currentMode === 'manual' }"
          @click="switchMode('manual')"
        >
          <view class="option-icon manual-icon">
            <view class="icon-animation" v-if="currentMode === 'manual'"></view>
          </view>
          <view class="option-text-container">
            <text class="option-text">手动模式</text>
            <text class="option-desc">手动控制每个设备</text>
          </view>
        </view>
      </view>
      
      <view class="current-mode">
        <text class="mode-label">当前模式:</text>
        <view class="mode-indicator" :class="{ 'auto': currentMode === 'auto' }">
          <text class="indicator-text">{{ currentMode === 'auto' ? '自动控制' : '手动控制' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// 当前模式
const currentMode = computed(() => store.state.currentMode);

// 切换模式
const switchMode = async (mode) => {
  if (currentMode.value === mode) return; // 已经是当前模式，不重复切换
  
  try {
    await store.dispatch('setMode', mode);
  } catch (error) {
    console.error('切换模式失败:', error);
  }
};
</script>

<style scoped>
.mode-switch-panel {
  background: linear-gradient(135deg, #1a2a4a 0%, #0a1525 100%);
  border-radius: 20rpx;
  padding: 25rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.2);
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
}

.panel-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #0cf;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
}

.mode-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mode-options {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  flex: 1;
}

.mode-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 15rpx;
  background-color: rgba(0, 30, 60, 0.3);
  border-radius: 15rpx;
  border: 2px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.mode-option.active {
  background-color: rgba(0, 60, 120, 0.3);
  border-color: rgba(0, 200, 255, 0.5);
  box-shadow: 0 0 20rpx rgba(0, 150, 255, 0.3);
}

.option-icon {
  width: 85rpx;
  height: 85rpx;
  background-color: rgba(0, 50, 100, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15rpx;
  position: relative;
  border: 2px solid rgba(0, 150, 255, 0.3);
  overflow: hidden;
}

.auto-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%2300a8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 45rpx 45rpx;
}

.manual-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%2300a8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 45rpx 45rpx;
}

.icon-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 150, 255, 0.2);
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 150, 255, 0.4);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10rpx rgba(0, 150, 255, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(0, 150, 255, 0);
  }
}

.option-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.option-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.option-desc {
  font-size: 22rpx;
  color: #8ab4fe;
  text-align: center;
}

.current-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 1px solid rgba(0, 150, 255, 0.1);
}

.mode-label {
  font-size: 26rpx;
  color: #8ab4fe;
  margin-right: 15rpx;
}

.mode-indicator {
  background-color: #333;
  border-radius: 25rpx;
  padding: 8rpx 30rpx;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.mode-indicator.auto {
  background-color: rgba(0, 100, 200, 0.5);
  border-color: rgba(0, 200, 255, 0.5);
  box-shadow: 0 0 15rpx rgba(0, 150, 255, 0.5);
}

.indicator-text {
  font-size: 26rpx;
  font-weight: bold;
  color: #fff;
}
</style>