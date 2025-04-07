// api/index.js - API请求封装
import { ref } from 'vue';

// 基础URL配置，可在此处统一修改IP地址
const baseURL = ref('http://139.196.53.65:10089');

// 设置基础URL
export const setBaseURL = (url) => {
  baseURL.value = url;
};

// 获取基础URL
export const getBaseURL = () => {
  return baseURL.value;
};

// 通用请求方法
const request = async (url, method = 'GET', data = {}) => {
  const requestURL = `${baseURL.value}${url}`;
  
  try {
    // 构建请求配置
    const options = {
      url: requestURL,
      method,
      timeout: 100000, // 100秒超时
    };
    
    // 根据请求方法处理数据
    if (method === 'GET') {
      options.data = data; // 对于GET请求，uniapp需要使用data而不是params
    } else {
      options.data = data; // POST请求直接传递data
      options.header = {
        'Content-Type': 'application/x-www-form-urlencoded' // 表单提交格式
      };
    }
    
    // 发送请求
    const response = await uni.request(options);
    
    // 处理响应
    if (response.statusCode === 200) {
      return response.data;
    } else {
      throw new Error(`请求失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('请求出错:', error);
    throw error;
  }
};

// API方法集合
export default {
  // 获取设备状态
  getDeviceStatus: (device) => {
    return request('/api/control/relay_status', 'GET', { device });
  },
  
  // 设置设备状态
  setDeviceStatus: (device, status) => {
    // 确保传递正确的参数
    return request('/api/control/set_relay_status', 'GET', { device, status });
  },
  
  // 获取当前植物规则
  getCurrentRule: () => {
    return request('/api/control/rules', 'GET');
  },
  
  // 设置植物规则
  setRule: (rules) => {
    // 确保传递规则参数
    return request('/api/control/set_rules', 'GET', { rules });
  },
  
  // 添加新植物规则 - 直接在请求体中传递表单数据，不使用JSON
  addRule: (ruleData) => {
    return request('/api/control/add_rules', 'POST', ruleData);
  },
  
  // 获取所有植物规则
  getAllRules: () => {
    return request('/api/control/all_plants', 'GET');
  },
  
  // 设置当前模式（自动/手动）
  setMode: (mod) => {
    // 确保传递mod参数
    return request('/api/control/set_mod', 'GET', { mod });
  },
  
  // 获取当前模式
  getCurrentMode: () => {
    return request('/api/control/mod', 'GET');
  },
  
  // AI对话
  sendMessage: (msg) => {
    return request('/api/control/send_msg', 'GET', { msg });
  }
};