<template>
  <view class="plant-rules">
    <view class="panel-header">
      <text class="panel-title">种植物规则</text>
      <button class="add-rule-btn" @click="showAddForm = true">
        <view class="btn-icon-plus"></view>
        <text>添加</text>
      </button>
    </view>
    
    <scroll-view scroll-y class="rules-list">
      <view 
        v-for="rule in allRules" 
        :key="rule.id" 
        class="rule-item"
        :class="{ 'active': rule.plants === currentRule }"
        @click="selectRule(rule.plants)"
      >
        <view class="rule-header">
          <view class="rule-name-area">
            <text class="rule-name">{{ rule.plants }}</text>
            <view class="rule-badge" v-if="rule.plants === currentRule">当前</view>
          </view>
          <view class="rule-select" v-if="rule.plants !== currentRule">选择</view>
        </view>
        
        <view class="rule-grid">
          <view class="rule-param">
            <view class="param-icon humidity"></view>
            <view class="param-info">
              <text class="param-label">湿度范围</text>
              <text class="param-value">{{ rule.min_soil_humidity }}% - {{ rule.max_soil_humidity }}%</text>
            </view>
          </view>
          
          <view class="rule-param">
            <view class="param-icon time"></view>
            <view class="param-info">
              <text class="param-label">运行时间</text>
              <text class="param-value">{{ rule.start_time }} - {{ rule.end_time }}</text>
            </view>
          </view>
          
          <view class="rule-param">
            <view class="param-icon nitrogen"></view>
            <view class="param-info">
              <text class="param-label">氮含量</text>
              <text class="param-value">{{ rule.min_nitrogen }} - {{ rule.max_nitrogen }}</text>
            </view>
          </view>
          
          <view class="rule-param">
            <view class="param-icon phosphorus"></view>
            <view class="param-info">
              <text class="param-label">磷含量</text>
              <text class="param-value">{{ rule.min_phosphorus }} - {{ rule.max_phosphorus }}</text>
            </view>
          </view>
          
          <view class="rule-param">
            <view class="param-icon potassium"></view>
            <view class="param-info">
              <text class="param-label">钾含量</text>
              <text class="param-value">{{ rule.min_potassium }} - {{ rule.max_potassium }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="no-rules" v-if="allRules.length === 0">
        <view class="empty-icon"></view>
        <text class="empty-text">暂无植物规则</text>
        <text class="empty-subtext">点击右上角添加规则按钮创建新规则</text>
      </view>
    </scroll-view>
    
    <!-- 添加规则弹窗 -->
    <view class="modal-overlay" v-if="showAddForm" @click="showAddForm = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加新规则</text>
          <view class="modal-close" @click="showAddForm = false">✕</view>
        </view>
        
        <scroll-view scroll-y class="modal-body">
          <view class="form-group">
            <text class="form-label required">种植物名称</text>
            <input class="form-input" v-model="newRule.plants" placeholder="请输入种植物名称" />
          </view>
          
          <view class="form-section">
            <text class="section-title">湿度设置</text>
            <view class="form-row">
              <view class="form-group half">
                <text class="form-label required">最低湿度(%)</text>
                <input class="form-input" type="digit" v-model="newRule.min_soil_humidity" placeholder="60" />
              </view>
              <view class="form-group half">
                <text class="form-label required">最高湿度(%)</text>
                <input class="form-input" type="digit" v-model="newRule.max_soil_humidity" placeholder="80" />
              </view>
            </view>
          </view>
          
          <view class="form-section">
            <text class="section-title">养分含量设置</text>
            <view class="form-row">
              <view class="form-group half">
                <text class="form-label required">最低氮含量</text>
                <input class="form-input" type="digit" v-model="newRule.min_nitrogen" placeholder="1000" />
              </view>
              <view class="form-group half">
                <text class="form-label required">最高氮含量</text>
                <input class="form-input" type="digit" v-model="newRule.max_nitrogen" placeholder="2000" />
              </view>
            </view>
            
            <view class="form-row">
              <view class="form-group half">
                <text class="form-label required">最低磷含量</text>
                <input class="form-input" type="digit" v-model="newRule.min_phosphorus" placeholder="500" />
              </view>
              <view class="form-group half">
                <text class="form-label required">最高磷含量</text>
                <input class="form-input" type="digit" v-model="newRule.max_phosphorus" placeholder="1000" />
              </view>
            </view>
            
            <view class="form-row">
              <view class="form-group half">
                <text class="form-label required">最低钾含量</text>
                <input class="form-input" type="digit" v-model="newRule.min_potassium" placeholder="800" />
              </view>
              <view class="form-group half">
                <text class="form-label required">最高钾含量</text>
                <input class="form-input" type="digit" v-model="newRule.max_potassium" placeholder="1500" />
              </view>
            </view>
          </view>
          
          <view class="form-section">
            <text class="section-title">运行时间设置</text>
            <view class="form-row">
              <view class="form-group half">
                <text class="form-label required">开始时间</text>
                <input class="form-input" v-model="newRule.start_time" placeholder="8:30" />
              </view>
              <view class="form-group half">
                <text class="form-label required">结束时间</text>
                <input class="form-input" v-model="newRule.end_time" placeholder="17:30" />
              </view>
            </view>
          </view>
        </scroll-view>
        
        <view class="modal-footer">
          <button class="form-btn cancel" @click="showAddForm = false">取消</button>
          <button class="form-btn submit" @click="addRule">添加规则</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// 获取当前规则和所有规则
const currentRule = computed(() => store.state.currentRule);
const allRules = computed(() => store.state.allRules);
// 检查当前模式
const isAutoMode = computed(() => store.getters.isAutoMode);

// 是否显示添加规则表单
const showAddForm = ref(false);

// 新规则数据
const newRule = reactive({
  plants: '',
  min_soil_humidity: '',
  max_soil_humidity: '',
  min_nitrogen: '',
  max_nitrogen: '',
  min_phosphorus: '',
  max_phosphorus: '',
  min_potassium: '',
  max_potassium: '',
  start_time: '',
  end_time: ''
});

// 选择规则
const selectRule = async (ruleName) => {
  if (ruleName === currentRule.value) return; // 已经是当前规则，不重复切换
  
  // 在手动模式下不允许切换规则
  if (!isAutoMode.value) {
    uni.showToast({
      title: '请先切换到自动模式',
      icon: 'none'
    });
    return;
  }
  
  try {
    await store.dispatch('setRule', ruleName);
  } catch (error) {
    console.error('设置规则失败:', error);
  }
};

// 添加规则
const addRule = async () => {
  // 验证表单
  const requiredFields = [
    'plants', 'min_soil_humidity', 'max_soil_humidity', 
    'min_nitrogen', 'max_nitrogen', 'min_phosphorus', 
    'max_phosphorus', 'min_potassium', 'max_potassium',
    'start_time', 'end_time'
  ];
  
  for (const field of requiredFields) {
    if (!newRule[field]) {
      uni.showToast({
        title: '请填写所有必填项',
        icon: 'none'
      });
      return;
    }
  }
  
  // 转换为数字类型
  const ruleData = {
    ...newRule,
    min_soil_humidity: Number(newRule.min_soil_humidity),
    max_soil_humidity: Number(newRule.max_soil_humidity),
    min_nitrogen: Number(newRule.min_nitrogen),
    max_nitrogen: Number(newRule.max_nitrogen),
    min_phosphorus: Number(newRule.min_phosphorus),
    max_phosphorus: Number(newRule.max_phosphorus),
    min_potassium: Number(newRule.min_potassium),
    max_potassium: Number(newRule.max_potassium),
  };
  
  try {
    const response = await store.dispatch('addRule', ruleData);
    if (response.code === 0) {
      // 重置表单
      Object.keys(newRule).forEach(key => {
        newRule[key] = '';
      });
      showAddForm.value = false;
      
      uni.showToast({
        title: '规则添加成功',
        icon: 'success'
      });
    }
  } catch (error) {
    console.error('添加规则失败:', error);
  }
};

// 监听模式变化
watch(isAutoMode, (newValue) => {
  if (!newValue) {
    // 当切换到手动模式时，提示用户
    uni.showToast({
      title: '手动模式下无法选择植物规则',
      icon: 'none',
      duration: 2000
    });
  }
});
</script>

<style scoped>
.plant-rules {
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
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
}

.panel-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #0cf;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
}

