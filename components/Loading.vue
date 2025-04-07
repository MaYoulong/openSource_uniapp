<template>
  <view class="loading-container" v-if="show">
    <view class="loading-overlay"></view>
    <view class="loading-content">
      <view class="loading-spinner">
        <view v-for="(item, index) in 4" :key="index" :class="['spinner-item', `delay-${index}`]"></view>
      </view>
      <text class="loading-text">{{ text || '加载中...' }}</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  // 是否显示加载中
  show: {
    type: Boolean,
    default: false
  },
  // 加载文本
  text: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
  background-color: rgba(20, 40, 80, 0.9);
  border-radius: 15rpx;
  box-shadow: 0 0 20rpx rgba(0, 150, 255, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.3);
}

.loading-spinner {
  display: flex;
  justify-content: center;
  margin-bottom: 20rpx;
}

.spinner-item {
  width: 20rpx;
  height: 40rpx;
  margin: 0 5rpx;
  background-color: #00a8ff;
  animation: loading-animation 1.2s infinite ease-in-out;
  border-radius: 2rpx;
}

.delay-0 {
  animation-delay: 0s;
}

.delay-1 {
  animation-delay: 0.1s;
}

.delay-2 {
  animation-delay: 0.2s;
}

.delay-3 {
  animation-delay: 0.3s;
}

@keyframes loading-animation {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    background-color: #00a8ff;
  }
  20% {
    transform: scaleY(1);
    background-color: #00f7ff;
  }
}

.loading-text {
  color: #fff;
  font-size: 28rpx;
  letter-spacing: 2rpx;
  text-shadow: 0 0 10rpx rgba(0, 162, 255, 0.7);
}
</style>