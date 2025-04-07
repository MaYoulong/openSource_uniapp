// store/index.js - 全局状态管理
import { createStore } from 'vuex';
import api from '../api/index.js';

const store = createStore({
  state: {
    // 设备状态
    devices: {
      pump: 'off',       // 水泵状态
      nitrogen: 'off',   // 氮肥状态
      phosphorus: 'off', // 磷肥状态
      potassium: 'off',  // 钾肥状态
    },
    // 当前模式（自动/手动）
    currentMode: 'manual',
    // 当前使用的植物规则
    currentRule: '',
    // 所有植物规则列表
    allRules: [],
    // 加载状态
    loading: false,
    // 语音助手对话历史
    chatMessages: [],
    // 接口请求状态
    requestStatus: {
      success: false,
      message: ''
    }
  },
  
  mutations: {
    // 更新设备状态
    updateDeviceStatus(state, { device, status }) {
      state.devices[device] = status;
    },
    // 更新当前模式
    updateCurrentMode(state, mode) {
      state.currentMode = mode;
    },
    // 更新当前植物规则
    updateCurrentRule(state, rule) {
      state.currentRule = rule;
    },
    // 更新所有植物规则
    updateAllRules(state, rules) {
      state.allRules = rules;
    },
    // 设置加载状态
    setLoading(state, status) {
      state.loading = status;
    },
    // 添加聊天消息
    addChatMessage(state, { role, content }) {
      state.chatMessages.push({ role, content, time: new Date().toLocaleTimeString() });
    },
    // 更新请求状态
    updateRequestStatus(state, { success, message }) {
      state.requestStatus = { success, message };
      // 3秒后重置状态消息
      setTimeout(() => {
        state.requestStatus = { success: false, message: '' };
      }, 3000);
    }
  },
  
  actions: {
    // 初始化应用数据
    async initApp({ dispatch }) {
      await dispatch('fetchCurrentMode');
      await dispatch('fetchAllDevicesStatus');
      await dispatch('fetchCurrentRule');
      await dispatch('fetchAllRules');
    },
    
    // 获取所有设备状态 (新增静默参数)
    async fetchAllDevicesStatus({ commit }, silent = false) {
      if (!silent) {
        commit('setLoading', true);
      }
      
      try {
        const deviceTypes = ['pump', 'nitrogen', 'phosphorus', 'potassium'];
        for (const device of deviceTypes) {
          const response = await api.getDeviceStatus(device);
          if (response.code === 0) {
            commit('updateDeviceStatus', { device, status: response.data.status });
          }
        }
      } catch (error) {
        console.error('获取设备状态失败', error);
        if (!silent) {
          commit('updateRequestStatus', { success: false, message: '获取设备状态失败' });
        }
      } finally {
        if (!silent) {
          commit('setLoading', false);
        }
      }
    },
    
    // 获取指定设备状态 (新增静默参数)
    async fetchDeviceStatus({ commit }, { device, silent = false }) {
      if (!silent) {
        commit('setLoading', true);
      }
      
      try {
        const response = await api.getDeviceStatus(device);
        if (response.code === 0) {
          commit('updateDeviceStatus', { device, status: response.data.status });
        }
        return response;
      } catch (error) {
        console.error(`获取${device}状态失败`, error);
        if (!silent) {
          commit('updateRequestStatus', { success: false, message: `获取${device}状态失败` });
        }
        throw error;
      } finally {
        if (!silent) {
          commit('setLoading', false);
        }
      }
    },
    
    // 设置设备状态
    async setDeviceStatus({ commit, state }, { device, status }) {
      // 自动模式下不能手动控制设备
      if (state.currentMode === 'auto') {
        commit('updateRequestStatus', { success: false, message: '自动模式下无法手动控制设备' });
        return;
      }
      
      commit('setLoading', true);
      try {
        // 确保传递device和status参数
        const response = await api.setDeviceStatus(device, status);
        if (response.code === 0) {
          // 根据返回值判断是否成功
          let success = false;
          let message = '';
          
          if (status === 'on' && (response.data.set_on === 1 || response.data.set_on === 2)) {
            success = true;
            message = response.data.set_on === 2 ? '设备已处于开启状态' : '设备开启成功';
            commit('updateDeviceStatus', { device, status: 'on' });
          } else if (status === 'off' && (response.data.set_off === 1 || response.data.set_off === 2)) {
            success = true;
            message = response.data.set_off === 2 ? '设备已处于关闭状态' : '设备关闭成功';
            commit('updateDeviceStatus', { device, status: 'off' });
          } else {
            message = '设置失败';
          }
          
          commit('updateRequestStatus', { success, message });
        } else {
          commit('updateRequestStatus', { success: false, message: response.message || '设置失败' });
        }
        return response;
      } catch (error) {
        console.error(`设置${device}状态失败`, error);
        commit('updateRequestStatus', { success: false, message: `设置${device}状态失败` });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 获取当前模式 (新增静默参数)
    async fetchCurrentMode({ commit }, silent = false) {
      if (!silent) {
        commit('setLoading', true);
      }
      
      try {
        const response = await api.getCurrentMode();
        if (response.code === 0) {
          commit('updateCurrentMode', response.data.mod);
        }
        return response;
      } catch (error) {
        console.error('获取当前模式失败', error);
        if (!silent) {
          commit('updateRequestStatus', { success: false, message: '获取当前模式失败' });
        }
        throw error;
      } finally {
        if (!silent) {
          commit('setLoading', false);
        }
      }
    },
    
    // 设置当前模式
    async setMode({ commit }, mode) {
      commit('setLoading', true);
      try {
        // 确保传递mod参数
        const response = await api.setMode(mode);
        if (response.code === 0) {
          let success = false;
          let message = '';
          
          if (response.data.setMod === 1 || response.data.setMod === 2) {
            success = true;
            message = response.data.setMod === 2 ? `已处于${mode === 'auto' ? '自动' : '手动'}模式` : `切换到${mode === 'auto' ? '自动' : '手动'}模式成功`;
            commit('updateCurrentMode', mode);
          } else {
            message = '模式设置失败';
          }
          
          commit('updateRequestStatus', { success, message });
        } else {
          commit('updateRequestStatus', { success: false, message: response.message || '模式设置失败' });
        }
        return response;
      } catch (error) {
        console.error('设置模式失败', error);
        commit('updateRequestStatus', { success: false, message: '设置模式失败' });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 获取当前植物规则 (新增静默参数)
    async fetchCurrentRule({ commit }, silent = false) {
      if (!silent) {
        commit('setLoading', true);
      }
      
      try {
        const response = await api.getCurrentRule();
        if (response.code === 0) {
          commit('updateCurrentRule', response.data.rules);
        }
        return response;
      } catch (error) {
        console.error('获取当前规则失败', error);
        if (!silent) {
          commit('updateRequestStatus', { success: false, message: '获取当前规则失败' });
        }
        throw error;
      } finally {
        if (!silent) {
          commit('setLoading', false);
        }
      }
    },
    
    // 设置植物规则
    async setRule({ commit }, rule) {
      commit('setLoading', true);
      try {
        // 确保传递rules参数
        const response = await api.setRule(rule);
        if (response.code === 0) {
          let success = false;
          let message = '';
          
          if (response.data.setRules === 1 || response.data.setRules === 2) {
            success = true;
            message = response.data.setRules === 2 ? `已使用"${rule}"规则` : `切换到"${rule}"规则成功`;
            commit('updateCurrentRule', rule);
          } else {
            message = '规则设置失败';
          }
          
          commit('updateRequestStatus', { success, message });
        } else {
          commit('updateRequestStatus', { success: false, message: response.message || '规则设置失败' });
        }
        return response;
      } catch (error) {
        console.error('设置规则失败', error);
        commit('updateRequestStatus', { success: false, message: '设置规则失败' });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 获取所有植物规则 (新增静默参数)
    async fetchAllRules({ commit }, silent = false) {
      if (!silent) {
        commit('setLoading', true);
      }
      
      try {
        const response = await api.getAllRules();
        if (response.code === 0) {
          commit('updateAllRules', response.data);
        }
        return response;
      } catch (error) {
        console.error('获取所有规则失败', error);
        if (!silent) {
          commit('updateRequestStatus', { success: false, message: '获取所有规则失败' });
        }
        throw error;
      } finally {
        if (!silent) {
          commit('setLoading', false);
        }
      }
    },
    
    // 添加新植物规则
    async addRule({ commit, dispatch }, ruleData) {
      commit('setLoading', true);
      try {
        // 直接传递表单数据，不使用JSON
        const response = await api.addRule(ruleData);
        if (response.code === 0) {
          commit('updateRequestStatus', { success: true, message: '添加规则成功' });
          // 刷新规则列表
          await dispatch('fetchAllRules');
        } else {
          let message = '添加规则失败';
          if (response.code === 2) {
            message = '该植物规则已存在';
          } else if (response.code === 3) {
            message = '起始时间不能大于结束时间';
          }
          commit('updateRequestStatus', { success: false, message });
        }
        return response;
      } catch (error) {
        console.error('添加规则失败', error);
        commit('updateRequestStatus', { success: false, message: '添加规则失败' });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    },
    
    // 发送AI消息
    async sendAIMessage({ commit }, message) {
      // 添加用户消息到对话历史
      commit('addChatMessage', { role: 'user', content: message });
      
      commit('setLoading', true);
      try {
        // 确保传递msg参数
        const response = await api.sendMessage(message);
        if (response.code === 0) {
          // 添加AI回复到对话历史
          commit('addChatMessage', { role: 'assistant', content: response.data.content });
          
          // 检查是否包含控制指令
          try {
            // 尝试解析JSON指令
            const jsonContent = response.data.content;
            const functionData = JSON.parse(jsonContent);
            
            if (functionData.function_name === 'set_device_status') {
              const { device, status } = functionData.parameters;
              
              // 如果是批量操作多个设备
              if (Array.isArray(device)) {
                commit('addChatMessage', { 
                  role: 'system', 
                  content: `正在执行批量${status === 'on' ? '开启' : '关闭'}设备操作...` 
                });
              } else {
                commit('addChatMessage', { 
                  role: 'system', 
                  content: `正在${status === 'on' ? '开启' : '关闭'}${device}...` 
                });
              }
            }
          } catch (e) {
            // 不是JSON指令，正常文本回复
          }
        } else {
          commit('updateRequestStatus', { success: false, message: '发送消息失败' });
        }
        return response;
      } catch (error) {
        console.error('发送消息失败', error);
        commit('updateRequestStatus', { success: false, message: '发送消息失败' });
        throw error;
      } finally {
        commit('setLoading', false);
      }
    }
  },
  
  getters: {
    // 是否处于自动模式
    isAutoMode: state => state.currentMode === 'auto',
    // 获取设备状态列表
    deviceList: state => {
      return Object.entries(state.devices).map(([key, value]) => {
        const nameMap = {
          pump: '水泵',
          nitrogen: '氮肥',
          phosphorus: '磷肥',
          potassium: '钾肥'
        };
        
        return {
          id: key,
          name: nameMap[key],
          status: value
        };
      });
    }
  }
});

export default store;