.add-rule-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #005ebb, #0099ff);
  color: white;
  min-width: 40rpx;
  max-width: 120rpx;
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  border: none;
  box-shadow: 0 3rpx 10rpx rgba(0, 100, 255, 0.3);
  height: 50rpx;
}

.btn-icon-plus {
  position: relative;
  width: 20rpx;
  height: 20rpx;
  margin-right: 6rpx;
}

.btn-icon-plus::before,
.btn-icon-plus::after {
  content: "";
  position: absolute;
  background-color: white;
}

.btn-icon-plus::before {
  width: 20rpx;
  height: 2rpx;
  top: 9rpx;
  left: 0;
}

.btn-icon-plus::after {
  width: 2rpx;
  height: 20rpx;
  top: 0;
  left: 9rpx;
}

.rules-list {
  flex: 1;
  overflow-y: auto;
}

.rule-item {
  background-color: rgba(0, 30, 60, 0.3);
  border-radius: 15rpx;
  margin-bottom: 20rpx;
  padding: 25rpx;
  border: 1px solid rgba(0, 150, 255, 0.1);
  transition: all 0.3s;
  position: relative;
}

.rule-item.active {
  border-color: rgba(0, 200, 255, 0.5);
  background-color: rgba(0, 60, 120, 0.3);
  box-shadow: 0 0 15rpx rgba(0, 150, 255, 0.3);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1px solid rgba(0, 150, 255, 0.1);
}

