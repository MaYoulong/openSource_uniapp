<template>
  <view class="voice-assistant">
    <view class="panel-header">
      <text class="panel-title">语音助手</text>
      <view class="assistant-status" :class="{ 'active': isListening, 'wakeup': isWakeupActive }">
        <view class="status-dot"></view>
        <text class="status-text">{{ getStatusText }}</text>
      </view>
    </view>
    
    <view class="chat-container">
      <scroll-view 
        scroll-y 
        class="chat-messages" 
        :scroll-top="scrollTop" 
        @scrolltoupper="loadMoreMessages"
        ref="messagesScroll"
        enable-flex
      >
        <view class="scroll-content">
          <view v-if="chatMessages.length === 0" class="empty-state">
            <view class="empty-icon"></view>
            <text class="empty-text">您可以通过语音或文字与我交流</text>
            <view class="examples">
              <text class="example-title">您可以尝试:</text>
              <view class="example-item">
                <view class="example-bullet"></view>
                <text class="example-text">"打开水泵"</text>
              </view>
              <view class="example-item">
                <view class="example-bullet"></view>
                <text class="example-text">"关闭所有设备"</text>
              </view>
              <view class="example-item">
                <view class="example-bullet"></view>
                <text class="example-text">"切换到自动模式"</text>
              </view>
            </view>
          </view>
          
          <view v-else class="messages-container">
            <view
              v-for="(message, index) in chatMessages"
              :key="index"
              class="message-item"
              :class="{ 'user': message.role === 'user', 'assistant': message.role === 'assistant', 'system': message.role === 'system' }"
            >
              <view class="message-avatar" :class="message.role">
                <view class="avatar-icon"></view>
              </view>
              <view class="message-content">
                <view class="message-bubble">{{ message.content }}</view>
                <text class="message-time">{{ formatTime(message.time) }}</text>
              </view>
            </view>
            
            <!-- 打字动画指示器 -->
            <view class="typing-indicator" v-if="isTyping">
              <view class="typing-dot"></view>
              <view class="typing-dot"></view>
              <view class="typing-dot"></view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <view class="chat-input-container">
      <view class="input-wrapper">
        <input 
          class="text-input" 
          type="text" 
          v-model="inputMessage" 
          placeholder="请输入您的问题..."
          @confirm="sendMessage"
          :disabled="isListening"
          adjust-position="false"
        />
      </view>
      
      <view 
        class="voice-btn" 
        :class="{ 'listening': isListening, 'wakeup': isWakeupMode }" 
        @touchstart="startListening" 
        @touchend="stopListening"
        @click="toggleWakeupMode"
      >
        <view class="voice-icon"></view>
        <view class="voice-waves" v-if="isListening">
          <view v-for="(wave, index) in 3" :key="index" class="wave"></view>
        </view>
      </view>
      
      <button 
        class="send-btn" 
        :disabled="!inputMessage || isListening" 
        @click="sendMessage"
      >
        <view class="send-icon"></view>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios'; // 引入axios用于API请求

const store = useStore();

// API配置
const API_CONFIG = {
  // 语音识别API端点
  SPEECH_RECOGNITION_API: 'https://api.yourdomain.com/speech-recognition',
  // 唤醒词检测API端点
  WAKEUP_DETECTION_API: 'https://api.yourdomain.com/wakeup-detection',
  // 文本转语音API端点
  TEXT_TO_SPEECH_API: 'https://api.yourdomain.com/text-to-speech',
  // API密钥
  API_KEY: 'your-api-key'
};

// 聊天消息
const chatMessages = computed(() => store.state.chatMessages);
const inputMessage = ref('');
const isListening = ref(false);
const isTyping = ref(false);
const scrollTop = ref(0);
const messagesScroll = ref(null);
const isWakeupMode = ref(false);  // 是否处于唤醒监听模式
const isWakeupActive = ref(false); // 是否已经被唤醒

// 语音识别相关
let recognitionTimer = null;
let wakeupRestartTimer = null;
let audioRecorder = null;
let audioPlayer = null;
let recordedAudio = null;

