<template>
  <view class="device-control">
    <view class="panel-header">
      <text class="panel-title">设备控制</text>
      <view class="panel-status">
        <text class="status-label">当前模式:</text>
        <text class="status-value" :class="{ 'auto-mode': isAutoMode }">
          {{ isAutoMode ? '自动模式' : '手动模式' }}
        </text>
        <view class="mode-switch" @click="toggleMode">
          <view class="switch-track" :class="{ 'is-auto': isAutoMode }">
            <view class="switch-thumb"></view>
          </view>
          <text class="switch-text">{{ isAutoMode ? '自动' : '手动' }}</text>
        </view>
      </view>
    </view>
    
    <view class="device-status-refresh">
      <text class="refresh-text">设备状态每 {{ refreshInterval }}s 自动刷新</text>
      <view class="refresh-btn" @click="manualRefresh">
        <view class="refresh-icon" :class="{ 'refreshing': isRefreshing }"></view>
        <text>刷新</text>
      </view>
      <text class="last-updated">上次更新: {{ lastUpdateTime }}</text>
    </view>
    
    <view class="devices-grid">
      <view 
        v-for="device in deviceList" 
        :key="device.id" 
        class="device-item"
        :class="{ 'is-on': device.status === 'on', 'is-offline': device.status === 'null' }"
      >
        <view class="device-icon">
          <view class="icon-inner" :class="device.id">
            <view class="icon-animation" v-if="device.status === 'on'"></view>
          </view>
        </view>
        <view class="device-info">
          <text class="device-name">{{ device.name }}</text>
          <text class="device-status" :class="{
            'status-on': device.status === 'on',
            'status-off': device.status === 'off',
            'status-offline': device.status === 'null'
          }">
            {{ getStatusText(device.status) }}
          </text>
        </view>
        <view class="device-toggle">
          <view class="toggle-track" 
                :class="{ 'is-on': device.status === 'on' }" 
                @click="toggleDevice(device)"
                :disabled="isAutoMode || device.status === 'null'">
            <view class="toggle-thumb"></view>
          </view>
        </view>
        
        <!-- 自动模式或设备离线遮罩 -->
        <view class="device-mask" v-if="isAutoMode || device.status === 'null'">
          <text class="mask-text">{{ isAutoMode ? '自动控制中' : '设备已断连' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 状态消息提示 -->
    <view class="status-message" v-if="requestStatus.message" :class="{ 'success': requestStatus.success }">
      {{ requestStatus.message }}
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// 获取设备列表
const deviceList = computed(() => store.getters.deviceList);

// 是否自动模式
const isAutoMode = computed(() => store.getters.isAutoMode);

// 请求状态
const requestStatus = computed(() => store.state.requestStatus);

// 刷新相关状态
const isRefreshing = ref(false);
const lastUpdateTime = ref('--:--:--');
const refreshInterval = ref(5); // 刷新间隔，单位：秒
let refreshTimer = null;

// 获取状态文本
const getStatusText = (status) => {
  switch(status) {
    case 'on': return '运行中';
    case 'off': return '已停止';
    case 'null': return '已断连';
    default: return '未知状态';
  }
};

// 切换设备状态（开/关）
const toggleDevice = async (device) => {
  // 如果是自动模式或设备已离线，不允许操作
  if (isAutoMode.value || device.status === 'null') return;
  
  // 切换到相反状态
  const newStatus = device.status === 'on' ? 'off' : 'on';
  
  try {
    await store.dispatch('setDeviceStatus', { device: device.id, status: newStatus });
    // 操作后立即静默更新所有设备状态
    await silentRefresh();
  } catch (error) {
    console.error('控制设备失败:', error);
  }
};

// 切换模式
const toggleMode = async () => {
  const newMode = isAutoMode.value ? 'manual' : 'auto';
  try {
    await store.dispatch('setMode', newMode);
    // 切换模式后立即静默更新所有设备状态
    await silentRefresh();
  } catch (error) {
    console.error('切换模式失败:', error);
  }
};

// 静默刷新设备状态（不显示加载动画）
const silentRefresh = async () => {
  try {
    // 调用带silent参数的actions
    await store.dispatch('fetchAllDevicesStatus', true);
    updateRefreshTime();
  } catch (error) {
    console.error('静默获取设备状态失败:', error);
  }
};

// 手动刷新（显示刷新动画）
const manualRefresh = async () => {
  isRefreshing.value = true;
  try {
    // 不带silent参数，显示普通加载动画
    await store.dispatch('fetchAllDevicesStatus');
    updateRefreshTime();
  } catch (error) {
    console.error('获取设备状态失败:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// 更新刷新时间
const updateRefreshTime = () => {
  const now = new Date();
  lastUpdateTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
};

// 定时刷新设备状态
const startAutoRefresh = () => {
  // 初始化时先获取一次
  silentRefresh();
  
  // 定时获取
  refreshTimer = setInterval(() => {
    silentRefresh();
  }, refreshInterval.value * 1000);
};

// 组件挂载时开始定时刷新
onMounted(() => {
  startAutoRefresh();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.device-control {
  position: relative;
  background: linear-gradient(135deg, #1a2a4a 0%, #0a1525 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.2);
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.panel-status {
  display: flex;
  align-items: center;
}

.status-label {
  font-size: 28rpx;
  color: #8ab4fe;
  margin-right: 10rpx;
}

.status-value {
  font-size: 28rpx;
  font-weight: bold;
  color: #00ff88;
  margin-right: 20rpx;
}

.status-value.auto-mode {
  color: #00a8ff;
}

.mode-switch {
  display: flex;
  align-items: center;
}

.switch-track {
  position: relative;
  width: 70rpx;
  height: 30rpx;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 15rpx;
  margin-right: 10rpx;
  transition: all 0.3s;
  cursor: pointer;
}

.switch-track.is-auto {
  background-color: rgba(0, 150, 255, 0.5);
}

.switch-thumb {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  width: 26rpx;
  height: 26rpx;
  background-color: #fff;
  border-radius: 50%;
  transition: all 0.3s;
}

.switch-track.is-auto .switch-thumb {
  left: calc(100% - 28rpx);
  background-color: #00f7ff;
  box-shadow: 0 0 10rpx #00a8ff;
}

.switch-text {
  font-size: 24rpx;
  color: #8ab4fe;
}

.device-status-refresh {
  display: flex;
  align-items: center;
  background-color: rgba(0, 30, 60, 0.3);
  border-radius: 10rpx;
  padding: 10rpx 20rpx;
  margin-bottom: 20rpx;
  border: 1px solid rgba(0, 150, 255, 0.1);
}

.refresh-text {
  font-size: 24rpx;
  color: #8ab4fe;
  margin-right: auto;
}

.refresh-btn {
  display: flex;
  align-items: center;
  background-color: rgba(0, 100, 200, 0.3);
  padding: 6rpx 15rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #fff;
  margin-right: 15rpx;
  border: 1px solid rgba(0, 150, 255, 0.2);
}

.refresh-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 8rpx;
  border: 2rpx solid #0cf;
  border-radius: 50%;
  border-top-color: transparent;
  position: relative;
}

.refresh-icon.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.last-updated {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
  flex: 1;
  overflow-y: auto;
}

.device-item {
  position: relative;
  background: linear-gradient(165deg, #152642 0%, #0c1528 100%);
  border-radius: 15rpx;
  padding: 25rpx;
  box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s;
  overflow: hidden;
}

.device-item.is-on {
  border: 1px solid rgba(0, 255, 200, 0.4);
  box-shadow: 0 0 20rpx rgba(0, 200, 255, 0.3);
}

.device-item.is-offline {
  opacity: 0.8;
  border: 1px solid rgba(255, 50, 50, 0.4);
}

.device-icon {
  align-self: center;
  width: 100rpx;
  height: 100rpx;
  background-color: rgba(0, 50, 100, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  position: relative;
  border: 2px solid rgba(0, 150, 255, 0.3);
}

.icon-inner {
  width: 60rpx;
  height: 60rpx;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.icon-inner.pump::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40rpx;
  height: 40rpx;
  border: 3rpx solid #0cf;
  border-radius: 50%;
}

.icon-inner.pump::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid #0cf;
  border-radius: 2rpx;
  border-top: none;
  border-left: none;
}

.icon-inner.nitrogen::before,
.icon-inner.phosphorus::before,
.icon-inner.potassium::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36rpx;
  height: 36rpx;
  border: 3rpx solid #0cf;
  border-radius: 8rpx;
}

.icon-inner.nitrogen::after {
  content: "N";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0cf;
  font-size: 26rpx;
  font-weight: bold;
}

.icon-inner.phosphorus::after {
  content: "P";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0cf;
  font-size: 26rpx;
  font-weight: bold;
}

.icon-inner.potassium::after {
  content: "K";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0cf;
  font-size: 26rpx;
  font-weight: bold;
}

.icon-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  box-shadow: 0 0 10rpx rgba(0, 200, 255, 0.8) inset;
  animation: pulsate 1.5s infinite;
}

@keyframes pulsate {
  0% {
    box-shadow: 0 0 10rpx rgba(0, 200, 255, 0.5) inset;
    opacity: 0.5;
  }
  50% {
    box-shadow: 0 0 20rpx rgba(0, 255, 200, 0.8) inset;
    opacity: 1;
  }
  100% {
    box-shadow: 0 0 10rpx rgba(0, 200, 255, 0.5) inset;
    opacity: 0.5;
  }
}

.device-info {
  text-align: center;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.device-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
  display: block;
}

.device-status {
  font-size: 24rpx;
  padding: 4rpx 15rpx;
  border-radius: 10rpx;
  display: inline-block;
}

.status-on {
  color: #00ff88;
  background-color: rgba(0, 100, 50, 0.3);
}

.status-off {
  color: #ff9900;
  background-color: rgba(100, 50, 0, 0.3);
}

.status-offline {
  color: #ff5252;
  background-color: rgba(100, 0, 0, 0.3);
}

.device-toggle {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 15rpx;
}

.toggle-track {
  position: relative;
  width: 80rpx;
  height: 36rpx;
  background-color: rgba(100, 100, 100, 0.3);
  border-radius: 18rpx;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: inset 0 0 5rpx rgba(0, 0, 0, 0.2);
}

.toggle-track.is-on {
  background-color: rgba(0, 150, 255, 0.5);
}

.toggle-track[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-thumb {
  position: absolute;
  top: 3rpx;
  left: 3rpx;
  width: 30rpx;
  height: 30rpx;
  background-color: #fff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.2);
}

.toggle-track.is-on .toggle-thumb {
  left: calc(100% - 33rpx);
  background-color: #00f7ff;
  box-shadow: 0 0 10rpx #00a8ff;
}

.device-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 30, 60, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.3s ease-in-out;
  z-index: 5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mask-text {
  font-size: 28rpx;
  color: #fff;
  background-color: rgba(0, 100, 200, 0.5);
  padding: 8rpx 25rpx;
  border-radius: 8rpx;
  border: 1px solid rgba(0, 200, 255, 0.3);
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.7);
}

.status-message {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 10rpx 30rpx;
  background-color: rgba(255, 50, 50, 0.7);
  color: white;
  border-radius: 10rpx;
  font-size: 24rpx;
  animation: slideIn 0.3s ease-out;
  z-index: 100;
  box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.2);
}

.status-message.success {
  background-color: rgba(50, 200, 100, 0.7);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>