.rule-name-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.rule-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-right: 15rpx;
  margin-bottom: 6rpx;
}

.rule-badge {
  font-size: 22rpx;
  color: #fff;
  background-color: rgba(0, 200, 100, 0.7);
  padding: 2rpx 15rpx;
  border-radius: 10rpx;
}

.rule-select {
  font-size: 24rpx;
  color: #0cf;
  background-color: rgba(0, 150, 255, 0.1);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  border: 1px solid rgba(0, 150, 255, 0.3);
  white-space: nowrap;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220rpx, 1fr));
  gap: 16rpx;
}

.rule-param {
  display: flex;
  align-items: center;
}

.param-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 150, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.param-icon.humidity::before {
  content: "💧";
  font-size: 20rpx;
}

.param-icon.time::before {
  content: "⏱️";
  font-size: 20rpx;
}

.param-icon.nitrogen::before {
  content: "N";
  font-size: 20rpx;
  font-weight: bold;
  color: #0cf;
}

.param-icon.phosphorus::before {
  content: "P";
  font-size: 20rpx;
  font-weight: bold;
  color: #0cf;
}

.param-icon.potassium::before {
  content: "K";
  font-size: 20rpx;
  font-weight: bold;
  color: #0cf;
}

.param-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.param-label {
  font-size: 24rpx;
  color: #8ab4fe;
  margin-bottom: 4rpx;
  white-space: nowrap;
}

.param-value {
  font-size: 24rpx;
  color: #fff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.no-rules {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
  background-color: rgba(0, 100, 200, 0.1);
  border-radius: 50%;
  position: relative;
}

.empty-icon::before {
  content: "📋";
  font-size: 60rpx;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-text {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15rpx;
}

.empty-subtext {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a2a4a 0%, #0a1525 100%);
  border-radius: 20rpx;
  width: 650rpx; /* 降低宽度，避免内容溢出 */
  max-height: 80vh; 
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30rpx rgba(0, 150, 255, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.3);
  animation: modalFadeIn 0.3s ease-out;
  overflow: hidden; /* 确保内容不溢出 */
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 20rpx 25rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 150, 255, 0.2);
  flex-shrink: 0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #0cf;
  text-shadow: 0 0 10rpx rgba(0, 200, 255, 0.3);
}

.modal-close {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: rgba(0, 30, 60, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.modal-close:hover {
  background-color: rgba(0, 60, 120, 0.3);
}

.modal-body {
  padding: 20rpx;
  max-height: calc(80vh - 160rpx); /* 调整高度，确保有足够空间 */
  overflow-y: auto;
  flex: 1;
  box-sizing: border-box;
}

.modal-footer {
  padding: 15rpx 20rpx;
  display: flex;
  justify-content: flex-end;
  gap: 15rpx;
  border-top: 1px solid rgba(0, 150, 255, 0.2);
  flex-shrink: 0;
}

.form-section {
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1px solid rgba(0, 150, 255, 0.1);
}

.section-title {
  font-size: 28rpx;
  color: #0cf;
  margin-bottom: 15rpx;
  display: block;
}

.form-row {
  display: flex;
  gap: 10rpx; /* 减少间距 */
  margin-bottom: 10rpx;
  flex-wrap: wrap; /* 确保在窄屏上可以换行 */
}

.form-group {
  margin-bottom: 10rpx;
  width: 100%; /* 默认宽度设为100% */
  box-sizing: border-box; /* 确保padding和border计入宽度 */
}

.form-group.half {
  flex: 1;
  min-width: 0; /* 允许缩小到任意宽度 */
  max-width: calc(50% - 5rpx); /* 确保不会超过一半宽度减去间距 */
}

.form-label {
  font-size: 22rpx; /* 减小字体大小 */
  color: #8ab4fe;
  margin-bottom: 6rpx;
  display: block;
  white-space: nowrap; /* 防止标签换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-label.required::after {
  content: " *";
  color: #ff5252;
}

.form-input {
  width: 100%;
  height: 60rpx;
  background-color: rgba(0, 30, 60, 0.3);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 8rpx;
  padding: 0 12rpx;
  color: #fff;
  font-size: 24rpx;
  box-sizing: border-box;
  overflow: hidden; /* 确保内容不溢出 */
  white-space: nowrap; /* 防止文本换行 */
  text-overflow: ellipsis; /* 溢出时显示省略号 */
}

.form-input:focus {
  border-color: rgba(0, 200, 255, 0.5);
}

.form-btn {
  padding: 12rpx 30rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  border: none;
}

.form-btn.cancel {
  background-color: #444;
  color: #fff;
}

.form-btn.submit {
  background: linear-gradient(to right, #0066cc, #0099ff);
  color: white;
  box-shadow: 0 3rpx 10rpx rgba(0, 100, 255, 0.3);
}
</style>