// 获取状态文本
const getStatusText = computed(() => {
  if (isWakeupActive.value) return '已唤醒，请说出指令';
  if (isListening.value) return '正在聆听...';
  if (isWakeupMode.value) return '等待唤醒';
  return '待命中';
});

// 初始化语音识别和合成（App环境）
const initSpeechServices = () => {
  try {
    // 初始化录音功能
    if (uni.getRecorderManager) {
      audioRecorder = uni.getRecorderManager();
      
      audioRecorder.onStart(() => {
        console.log('录音开始');
      });
      
      audioRecorder.onStop((res) => {
        console.log('录音结束', res);
        const { tempFilePath } = res;
        recordedAudio = tempFilePath;
        
        if (isWakeupMode.value && !isWakeupActive.value) {
          // 检测唤醒词
          checkWakeupWord(tempFilePath);
        } else {
          // 执行语音识别
          performSpeechRecognition(tempFilePath);
        }
      });
      
      audioRecorder.onError((res) => {
        console.error('录音错误:', res);
        isListening.value = false;
        uni.showToast({
          title: '录音出错，请重试',
          icon: 'none'
        });
      });
    }
    
    // 初始化音频播放器
    if (uni.createInnerAudioContext) {
      audioPlayer = uni.createInnerAudioContext();
      
      audioPlayer.onError((res) => {
        console.error('音频播放错误:', res);
        uni.showToast({
          title: '语音播放失败',
          icon: 'none'
        });
      });
    }
    
    console.log('语音服务初始化成功');
  } catch (error) {
    console.error('初始化语音服务失败:', error);
  }
};

// 检查唤醒词（调用API）
const checkWakeupWord = async (filePath) => {
  console.log('检查唤醒词...');
  uni.showLoading({ title: '检测中...' });
  
  try {
    // 创建表单数据
    const formData = new FormData();
    formData.append('audio', { 
      uri: filePath,
      type: 'audio/mp3',
      name: 'voice.mp3'
    });
    formData.append('wake_word', '小源小源');
    
    // 调用唤醒词检测API
    const response = await axios.post(API_CONFIG.WAKEUP_DETECTION_API, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`
      }
    });
    
    uni.hideLoading();
    
    if (response.data && response.data.detected) {
      console.log('检测到唤醒词!');
      activateAssistant();
    } else {
      console.log('未检测到唤醒词，继续等待');
      if (isWakeupMode.value) {
        isWakeupActive.value = false;
      }
    }
  } catch (error) {
    uni.hideLoading();
    console.error('唤醒词检测失败:', error);
    uni.showToast({
      title: '唤醒词检测失败',
      icon: 'none'
    });
    
    // 出错时，如果仍在唤醒模式，保持监听状态
    if (isWakeupMode.value) {
      isWakeupActive.value = false;
    }
  }
};

// 执行语音识别（调用API）
const performSpeechRecognition = async (filePath) => {
  console.log('执行语音识别...');
  uni.showLoading({ title: '识别中...' });
  
  try {
    // 创建表单数据
    const formData = new FormData();
    formData.append('audio', { 
      uri: filePath,
      type: 'audio/mp3',
      name: 'voice.mp3'
    });
    formData.append('language', 'zh-CN');
    
    // 调用语音识别API
    const response = await axios.post(API_CONFIG.SPEECH_RECOGNITION_API, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`
      }
    });
    
    uni.hideLoading();
    
    if (response.data && response.data.text) {
      const recognizedText = response.data.text.trim();
      console.log('识别结果:', recognizedText);
      
      if (recognizedText) {
        // 填充到输入框
        inputMessage.value = recognizedText;
        
        // 延迟发送，使体验更加真实
        setTimeout(() => {
          sendMessage();
        }, 300);
      } else {
        uni.showToast({
          title: '未能识别语音内容',
          icon: 'none'
        });
      }
    } else {
      uni.showToast({
        title: '语音识别失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('语音识别请求失败:', error);
    uni.showToast({
      title: '语音识别失败',
      icon: 'none'
    });
  }
};

// 文字转语音（调用API）
const speakText = async (text) => {
  if (!text) return;
  console.log('播放语音:', text);
  
  try {
    // 请求TTS API
    const response = await axios.post(API_CONFIG.TEXT_TO_SPEECH_API, {
      text: text,
      voice: 'zh-CN-XiaoxiaoNeural', // 可以指定语音
      speed: 1.0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.API_KEY}`
      },
      responseType: 'blob' // 接收二进制数据
    });
    
    // 创建临时文件
    const blob = new Blob([response.data], { type: 'audio/mp3' });
    const tempFilePath = URL.createObjectURL(blob);
    
    // 使用音频播放器播放
    if (audioPlayer) {
      audioPlayer.src = tempFilePath;
      audioPlayer.play();
    } else {
      // 备用方案：使用HTML5 Audio
      const audio = new Audio(tempFilePath);
      audio.play();
    }
  } catch (error) {
    console.error('文字转语音失败:', error);
    uni.showToast({
      title: '语音播放失败',
      icon: 'none'
    });
  }
};

// 激活助手（被唤醒后）
const activateAssistant = () => {
  isWakeupActive.value = true;
  
  // 播放提示音或语音提示
  speakText('我在，请说');
  
  // 短暂延迟后开始指令识别
  setTimeout(() => {
    startListening();
  }, 1000);
};

// 切换唤醒模式
const toggleWakeupMode = () => {
  isWakeupMode.value = !isWakeupMode.value;
  
  if (isWakeupMode.value) {
    uni.showToast({
      title: '唤醒模式已开启，请说"小源小源"',
      icon: 'none',
      duration: 2000
    });
    console.log('唤醒模式已开启，等待唤醒词"小源小源"');
  } else {
    uni.showToast({
      title: '唤醒模式已关闭',
      icon: 'none',
      duration: 1500
    });
    isWakeupActive.value = false;
    console.log('唤醒模式已关闭');
  }
};

// 格式化时间为HH:MM:SS
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    // 如果已经是时间字符串，直接截取时分秒部分
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2].substring(0, 2)}`;
      }
      return timeString;
    }
    
    // 如果是日期对象或时间戳
    const date = new Date(timeString);
    return date.toTimeString().substring(0, 8); // HH:MM:SS
  } catch (e) {
    return timeString; // 出错时返回原始值
  }
};

// 发送消息到API
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isListening.value) return;
  
  try {
    // 显示打字动画
    isTyping.value = true;
    
    // 使用store的action发送消息，这应该会处理与你的API的通信
    await store.dispatch('sendAIMessage', inputMessage.value);
    
    // 获取最新的回复消息
    const latestMessages = store.state.chatMessages;
    const assistantMessage = latestMessages[latestMessages.length - 1];
    
    // 如果是助手回复，将其转换为语音
    if (assistantMessage && assistantMessage.role === 'assistant') {
      speakText(assistantMessage.content);
    }
    
    inputMessage.value = '';
    
    // 延迟一点时间后关闭打字动画，让体验更真实
    setTimeout(() => {
      isTyping.value = false;
      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    }, 500);
    
    // 如果在唤醒状态，完成一次对话后回到监听唤醒模式
    if (isWakeupActive.value) {
      isWakeupActive.value = false;
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    isTyping.value = false;
    uni.showToast({
      title: '发送消息失败',
      icon: 'none'
    });
  }
};

// 开始语音识别
const startListening = () => {
  if (!audioRecorder) {
    console.warn('录音功能不可用');
    uni.showToast({
      title: '录音功能不可用',
      icon: 'none'
    });
    return;
  }
  
  isListening.value = true;
  
  // 防止长时间识别
  recognitionTimer = setTimeout(() => {
    stopListening();
  }, 10000); // 最多10秒
  
  try {
    // 配置录音参数
    audioRecorder.start({
      duration: 10000, // 最长录音时间，单位ms
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 48000, // 编码码率
      format: 'mp3', // 音频格式
      frameSize: 50 // 指定帧大小
    });
    console.log('开始录音');
  } catch (error) {
    console.error('启动录音失败:', error);
    isListening.value = false;
    uni.showToast({
      title: '启动录音失败',
      icon: 'none'
    });
  }
};

// 停止语音识别
const stopListening = () => {
  if (recognitionTimer) {
    clearTimeout(recognitionTimer);
    recognitionTimer = null;
  }
  
  if (!isListening.value) return;
  
  try {
    if (audioRecorder) {
      audioRecorder.stop();
      console.log('停止录音');
    }
  } catch (error) {
    console.error('停止录音失败:', error);
    uni.showToast({
      title: '停止录音失败',
      icon: 'none'
    });
  }
  
  isListening.value = false;
};

// 滚动到底部
const scrollToBottom = () => {
  // 由于scroll-view的特性，设置一个很大的值来确保滚动到底部
  scrollTop.value = 999999;
  
  // 使用setTimeout确保滚动在DOM更新后执行
  setTimeout(() => {
    scrollTop.value = 999999;
  }, 100);
};

// 加载更多消息（向上滚动触发）
const loadMoreMessages = () => {
  // 实际应用中这里可以加载历史消息
  console.log('加载更多消息');
};

// 监听消息变化，自动滚动到底部
watch(chatMessages, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

// 组件加载完成后初始化
onMounted(() => {
  // 初始化语音服务
  initSpeechServices();
  
  // 如果有消息，滚动到底部
  if (chatMessages.value.length > 0) {
    nextTick(() => {
      scrollToBottom();
    });
  }
});

// 组件卸载前清理资源
onBeforeUnmount(() => {
  // 清理所有定时器
  if (recognitionTimer) {
    clearTimeout(recognitionTimer);
    recognitionTimer = null;
  }
  
  if (wakeupRestartTimer) {
    clearTimeout(wakeupRestartTimer);
    wakeupRestartTimer = null;
  }
  
  // 停止录音
  if (audioRecorder) {
    try { 
      audioRecorder.stop(); 
    } catch (e) {}
  }
  
  // 停止语音播放
  if (audioPlayer) {
    audioPlayer.stop();
  }
});
</script>

<style scoped>
.voice-assistant {
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
  flex-shrink: 0;
}

.panel-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #0cf;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
}

.assistant-status {
  display: flex;
  align-items: center;
  background-color: rgba(50, 50, 50, 0.3);
  padding: 6rpx 15rpx;
  border-radius: 20rpx;
  transition: all 0.3s;
}

.assistant-status.active {
  background-color: rgba(0, 200, 100, 0.2);
}

.assistant-status.wakeup {
  background-color: rgba(200, 150, 0, 0.2);
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #666;
  margin-right: 10rpx;
  transition: all 0.3s;
}

.assistant-status.active .status-dot {
  background-color: #0f0;
  box-shadow: 0 0 10rpx rgba(0, 255, 0, 0.7);
  animation: pulse 1.5s infinite;
}

.assistant-status.wakeup .status-dot {
  background-color: #ff0;
  box-shadow: 0 0 10rpx rgba(255, 255, 0, 0.7);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.status-text {
  font-size: 24rpx;
  color: #8ab4fe;
}

/* 聊天容器居中 */
.chat-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20rpx;
  overflow: hidden; /* 防止溢出 */
}

.chat-messages {
  width: 90%;
  height: 100%;
  border-radius: 15rpx;
  background-color: rgba(10, 20, 40, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.1);
  box-sizing: border-box;
}

.scroll-content {
  width: 100%;
  min-height: 100%;
  padding: 15rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  padding: 10rpx;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 40rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
  background-color: rgba(0, 100, 200, 0.1);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon::before {
  content: "";
  width: 60rpx;
  height: 60rpx;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%2300a8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.empty-text {
  font-size: 30rpx;
  margin-bottom: 30rpx;
  color: rgba(255, 255, 255, 0.7);
}

.examples {
  width: 100%;
  padding: 20rpx;
  background-color: rgba(0, 30, 60, 0.3);
  border-radius: 15rpx;
  text-align: left;
}

.example-title {
  font-size: 26rpx;
  color: #0cf;
  margin-bottom: 15rpx;
  display: block;
}

.example-item {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.example-bullet {
  width: 8rpx;
  height: 8rpx;
  background-color: #0cf;
  border-radius: 50%;
  margin-right: 10rpx;
}

.example-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.message-item {
  display: flex;
  margin-bottom: 25rpx;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 15rpx;
  background-color: rgba(0, 30, 60, 0.3);
  margin: 0 15rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid rgba(0, 150, 255, 0.2);
}

.avatar-icon {
  width: 40rpx;
  height: 40rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.message-avatar.user .avatar-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%2300a8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>');
}

.message-avatar.assistant .avatar-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%2300ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>');
}

.message-avatar.system .avatar-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%23ffaa00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>');
}

.message-content {
  max-width: 70%;
  overflow: hidden; /* 防止溢出 */
}

.message-bubble {
  padding: 15rpx 20rpx;
  border-radius: 15rpx;
  margin-bottom: 8rpx;
  position: relative;
  word-break: break-word; /* 允许单词内换行 */
  word-wrap: break-word; /* 兼容性更好的换行 */
  overflow-wrap: break-word; /* 现代浏览器的换行 */
  line-height: 1.4;
  font-size: 28rpx;
  display: inline-block; /* 使气泡宽度自适应内容 */
  max-width: 100%; /* 确保不超出父容器 */
}

.user .message-bubble {
  background-color: rgba(0, 100, 200, 0.7);
  color: white;
  border-top-right-radius: 0;
  float: right; /* 右对齐 */
}

.assistant .message-bubble {
  background-color: rgba(0, 50, 100, 0.5);
  color: white;
  border-top-left-radius: 0;
  float: left; /* 左对齐 */
}

.system .message-bubble {
  background-color: rgba(100, 50, 0, 0.5);
  color: white;
  border-radius: 15rpx;
  font-style: italic;
}

.message-time {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  clear: both; /* 清除浮动，确保时间戳正确显示 */
}

.user .message-time {
  text-align: right;
}

.assistant .message-time {
  text-align: left;
}

/* 打字指示器 */
.typing-indicator {
  display: inline-flex; /* 内联显示，宽度自适应内容 */
  align-items: center;
  padding: 15rpx 25rpx;
  background-color: rgba(0, 50, 100, 0.3);
  border-radius: 15rpx;
  margin-left: 95rpx;
  margin-bottom: 20rpx;
  align-self: flex-start; /* 确保不占满整行 */
}

.typing-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  margin: 0 5rpx;
  animation: typingAnimation 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingAnimation {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6rpx);
    opacity: 1;
  }
}

.chat-input-container {
  display: flex;
  align-items: center;
  background-color: rgba(0, 30, 60, 0.3);
  border-radius: 15rpx;
  padding: 10rpx 15rpx;
  border: 1px solid rgba(0, 150, 255, 0.2);
  flex-shrink: 0; /* 防止压缩 */
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(0, 20, 40, 0.3);
  border-radius: 10rpx;
  overflow: hidden;
}

.text-input {
  width: 100%;
  height: 70rpx;
  background: none;
  border: none;
  color: white;
  font-size: 28rpx;
  padding: 0 20rpx;
}

.voice-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #0066cc, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 15rpx;
  position: relative;
  box-shadow: 0 0 10rpx rgba(0, 100, 200, 0.3);
  flex-shrink: 0; /* 不缩小 */
}

.voice-btn.listening {
  background: linear-gradient(135deg, #00cc66, #00ff99);
  animation: pulse 1.5s infinite;
}

.voice-btn.wakeup {
  background: linear-gradient(135deg, #cc9900, #ffcc00);
}

.voice-icon {
  width: 30rpx;
  height: 30rpx;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.voice-waves {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave {
  position: absolute;
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  animation: wave-animation 2s infinite;
}

.wave:nth-child(1) {
  animation-delay: 0s;
}

.wave:nth-child(2) {
  animation-delay: 0.5s;
}

.wave:nth-child(3) {
  animation-delay: 1s;
}

@keyframes wave-animation {
  0% {
    width: 40rpx;
    height: 40rpx;
    opacity: 0.8;
  }
  100% {
    width: 120rpx;
    height: 120rpx;
    opacity: 0;
  }
}

.send-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 15rpx;
  background: linear-gradient(to right, #0066cc, #0099ff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  flex-shrink: 0; /* 不缩小 */
}

.send-btn:disabled {
  background: #444;
  opacity: 0.5;
}

.send-icon {
  width: 30rpx;
  height: 30rpx;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>