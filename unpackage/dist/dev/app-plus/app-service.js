if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = { ...defaultSettings };
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        }
      };
      hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && pluginDescriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(pluginDescriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * vuex v4.1.0
   * (c) 2022 Evan You
   * @license MIT
   */
  var storeKey = "store";
  function useStore(key) {
    if (key === void 0)
      key = null;
    return vue.inject(key !== null ? key : storeKey);
  }
  function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function(key) {
      return fn(obj[key], key);
    });
  }
  function isObject$1(obj) {
    return obj !== null && typeof obj === "object";
  }
  function isPromise(val) {
    return val && typeof val.then === "function";
  }
  function assert(condition, msg) {
    if (!condition) {
      throw new Error("[vuex] " + msg);
    }
  }
  function partial(fn, arg) {
    return function() {
      return fn(arg);
    };
  }
  function genericSubscribe(fn, subs, options) {
    if (subs.indexOf(fn) < 0) {
      options && options.prepend ? subs.unshift(fn) : subs.push(fn);
    }
    return function() {
      var i = subs.indexOf(fn);
      if (i > -1) {
        subs.splice(i, 1);
      }
    };
  }
  function resetStore(store2, hot) {
    store2._actions = /* @__PURE__ */ Object.create(null);
    store2._mutations = /* @__PURE__ */ Object.create(null);
    store2._wrappedGetters = /* @__PURE__ */ Object.create(null);
    store2._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    var state = store2.state;
    installModule(store2, state, [], store2._modules.root, true);
    resetStoreState(store2, state, hot);
  }
  function resetStoreState(store2, state, hot) {
    var oldState = store2._state;
    var oldScope = store2._scope;
    store2.getters = {};
    store2._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    var wrappedGetters = store2._wrappedGetters;
    var computedObj = {};
    var computedCache = {};
    var scope = vue.effectScope(true);
    scope.run(function() {
      forEachValue(wrappedGetters, function(fn, key) {
        computedObj[key] = partial(fn, store2);
        computedCache[key] = vue.computed(function() {
          return computedObj[key]();
        });
        Object.defineProperty(store2.getters, key, {
          get: function() {
            return computedCache[key].value;
          },
          enumerable: true
          // for local getters
        });
      });
    });
    store2._state = vue.reactive({
      data: state
    });
    store2._scope = scope;
    if (store2.strict) {
      enableStrictMode(store2);
    }
    if (oldState) {
      if (hot) {
        store2._withCommit(function() {
          oldState.data = null;
        });
      }
    }
    if (oldScope) {
      oldScope.stop();
    }
  }
  function installModule(store2, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store2._modules.getNamespace(path);
    if (module.namespaced) {
      if (store2._modulesNamespaceMap[namespace] && true) {
        console.error("[vuex] duplicate namespace " + namespace + " for the namespaced module " + path.join("/"));
      }
      store2._modulesNamespaceMap[namespace] = module;
    }
    if (!isRoot && !hot) {
      var parentState = getNestedState(rootState, path.slice(0, -1));
      var moduleName = path[path.length - 1];
      store2._withCommit(function() {
        {
          if (moduleName in parentState) {
            console.warn(
              '[vuex] state field "' + moduleName + '" was overridden by a module with the same name at "' + path.join(".") + '"'
            );
          }
        }
        parentState[moduleName] = module.state;
      });
    }
    var local = module.context = makeLocalContext(store2, namespace, path);
    module.forEachMutation(function(mutation, key) {
      var namespacedType = namespace + key;
      registerMutation(store2, namespacedType, mutation, local);
    });
    module.forEachAction(function(action, key) {
      var type = action.root ? key : namespace + key;
      var handler = action.handler || action;
      registerAction(store2, type, handler, local);
    });
    module.forEachGetter(function(getter, key) {
      var namespacedType = namespace + key;
      registerGetter(store2, namespacedType, getter, local);
    });
    module.forEachChild(function(child, key) {
      installModule(store2, rootState, path.concat(key), child, hot);
    });
  }
  function makeLocalContext(store2, namespace, path) {
    var noNamespace = namespace === "";
    var local = {
      dispatch: noNamespace ? store2.dispatch : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._actions[type]) {
            console.error("[vuex] unknown local action type: " + args.type + ", global type: " + type);
            return;
          }
        }
        return store2.dispatch(type, payload);
      },
      commit: noNamespace ? store2.commit : function(_type, _payload, _options) {
        var args = unifyObjectStyle(_type, _payload, _options);
        var payload = args.payload;
        var options = args.options;
        var type = args.type;
        if (!options || !options.root) {
          type = namespace + type;
          if (!store2._mutations[type]) {
            console.error("[vuex] unknown local mutation type: " + args.type + ", global type: " + type);
            return;
          }
        }
        store2.commit(type, payload, options);
      }
    };
    Object.defineProperties(local, {
      getters: {
        get: noNamespace ? function() {
          return store2.getters;
        } : function() {
          return makeLocalGetters(store2, namespace);
        }
      },
      state: {
        get: function() {
          return getNestedState(store2.state, path);
        }
      }
    });
    return local;
  }
  function makeLocalGetters(store2, namespace) {
    if (!store2._makeLocalGettersCache[namespace]) {
      var gettersProxy = {};
      var splitPos = namespace.length;
      Object.keys(store2.getters).forEach(function(type) {
        if (type.slice(0, splitPos) !== namespace) {
          return;
        }
        var localType = type.slice(splitPos);
        Object.defineProperty(gettersProxy, localType, {
          get: function() {
            return store2.getters[type];
          },
          enumerable: true
        });
      });
      store2._makeLocalGettersCache[namespace] = gettersProxy;
    }
    return store2._makeLocalGettersCache[namespace];
  }
  function registerMutation(store2, type, handler, local) {
    var entry = store2._mutations[type] || (store2._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
      handler.call(store2, local.state, payload);
    });
  }
  function registerAction(store2, type, handler, local) {
    var entry = store2._actions[type] || (store2._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
      var res = handler.call(store2, {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store2.getters,
        rootState: store2.state
      }, payload);
      if (!isPromise(res)) {
        res = Promise.resolve(res);
      }
      if (store2._devtoolHook) {
        return res.catch(function(err) {
          store2._devtoolHook.emit("vuex:error", err);
          throw err;
        });
      } else {
        return res;
      }
    });
  }
  function registerGetter(store2, type, rawGetter, local) {
    if (store2._wrappedGetters[type]) {
      {
        console.error("[vuex] duplicate getter key: " + type);
      }
      return;
    }
    store2._wrappedGetters[type] = function wrappedGetter(store3) {
      return rawGetter(
        local.state,
        // local state
        local.getters,
        // local getters
        store3.state,
        // root state
        store3.getters
        // root getters
      );
    };
  }
  function enableStrictMode(store2) {
    vue.watch(function() {
      return store2._state.data;
    }, function() {
      {
        assert(store2._committing, "do not mutate vuex store state outside mutation handlers.");
      }
    }, { deep: true, flush: "sync" });
  }
  function getNestedState(state, path) {
    return path.reduce(function(state2, key) {
      return state2[key];
    }, state);
  }
  function unifyObjectStyle(type, payload, options) {
    if (isObject$1(type) && type.type) {
      options = payload;
      payload = type;
      type = type.type;
    }
    {
      assert(typeof type === "string", "expects string as the type, but found " + typeof type + ".");
    }
    return { type, payload, options };
  }
  var LABEL_VUEX_BINDINGS = "vuex bindings";
  var MUTATIONS_LAYER_ID = "vuex:mutations";
  var ACTIONS_LAYER_ID = "vuex:actions";
  var INSPECTOR_ID = "vuex";
  var actionId = 0;
  function addDevtools(app, store2) {
    setupDevtoolsPlugin(
      {
        id: "org.vuejs.vuex",
        app,
        label: "Vuex",
        homepage: "https://next.vuex.vuejs.org/",
        logo: "https://vuejs.org/images/icons/favicon-96x96.png",
        packageName: "vuex",
        componentStateTypes: [LABEL_VUEX_BINDINGS]
      },
      function(api2) {
        api2.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: "Vuex Mutations",
          color: COLOR_LIME_500
        });
        api2.addTimelineLayer({
          id: ACTIONS_LAYER_ID,
          label: "Vuex Actions",
          color: COLOR_LIME_500
        });
        api2.addInspector({
          id: INSPECTOR_ID,
          label: "Vuex",
          icon: "storage",
          treeFilterPlaceholder: "Filter stores..."
        });
        api2.on.getInspectorTree(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            if (payload.filter) {
              var nodes = [];
              flattenStoreForInspectorTree(nodes, store2._modules.root, payload.filter, "");
              payload.rootNodes = nodes;
            } else {
              payload.rootNodes = [
                formatStoreForInspectorTree(store2._modules.root, "")
              ];
            }
          }
        });
        api2.on.getInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            makeLocalGetters(store2, modulePath);
            payload.state = formatStoreForInspectorState(
              getStoreModule(store2._modules, modulePath),
              modulePath === "root" ? store2.getters : store2._makeLocalGettersCache,
              modulePath
            );
          }
        });
        api2.on.editInspectorState(function(payload) {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            var modulePath = payload.nodeId;
            var path = payload.path;
            if (modulePath !== "root") {
              path = modulePath.split("/").filter(Boolean).concat(path);
            }
            store2._withCommit(function() {
              payload.set(store2._state.data, path, payload.state.value);
            });
          }
        });
        store2.subscribe(function(mutation, state) {
          var data = {};
          if (mutation.payload) {
            data.payload = mutation.payload;
          }
          data.state = state;
          api2.notifyComponentUpdate();
          api2.sendInspectorTree(INSPECTOR_ID);
          api2.sendInspectorState(INSPECTOR_ID);
          api2.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: mutation.type,
              data
            }
          });
        });
        store2.subscribeAction({
          before: function(action, state) {
            var data = {};
            if (action.payload) {
              data.payload = action.payload;
            }
            action._id = actionId++;
            action._time = Date.now();
            data.state = state;
            api2.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: action._time,
                title: action.type,
                groupId: action._id,
                subtitle: "start",
                data
              }
            });
          },
          after: function(action, state) {
            var data = {};
            var duration = Date.now() - action._time;
            data.duration = {
              _custom: {
                type: "duration",
                display: duration + "ms",
                tooltip: "Action duration",
                value: duration
              }
            };
            if (action.payload) {
              data.payload = action.payload;
            }
            data.state = state;
            api2.addTimelineEvent({
              layerId: ACTIONS_LAYER_ID,
              event: {
                time: Date.now(),
                title: action.type,
                groupId: action._id,
                subtitle: "end",
                data
              }
            });
          }
        });
      }
    );
  }
  var COLOR_LIME_500 = 8702998;
  var COLOR_DARK = 6710886;
  var COLOR_WHITE = 16777215;
  var TAG_NAMESPACED = {
    label: "namespaced",
    textColor: COLOR_WHITE,
    backgroundColor: COLOR_DARK
  };
  function extractNameFromPath(path) {
    return path && path !== "root" ? path.split("/").slice(-2, -1)[0] : "Root";
  }
  function formatStoreForInspectorTree(module, path) {
    return {
      id: path || "root",
      // all modules end with a `/`, we want the last segment only
      // cart/ -> cart
      // nested/cart/ -> cart
      label: extractNameFromPath(path),
      tags: module.namespaced ? [TAG_NAMESPACED] : [],
      children: Object.keys(module._children).map(
        function(moduleName) {
          return formatStoreForInspectorTree(
            module._children[moduleName],
            path + moduleName + "/"
          );
        }
      )
    };
  }
  function flattenStoreForInspectorTree(result, module, filter, path) {
    if (path.includes(filter)) {
      result.push({
        id: path || "root",
        label: path.endsWith("/") ? path.slice(0, path.length - 1) : path || "Root",
        tags: module.namespaced ? [TAG_NAMESPACED] : []
      });
    }
    Object.keys(module._children).forEach(function(moduleName) {
      flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + "/");
    });
  }
  function formatStoreForInspectorState(module, getters, path) {
    getters = path === "root" ? getters : getters[path];
    var gettersKeys = Object.keys(getters);
    var storeState = {
      state: Object.keys(module.state).map(function(key) {
        return {
          key,
          editable: true,
          value: module.state[key]
        };
      })
    };
    if (gettersKeys.length) {
      var tree = transformPathsToObjectTree(getters);
      storeState.getters = Object.keys(tree).map(function(key) {
        return {
          key: key.endsWith("/") ? extractNameFromPath(key) : key,
          editable: false,
          value: canThrow(function() {
            return tree[key];
          })
        };
      });
    }
    return storeState;
  }
  function transformPathsToObjectTree(getters) {
    var result = {};
    Object.keys(getters).forEach(function(key) {
      var path = key.split("/");
      if (path.length > 1) {
        var target = result;
        var leafKey = path.pop();
        path.forEach(function(p) {
          if (!target[p]) {
            target[p] = {
              _custom: {
                value: {},
                display: p,
                tooltip: "Module",
                abstract: true
              }
            };
          }
          target = target[p]._custom.value;
        });
        target[leafKey] = canThrow(function() {
          return getters[key];
        });
      } else {
        result[key] = canThrow(function() {
          return getters[key];
        });
      }
    });
    return result;
  }
  function getStoreModule(moduleMap, path) {
    var names = path.split("/").filter(function(n) {
      return n;
    });
    return names.reduce(
      function(module, moduleName, i) {
        var child = module[moduleName];
        if (!child) {
          throw new Error('Missing module "' + moduleName + '" for path "' + path + '".');
        }
        return i === names.length - 1 ? child : child._children;
      },
      path === "root" ? moduleMap : moduleMap.root._children
    );
  }
  function canThrow(cb) {
    try {
      return cb();
    } catch (e) {
      return e;
    }
  }
  var Module = function Module2(rawModule, runtime) {
    this.runtime = runtime;
    this._children = /* @__PURE__ */ Object.create(null);
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  };
  var prototypeAccessors$1 = { namespaced: { configurable: true } };
  prototypeAccessors$1.namespaced.get = function() {
    return !!this._rawModule.namespaced;
  };
  Module.prototype.addChild = function addChild(key, module) {
    this._children[key] = module;
  };
  Module.prototype.removeChild = function removeChild(key) {
    delete this._children[key];
  };
  Module.prototype.getChild = function getChild(key) {
    return this._children[key];
  };
  Module.prototype.hasChild = function hasChild(key) {
    return key in this._children;
  };
  Module.prototype.update = function update2(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  };
  Module.prototype.forEachChild = function forEachChild(fn) {
    forEachValue(this._children, fn);
  };
  Module.prototype.forEachGetter = function forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  };
  Module.prototype.forEachAction = function forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  };
  Module.prototype.forEachMutation = function forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  };
  Object.defineProperties(Module.prototype, prototypeAccessors$1);
  var ModuleCollection = function ModuleCollection2(rawRootModule) {
    this.register([], rawRootModule, false);
  };
  ModuleCollection.prototype.get = function get(path) {
    return path.reduce(function(module, key) {
      return module.getChild(key);
    }, this.root);
  };
  ModuleCollection.prototype.getNamespace = function getNamespace(path) {
    var module = this.root;
    return path.reduce(function(namespace, key) {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  };
  ModuleCollection.prototype.update = function update$1(rawRootModule) {
    update([], this.root, rawRootModule);
  };
  ModuleCollection.prototype.register = function register(path, rawModule, runtime) {
    var this$1$1 = this;
    if (runtime === void 0)
      runtime = true;
    {
      assertRawModule(path, rawModule);
    }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      var parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }
    if (rawModule.modules) {
      forEachValue(rawModule.modules, function(rawChildModule, key) {
        this$1$1.register(path.concat(key), rawChildModule, runtime);
      });
    }
  };
  ModuleCollection.prototype.unregister = function unregister(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    var child = parent.getChild(key);
    if (!child) {
      {
        console.warn(
          "[vuex] trying to unregister module '" + key + "', which is not registered"
        );
      }
      return;
    }
    if (!child.runtime) {
      return;
    }
    parent.removeChild(key);
  };
  ModuleCollection.prototype.isRegistered = function isRegistered(path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    if (parent) {
      return parent.hasChild(key);
    }
    return false;
  };
  function update(path, targetModule, newModule) {
    {
      assertRawModule(path, newModule);
    }
    targetModule.update(newModule);
    if (newModule.modules) {
      for (var key in newModule.modules) {
        if (!targetModule.getChild(key)) {
          {
            console.warn(
              "[vuex] trying to add a new module '" + key + "' on hot reloading, manual reload is needed"
            );
          }
          return;
        }
        update(
          path.concat(key),
          targetModule.getChild(key),
          newModule.modules[key]
        );
      }
    }
  }
  var functionAssert = {
    assert: function(value) {
      return typeof value === "function";
    },
    expected: "function"
  };
  var objectAssert = {
    assert: function(value) {
      return typeof value === "function" || typeof value === "object" && typeof value.handler === "function";
    },
    expected: 'function or object with "handler" function'
  };
  var assertTypes = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
  };
  function assertRawModule(path, rawModule) {
    Object.keys(assertTypes).forEach(function(key) {
      if (!rawModule[key]) {
        return;
      }
      var assertOptions2 = assertTypes[key];
      forEachValue(rawModule[key], function(value, type) {
        assert(
          assertOptions2.assert(value),
          makeAssertionMessage(path, key, type, value, assertOptions2.expected)
        );
      });
    });
  }
  function makeAssertionMessage(path, key, type, value, expected) {
    var buf = key + " should be " + expected + ' but "' + key + "." + type + '"';
    if (path.length > 0) {
      buf += ' in module "' + path.join(".") + '"';
    }
    buf += " is " + JSON.stringify(value) + ".";
    return buf;
  }
  function createStore(options) {
    return new Store(options);
  }
  var Store = function Store2(options) {
    var this$1$1 = this;
    if (options === void 0)
      options = {};
    {
      assert(typeof Promise !== "undefined", "vuex requires a Promise polyfill in this browser.");
      assert(this instanceof Store2, "store must be called with the new operator.");
    }
    var plugins = options.plugins;
    if (plugins === void 0)
      plugins = [];
    var strict = options.strict;
    if (strict === void 0)
      strict = false;
    var devtools = options.devtools;
    this._committing = false;
    this._actions = /* @__PURE__ */ Object.create(null);
    this._actionSubscribers = [];
    this._mutations = /* @__PURE__ */ Object.create(null);
    this._wrappedGetters = /* @__PURE__ */ Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
    this._subscribers = [];
    this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
    this._scope = null;
    this._devtools = devtools;
    var store2 = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store2, type, payload);
    };
    this.commit = function boundCommit(type, payload, options2) {
      return commit.call(store2, type, payload, options2);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreState(this, state);
    plugins.forEach(function(plugin) {
      return plugin(this$1$1);
    });
  };
  var prototypeAccessors = { state: { configurable: true } };
  Store.prototype.install = function install(app, injectKey) {
    app.provide(injectKey || storeKey, this);
    app.config.globalProperties.$store = this;
    var useDevtools = this._devtools !== void 0 ? this._devtools : true;
    if (useDevtools) {
      addDevtools(app, this);
    }
  };
  prototypeAccessors.state.get = function() {
    return this._state.data;
  };
  prototypeAccessors.state.set = function(v) {
    {
      assert(false, "use store.replaceState() to explicit replace store state.");
    }
  };
  Store.prototype.commit = function commit(_type, _payload, _options) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload, _options);
    var type = ref.type;
    var payload = ref.payload;
    var options = ref.options;
    var mutation = { type, payload };
    var entry = this._mutations[type];
    if (!entry) {
      {
        console.error("[vuex] unknown mutation type: " + type);
      }
      return;
    }
    this._withCommit(function() {
      entry.forEach(function commitIterator(handler) {
        handler(payload);
      });
    });
    this._subscribers.slice().forEach(function(sub) {
      return sub(mutation, this$1$1.state);
    });
    if (options && options.silent) {
      console.warn(
        "[vuex] mutation type: " + type + ". Silent option has been removed. Use the filter functionality in the vue-devtools"
      );
    }
  };
  Store.prototype.dispatch = function dispatch(_type, _payload) {
    var this$1$1 = this;
    var ref = unifyObjectStyle(_type, _payload);
    var type = ref.type;
    var payload = ref.payload;
    var action = { type, payload };
    var entry = this._actions[type];
    if (!entry) {
      {
        console.error("[vuex] unknown action type: " + type);
      }
      return;
    }
    try {
      this._actionSubscribers.slice().filter(function(sub) {
        return sub.before;
      }).forEach(function(sub) {
        return sub.before(action, this$1$1.state);
      });
    } catch (e) {
      {
        console.warn("[vuex] error in before action subscribers: ");
        console.error(e);
      }
    }
    var result = entry.length > 1 ? Promise.all(entry.map(function(handler) {
      return handler(payload);
    })) : entry[0](payload);
    return new Promise(function(resolve, reject) {
      result.then(function(res) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.after;
          }).forEach(function(sub) {
            return sub.after(action, this$1$1.state);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in after action subscribers: ");
            console.error(e);
          }
        }
        resolve(res);
      }, function(error) {
        try {
          this$1$1._actionSubscribers.filter(function(sub) {
            return sub.error;
          }).forEach(function(sub) {
            return sub.error(action, this$1$1.state, error);
          });
        } catch (e) {
          {
            console.warn("[vuex] error in error action subscribers: ");
            console.error(e);
          }
        }
        reject(error);
      });
    });
  };
  Store.prototype.subscribe = function subscribe(fn, options) {
    return genericSubscribe(fn, this._subscribers, options);
  };
  Store.prototype.subscribeAction = function subscribeAction(fn, options) {
    var subs = typeof fn === "function" ? { before: fn } : fn;
    return genericSubscribe(subs, this._actionSubscribers, options);
  };
  Store.prototype.watch = function watch$1(getter, cb, options) {
    var this$1$1 = this;
    {
      assert(typeof getter === "function", "store.watch only accepts a function.");
    }
    return vue.watch(function() {
      return getter(this$1$1.state, this$1$1.getters);
    }, cb, Object.assign({}, options));
  };
  Store.prototype.replaceState = function replaceState(state) {
    var this$1$1 = this;
    this._withCommit(function() {
      this$1$1._state.data = state;
    });
  };
  Store.prototype.registerModule = function registerModule(path, rawModule, options) {
    if (options === void 0)
      options = {};
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
      assert(path.length > 0, "cannot register the root module by using registerModule.");
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    resetStoreState(this, this.state);
  };
  Store.prototype.unregisterModule = function unregisterModule(path) {
    var this$1$1 = this;
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    this._modules.unregister(path);
    this._withCommit(function() {
      var parentState = getNestedState(this$1$1.state, path.slice(0, -1));
      delete parentState[path[path.length - 1]];
    });
    resetStore(this);
  };
  Store.prototype.hasModule = function hasModule(path) {
    if (typeof path === "string") {
      path = [path];
    }
    {
      assert(Array.isArray(path), "module path must be a string or an Array.");
    }
    return this._modules.isRegistered(path);
  };
  Store.prototype.hotUpdate = function hotUpdate(newOptions) {
    this._modules.update(newOptions);
    resetStore(this, true);
  };
  Store.prototype._withCommit = function _withCommit(fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  };
  Object.defineProperties(Store.prototype, prototypeAccessors);
  const baseURL = vue.ref("http://139.196.53.65:10089");
  const setBaseURL = (url) => {
    baseURL.value = url;
  };
  const getBaseURL = () => {
    return baseURL.value;
  };
  const request = async (url, method = "GET", data = {}) => {
    const requestURL = `${baseURL.value}${url}`;
    try {
      const options = {
        url: requestURL,
        method,
        timeout: 1e5
        // 100秒超时
      };
      if (method === "GET") {
        options.data = data;
      } else {
        options.data = data;
        options.header = {
          "Content-Type": "application/x-www-form-urlencoded"
          // 表单提交格式
        };
      }
      const response = await uni.request(options);
      if (response.statusCode === 200) {
        return response.data;
      } else {
        throw new Error(`请求失败，状态码: ${response.statusCode}`);
      }
    } catch (error) {
      formatAppLog("error", "at api/index.js:49", "请求出错:", error);
      throw error;
    }
  };
  const api = {
    // 获取设备状态
    getDeviceStatus: (device) => {
      return request("/api/control/relay_status", "GET", { device });
    },
    // 设置设备状态
    setDeviceStatus: (device, status) => {
      return request("/api/control/set_relay_status", "GET", { device, status });
    },
    // 获取当前植物规则
    getCurrentRule: () => {
      return request("/api/control/rules", "GET");
    },
    // 设置植物规则
    setRule: (rules) => {
      return request("/api/control/set_rules", "GET", { rules });
    },
    // 添加新植物规则 - 直接在请求体中传递表单数据，不使用JSON
    addRule: (ruleData) => {
      return request("/api/control/add_rules", "POST", ruleData);
    },
    // 获取所有植物规则
    getAllRules: () => {
      return request("/api/control/all_plants", "GET");
    },
    // 设置当前模式（自动/手动）
    setMode: (mod) => {
      return request("/api/control/set_mod", "GET", { mod });
    },
    // 获取当前模式
    getCurrentMode: () => {
      return request("/api/control/mod", "GET");
    },
    // AI对话
    sendMessage: (msg) => {
      return request("/api/control/send_msg", "GET", { msg });
    }
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$6 = {
    __name: "DeviceControl",
    setup(__props) {
      const store2 = useStore();
      const deviceList = vue.computed(() => store2.getters.deviceList);
      const isAutoMode = vue.computed(() => store2.getters.isAutoMode);
      const requestStatus = vue.computed(() => store2.state.requestStatus);
      const isRefreshing = vue.ref(false);
      const lastUpdateTime = vue.ref("--:--:--");
      const refreshInterval = vue.ref(5);
      let refreshTimer = null;
      const getStatusText = (status) => {
        switch (status) {
          case "on":
            return "运行中";
          case "off":
            return "已停止";
          case "null":
            return "已断连";
          default:
            return "未知状态";
        }
      };
      const toggleDevice = async (device) => {
        if (isAutoMode.value || device.status === "null")
          return;
        const newStatus = device.status === "on" ? "off" : "on";
        try {
          await store2.dispatch("setDeviceStatus", { device: device.id, status: newStatus });
          await silentRefresh();
        } catch (error) {
          formatAppLog("error", "at components/DeviceControl.vue:117", "控制设备失败:", error);
        }
      };
      const toggleMode = async () => {
        const newMode = isAutoMode.value ? "manual" : "auto";
        try {
          await store2.dispatch("setMode", newMode);
          await silentRefresh();
        } catch (error) {
          formatAppLog("error", "at components/DeviceControl.vue:129", "切换模式失败:", error);
        }
      };
      const silentRefresh = async () => {
        try {
          await store2.dispatch("fetchAllDevicesStatus", true);
          updateRefreshTime();
        } catch (error) {
          formatAppLog("error", "at components/DeviceControl.vue:140", "静默获取设备状态失败:", error);
        }
      };
      const manualRefresh = async () => {
        isRefreshing.value = true;
        try {
          await store2.dispatch("fetchAllDevicesStatus");
          updateRefreshTime();
        } catch (error) {
          formatAppLog("error", "at components/DeviceControl.vue:152", "获取设备状态失败:", error);
        } finally {
          isRefreshing.value = false;
        }
      };
      const updateRefreshTime = () => {
        const now = /* @__PURE__ */ new Date();
        lastUpdateTime.value = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      };
      const startAutoRefresh = () => {
        silentRefresh();
        refreshTimer = setInterval(() => {
          silentRefresh();
        }, refreshInterval.value * 1e3);
      };
      vue.onMounted(() => {
        startAutoRefresh();
      });
      vue.onUnmounted(() => {
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "device-control" }, [
          vue.createElementVNode("view", { class: "panel-header" }, [
            vue.createElementVNode("text", { class: "panel-title" }, "设备控制"),
            vue.createElementVNode("view", { class: "panel-status" }, [
              vue.createElementVNode("text", { class: "status-label" }, "当前模式:"),
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["status-value", { "auto-mode": vue.unref(isAutoMode) }])
                },
                vue.toDisplayString(vue.unref(isAutoMode) ? "自动模式" : "手动模式"),
                3
                /* TEXT, CLASS */
              ),
              vue.createElementVNode("view", {
                class: "mode-switch",
                onClick: toggleMode
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["switch-track", { "is-auto": vue.unref(isAutoMode) }])
                  },
                  [
                    vue.createElementVNode("view", { class: "switch-thumb" })
                  ],
                  2
                  /* CLASS */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "switch-text" },
                  vue.toDisplayString(vue.unref(isAutoMode) ? "自动" : "手动"),
                  1
                  /* TEXT */
                )
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "device-status-refresh" }, [
            vue.createElementVNode(
              "text",
              { class: "refresh-text" },
              "设备状态每 " + vue.toDisplayString(refreshInterval.value) + "s 自动刷新",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", {
              class: "refresh-btn",
              onClick: manualRefresh
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["refresh-icon", { "refreshing": isRefreshing.value }])
                },
                null,
                2
                /* CLASS */
              ),
              vue.createElementVNode("text", null, "刷新")
            ]),
            vue.createElementVNode(
              "text",
              { class: "last-updated" },
              "上次更新: " + vue.toDisplayString(lastUpdateTime.value),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "devices-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(vue.unref(deviceList), (device) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: device.id,
                    class: vue.normalizeClass(["device-item", { "is-on": device.status === "on", "is-offline": device.status === "null" }])
                  },
                  [
                    vue.createElementVNode("view", { class: "device-icon" }, [
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["icon-inner", device.id])
                        },
                        [
                          device.status === "on" ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 0,
                            class: "icon-animation"
                          })) : vue.createCommentVNode("v-if", true)
                        ],
                        2
                        /* CLASS */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "device-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "device-name" },
                        vue.toDisplayString(device.name),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["device-status", {
                            "status-on": device.status === "on",
                            "status-off": device.status === "off",
                            "status-offline": device.status === "null"
                          }])
                        },
                        vue.toDisplayString(getStatusText(device.status)),
                        3
                        /* TEXT, CLASS */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "device-toggle" }, [
                      vue.createElementVNode("view", {
                        class: vue.normalizeClass(["toggle-track", { "is-on": device.status === "on" }]),
                        onClick: ($event) => toggleDevice(device),
                        disabled: vue.unref(isAutoMode) || device.status === "null"
                      }, [
                        vue.createElementVNode("view", { class: "toggle-thumb" })
                      ], 10, ["onClick", "disabled"])
                    ]),
                    vue.createCommentVNode(" 自动模式或设备离线遮罩 "),
                    vue.unref(isAutoMode) || device.status === "null" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "device-mask"
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "mask-text" },
                        vue.toDisplayString(vue.unref(isAutoMode) ? "自动控制中" : "设备已断连"),
                        1
                        /* TEXT */
                      )
                    ])) : vue.createCommentVNode("v-if", true)
                  ],
                  2
                  /* CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createCommentVNode(" 状态消息提示 "),
          vue.unref(requestStatus).message ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass(["status-message", { "success": vue.unref(requestStatus).success }])
            },
            vue.toDisplayString(vue.unref(requestStatus).message),
            3
            /* TEXT, CLASS */
          )) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const DeviceControl = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-ba597b5a"], ["__file", "D:/All_Projects/uniapp/ky_control/components/DeviceControl.vue"]]);
  const _sfc_main$5 = {
    __name: "ModeSwitch",
    setup(__props) {
      const store2 = useStore();
      const currentMode = vue.computed(() => store2.state.currentMode);
      const switchMode = async (mode) => {
        if (currentMode.value === mode)
          return;
        try {
          await store2.dispatch("setMode", mode);
        } catch (error) {
          formatAppLog("error", "at components/ModeSwitch.vue:64", "切换模式失败:", error);
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "mode-switch-panel" }, [
          vue.createElementVNode("view", { class: "panel-header" }, [
            vue.createElementVNode("text", { class: "panel-title" }, "运行模式")
          ]),
          vue.createElementVNode("view", { class: "mode-content" }, [
            vue.createElementVNode("view", { class: "mode-options" }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["mode-option", { "active": vue.unref(currentMode) === "auto" }]),
                  onClick: _cache[0] || (_cache[0] = ($event) => switchMode("auto"))
                },
                [
                  vue.createElementVNode("view", { class: "option-icon auto-icon" }, [
                    vue.unref(currentMode) === "auto" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "icon-animation"
                    })) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "option-text-container" }, [
                    vue.createElementVNode("text", { class: "option-text" }, "自动模式"),
                    vue.createElementVNode("text", { class: "option-desc" }, "根据规则自动控制")
                  ])
                ],
                2
                /* CLASS */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["mode-option", { "active": vue.unref(currentMode) === "manual" }]),
                  onClick: _cache[1] || (_cache[1] = ($event) => switchMode("manual"))
                },
                [
                  vue.createElementVNode("view", { class: "option-icon manual-icon" }, [
                    vue.unref(currentMode) === "manual" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "icon-animation"
                    })) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "option-text-container" }, [
                    vue.createElementVNode("text", { class: "option-text" }, "手动模式"),
                    vue.createElementVNode("text", { class: "option-desc" }, "手动控制每个设备")
                  ])
                ],
                2
                /* CLASS */
              )
            ]),
            vue.createElementVNode("view", { class: "current-mode" }, [
              vue.createElementVNode("text", { class: "mode-label" }, "当前模式:"),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["mode-indicator", { "auto": vue.unref(currentMode) === "auto" }])
                },
                [
                  vue.createElementVNode(
                    "text",
                    { class: "indicator-text" },
                    vue.toDisplayString(vue.unref(currentMode) === "auto" ? "自动控制" : "手动控制"),
                    1
                    /* TEXT */
                  )
                ],
                2
                /* CLASS */
              )
            ])
          ])
        ]);
      };
    }
  };
  const ModeSwitch = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-c7a9d2b9"], ["__file", "D:/All_Projects/uniapp/ky_control/components/ModeSwitch.vue"]]);
  const _sfc_main$4 = {
    __name: "PlantRules",
    setup(__props) {
      const store2 = useStore();
      const currentRule = vue.computed(() => store2.state.currentRule);
      const allRules = vue.computed(() => store2.state.allRules);
      const isAutoMode = vue.computed(() => store2.getters.isAutoMode);
      const showAddForm = vue.ref(false);
      const newRule = vue.reactive({
        plants: "",
        min_soil_humidity: "",
        max_soil_humidity: "",
        min_nitrogen: "",
        max_nitrogen: "",
        min_phosphorus: "",
        max_phosphorus: "",
        min_potassium: "",
        max_potassium: "",
        start_time: "",
        end_time: ""
      });
      const selectRule = async (ruleName) => {
        if (ruleName === currentRule.value)
          return;
        if (!isAutoMode.value) {
          uni.showToast({
            title: "请先切换到自动模式",
            icon: "none"
          });
          return;
        }
        try {
          await store2.dispatch("setRule", ruleName);
        } catch (error) {
          formatAppLog("error", "at components/PlantRules.vue:211", "设置规则失败:", error);
        }
      };
      const addRule = async () => {
        const requiredFields = [
          "plants",
          "min_soil_humidity",
          "max_soil_humidity",
          "min_nitrogen",
          "max_nitrogen",
          "min_phosphorus",
          "max_phosphorus",
          "min_potassium",
          "max_potassium",
          "start_time",
          "end_time"
        ];
        for (const field of requiredFields) {
          if (!newRule[field]) {
            uni.showToast({
              title: "请填写所有必填项",
              icon: "none"
            });
            return;
          }
        }
        const ruleData = {
          ...newRule,
          min_soil_humidity: Number(newRule.min_soil_humidity),
          max_soil_humidity: Number(newRule.max_soil_humidity),
          min_nitrogen: Number(newRule.min_nitrogen),
          max_nitrogen: Number(newRule.max_nitrogen),
          min_phosphorus: Number(newRule.min_phosphorus),
          max_phosphorus: Number(newRule.max_phosphorus),
          min_potassium: Number(newRule.min_potassium),
          max_potassium: Number(newRule.max_potassium)
        };
        try {
          const response = await store2.dispatch("addRule", ruleData);
          if (response.code === 0) {
            Object.keys(newRule).forEach((key) => {
              newRule[key] = "";
            });
            showAddForm.value = false;
            uni.showToast({
              title: "规则添加成功",
              icon: "success"
            });
          }
        } catch (error) {
          formatAppLog("error", "at components/PlantRules.vue:263", "添加规则失败:", error);
        }
      };
      vue.watch(isAutoMode, (newValue) => {
        if (!newValue) {
          uni.showToast({
            title: "手动模式下无法选择植物规则",
            icon: "none",
            duration: 2e3
          });
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "plant-rules" }, [
          vue.createElementVNode("view", { class: "panel-header" }, [
            vue.createElementVNode("text", { class: "panel-title" }, "种植物规则"),
            vue.createElementVNode("button", {
              class: "add-rule-btn",
              onClick: _cache[0] || (_cache[0] = ($event) => showAddForm.value = true)
            }, [
              vue.createElementVNode("view", { class: "btn-icon-plus" }),
              vue.createElementVNode("text", null, "添加")
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "rules-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(vue.unref(allRules), (rule) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: rule.id,
                  class: vue.normalizeClass(["rule-item", { "active": rule.plants === vue.unref(currentRule) }]),
                  onClick: ($event) => selectRule(rule.plants)
                }, [
                  vue.createElementVNode("view", { class: "rule-header" }, [
                    vue.createElementVNode("view", { class: "rule-name-area" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "rule-name" },
                        vue.toDisplayString(rule.plants),
                        1
                        /* TEXT */
                      ),
                      rule.plants === vue.unref(currentRule) ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "rule-badge"
                      }, "当前")) : vue.createCommentVNode("v-if", true)
                    ]),
                    rule.plants !== vue.unref(currentRule) ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "rule-select"
                    }, "选择")) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "rule-grid" }, [
                    vue.createElementVNode("view", { class: "rule-param" }, [
                      vue.createElementVNode("view", { class: "param-icon humidity" }),
                      vue.createElementVNode("view", { class: "param-info" }, [
                        vue.createElementVNode("text", { class: "param-label" }, "湿度范围"),
                        vue.createElementVNode(
                          "text",
                          { class: "param-value" },
                          vue.toDisplayString(rule.min_soil_humidity) + "% - " + vue.toDisplayString(rule.max_soil_humidity) + "%",
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "rule-param" }, [
                      vue.createElementVNode("view", { class: "param-icon time" }),
                      vue.createElementVNode("view", { class: "param-info" }, [
                        vue.createElementVNode("text", { class: "param-label" }, "运行时间"),
                        vue.createElementVNode(
                          "text",
                          { class: "param-value" },
                          vue.toDisplayString(rule.start_time) + " - " + vue.toDisplayString(rule.end_time),
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "rule-param" }, [
                      vue.createElementVNode("view", { class: "param-icon nitrogen" }),
                      vue.createElementVNode("view", { class: "param-info" }, [
                        vue.createElementVNode("text", { class: "param-label" }, "氮含量"),
                        vue.createElementVNode(
                          "text",
                          { class: "param-value" },
                          vue.toDisplayString(rule.min_nitrogen) + " - " + vue.toDisplayString(rule.max_nitrogen),
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "rule-param" }, [
                      vue.createElementVNode("view", { class: "param-icon phosphorus" }),
                      vue.createElementVNode("view", { class: "param-info" }, [
                        vue.createElementVNode("text", { class: "param-label" }, "磷含量"),
                        vue.createElementVNode(
                          "text",
                          { class: "param-value" },
                          vue.toDisplayString(rule.min_phosphorus) + " - " + vue.toDisplayString(rule.max_phosphorus),
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "rule-param" }, [
                      vue.createElementVNode("view", { class: "param-icon potassium" }),
                      vue.createElementVNode("view", { class: "param-info" }, [
                        vue.createElementVNode("text", { class: "param-label" }, "钾含量"),
                        vue.createElementVNode(
                          "text",
                          { class: "param-value" },
                          vue.toDisplayString(rule.min_potassium) + " - " + vue.toDisplayString(rule.max_potassium),
                          1
                          /* TEXT */
                        )
                      ])
                    ])
                  ])
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.unref(allRules).length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "no-rules"
            }, [
              vue.createElementVNode("view", { class: "empty-icon" }),
              vue.createElementVNode("text", { class: "empty-text" }, "暂无植物规则"),
              vue.createElementVNode("text", { class: "empty-subtext" }, "点击右上角添加规则按钮创建新规则")
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createCommentVNode(" 添加规则弹窗 "),
          showAddForm.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal-overlay",
            onClick: _cache[15] || (_cache[15] = ($event) => showAddForm.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-content",
              onClick: _cache[14] || (_cache[14] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "添加新规则"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[1] || (_cache[1] = ($event) => showAddForm.value = false)
                }, "✕")
              ]),
              vue.createElementVNode("scroll-view", {
                "scroll-y": "",
                class: "modal-body"
              }, [
                vue.createElementVNode("view", { class: "form-group" }, [
                  vue.createElementVNode("text", { class: "form-label required" }, "种植物名称"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "form-input",
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => newRule.plants = $event),
                      placeholder: "请输入种植物名称"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, newRule.plants]
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-section" }, [
                  vue.createElementVNode("text", { class: "section-title" }, "湿度设置"),
                  vue.createElementVNode("view", { class: "form-row" }, [
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最低湿度(%)"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => newRule.min_soil_humidity = $event),
                          placeholder: "60"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.min_soil_humidity]
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最高湿度(%)"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => newRule.max_soil_humidity = $event),
                          placeholder: "80"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.max_soil_humidity]
                      ])
                    ])
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-section" }, [
                  vue.createElementVNode("text", { class: "section-title" }, "养分含量设置"),
                  vue.createElementVNode("view", { class: "form-row" }, [
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最低氮含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => newRule.min_nitrogen = $event),
                          placeholder: "1000"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.min_nitrogen]
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最高氮含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => newRule.max_nitrogen = $event),
                          placeholder: "2000"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.max_nitrogen]
                      ])
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "form-row" }, [
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最低磷含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => newRule.min_phosphorus = $event),
                          placeholder: "500"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.min_phosphorus]
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最高磷含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => newRule.max_phosphorus = $event),
                          placeholder: "1000"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.max_phosphorus]
                      ])
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "form-row" }, [
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最低钾含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => newRule.min_potassium = $event),
                          placeholder: "800"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.min_potassium]
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "最高钾含量"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          type: "digit",
                          "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => newRule.max_potassium = $event),
                          placeholder: "1500"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.max_potassium]
                      ])
                    ])
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-section" }, [
                  vue.createElementVNode("text", { class: "section-title" }, "运行时间设置"),
                  vue.createElementVNode("view", { class: "form-row" }, [
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "开始时间"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => newRule.start_time = $event),
                          placeholder: "8:30"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.start_time]
                      ])
                    ]),
                    vue.createElementVNode("view", { class: "form-group half" }, [
                      vue.createElementVNode("text", { class: "form-label required" }, "结束时间"),
                      vue.withDirectives(vue.createElementVNode(
                        "input",
                        {
                          class: "form-input",
                          "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => newRule.end_time = $event),
                          placeholder: "17:30"
                        },
                        null,
                        512
                        /* NEED_PATCH */
                      ), [
                        [vue.vModelText, newRule.end_time]
                      ])
                    ])
                  ])
                ])
              ]),
              vue.createElementVNode("view", { class: "modal-footer" }, [
                vue.createElementVNode("button", {
                  class: "form-btn cancel",
                  onClick: _cache[13] || (_cache[13] = ($event) => showAddForm.value = false)
                }, "取消"),
                vue.createElementVNode("button", {
                  class: "form-btn submit",
                  onClick: addRule
                }, "添加规则")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PlantRules = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-e6f51d71"], ["__file", "D:/All_Projects/uniapp/ky_control/components/PlantRules.vue"]]);
  function bind(fn, thisArg) {
    return function wrap() {
      return fn.apply(thisArg, arguments);
    };
  }
  const { toString } = Object.prototype;
  const { getPrototypeOf } = Object;
  const kindOf = ((cache) => (thing) => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  })(/* @__PURE__ */ Object.create(null));
  const kindOfTest = (type) => {
    type = type.toLowerCase();
    return (thing) => kindOf(thing) === type;
  };
  const typeOfTest = (type) => (thing) => typeof thing === type;
  const { isArray } = Array;
  const isUndefined = typeOfTest("undefined");
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
  }
  const isArrayBuffer = kindOfTest("ArrayBuffer");
  function isArrayBufferView(val) {
    let result;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
      result = ArrayBuffer.isView(val);
    } else {
      result = val && val.buffer && isArrayBuffer(val.buffer);
    }
    return result;
  }
  const isString = typeOfTest("string");
  const isFunction = typeOfTest("function");
  const isNumber = typeOfTest("number");
  const isObject = (thing) => thing !== null && typeof thing === "object";
  const isBoolean = (thing) => thing === true || thing === false;
  const isPlainObject = (val) => {
    if (kindOf(val) !== "object") {
      return false;
    }
    const prototype2 = getPrototypeOf(val);
    return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
  };
  const isDate = kindOfTest("Date");
  const isFile = kindOfTest("File");
  const isBlob = kindOfTest("Blob");
  const isFileList = kindOfTest("FileList");
  const isStream = (val) => isObject(val) && isFunction(val.pipe);
  const isFormData = (thing) => {
    let kind;
    return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
    kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]"));
  };
  const isURLSearchParams = kindOfTest("URLSearchParams");
  const [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
  const trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  function forEach(obj, fn, { allOwnKeys = false } = {}) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }
    let i;
    let l;
    if (typeof obj !== "object") {
      obj = [obj];
    }
    if (isArray(obj)) {
      for (i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        fn.call(null, obj[key], key, obj);
      }
    }
  }
  function findKey(obj, key) {
    key = key.toLowerCase();
    const keys = Object.keys(obj);
    let i = keys.length;
    let _key;
    while (i-- > 0) {
      _key = keys[i];
      if (key === _key.toLowerCase()) {
        return _key;
      }
    }
    return null;
  }
  const _global = (() => {
    if (typeof globalThis !== "undefined")
      return globalThis;
    return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
  })();
  const isContextDefined = (context) => !isUndefined(context) && context !== _global;
  function merge() {
    const { caseless } = isContextDefined(this) && this || {};
    const result = {};
    const assignValue = (val, key) => {
      const targetKey = caseless && findKey(result, key) || key;
      if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
        result[targetKey] = merge(result[targetKey], val);
      } else if (isPlainObject(val)) {
        result[targetKey] = merge({}, val);
      } else if (isArray(val)) {
        result[targetKey] = val.slice();
      } else {
        result[targetKey] = val;
      }
    };
    for (let i = 0, l = arguments.length; i < l; i++) {
      arguments[i] && forEach(arguments[i], assignValue);
    }
    return result;
  }
  const extend = (a, b, thisArg, { allOwnKeys } = {}) => {
    forEach(b, (val, key) => {
      if (thisArg && isFunction(val)) {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    }, { allOwnKeys });
    return a;
  };
  const stripBOM = (content) => {
    if (content.charCodeAt(0) === 65279) {
      content = content.slice(1);
    }
    return content;
  };
  const inherits = (constructor, superConstructor, props, descriptors2) => {
    constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
    constructor.prototype.constructor = constructor;
    Object.defineProperty(constructor, "super", {
      value: superConstructor.prototype
    });
    props && Object.assign(constructor.prototype, props);
  };
  const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
    let props;
    let i;
    let prop;
    const merged = {};
    destObj = destObj || {};
    if (sourceObj == null)
      return destObj;
    do {
      props = Object.getOwnPropertyNames(sourceObj);
      i = props.length;
      while (i-- > 0) {
        prop = props[i];
        if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
          destObj[prop] = sourceObj[prop];
          merged[prop] = true;
        }
      }
      sourceObj = filter !== false && getPrototypeOf(sourceObj);
    } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);
    return destObj;
  };
  const endsWith = (str, searchString, position) => {
    str = String(str);
    if (position === void 0 || position > str.length) {
      position = str.length;
    }
    position -= searchString.length;
    const lastIndex = str.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
  const toArray = (thing) => {
    if (!thing)
      return null;
    if (isArray(thing))
      return thing;
    let i = thing.length;
    if (!isNumber(i))
      return null;
    const arr = new Array(i);
    while (i-- > 0) {
      arr[i] = thing[i];
    }
    return arr;
  };
  const isTypedArray = ((TypedArray) => {
    return (thing) => {
      return TypedArray && thing instanceof TypedArray;
    };
  })(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
  const forEachEntry = (obj, fn) => {
    const generator = obj && obj[Symbol.iterator];
    const iterator = generator.call(obj);
    let result;
    while ((result = iterator.next()) && !result.done) {
      const pair = result.value;
      fn.call(obj, pair[0], pair[1]);
    }
  };
  const matchAll = (regExp, str) => {
    let matches;
    const arr = [];
    while ((matches = regExp.exec(str)) !== null) {
      arr.push(matches);
    }
    return arr;
  };
  const isHTMLForm = kindOfTest("HTMLFormElement");
  const toCamelCase = (str) => {
    return str.toLowerCase().replace(
      /[-_\s]([a-z\d])(\w*)/g,
      function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
      }
    );
  };
  const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
  const isRegExp = kindOfTest("RegExp");
  const reduceDescriptors = (obj, reducer) => {
    const descriptors2 = Object.getOwnPropertyDescriptors(obj);
    const reducedDescriptors = {};
    forEach(descriptors2, (descriptor, name) => {
      let ret;
      if ((ret = reducer(descriptor, name, obj)) !== false) {
        reducedDescriptors[name] = ret || descriptor;
      }
    });
    Object.defineProperties(obj, reducedDescriptors);
  };
  const freezeMethods = (obj) => {
    reduceDescriptors(obj, (descriptor, name) => {
      if (isFunction(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
        return false;
      }
      const value = obj[name];
      if (!isFunction(value))
        return;
      descriptor.enumerable = false;
      if ("writable" in descriptor) {
        descriptor.writable = false;
        return;
      }
      if (!descriptor.set) {
        descriptor.set = () => {
          throw Error("Can not rewrite read-only method '" + name + "'");
        };
      }
    });
  };
  const toObjectSet = (arrayOrString, delimiter) => {
    const obj = {};
    const define = (arr) => {
      arr.forEach((value) => {
        obj[value] = true;
      });
    };
    isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
    return obj;
  };
  const noop = () => {
  };
  const toFiniteNumber = (value, defaultValue) => {
    return value != null && Number.isFinite(value = +value) ? value : defaultValue;
  };
  function isSpecCompliantForm(thing) {
    return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === "FormData" && thing[Symbol.iterator]);
  }
  const toJSONObject = (obj) => {
    const stack = new Array(10);
    const visit = (source, i) => {
      if (isObject(source)) {
        if (stack.indexOf(source) >= 0) {
          return;
        }
        if (!("toJSON" in source)) {
          stack[i] = source;
          const target = isArray(source) ? [] : {};
          forEach(source, (value, key) => {
            const reducedValue = visit(value, i + 1);
            !isUndefined(reducedValue) && (target[key] = reducedValue);
          });
          stack[i] = void 0;
          return target;
        }
      }
      return source;
    };
    return visit(obj, 0);
  };
  const isAsyncFn = kindOfTest("AsyncFunction");
  const isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
  const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
    if (setImmediateSupported) {
      return setImmediate;
    }
    return postMessageSupported ? ((token, callbacks) => {
      _global.addEventListener("message", ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      }, false);
      return (cb) => {
        callbacks.push(cb);
        _global.postMessage(token, "*");
      };
    })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
  })(
    typeof setImmediate === "function",
    isFunction(_global.postMessage)
  );
  const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
  const utils$1 = {
    isArray,
    isArrayBuffer,
    isBuffer,
    isFormData,
    isArrayBufferView,
    isString,
    isNumber,
    isBoolean,
    isObject,
    isPlainObject,
    isReadableStream,
    isRequest,
    isResponse,
    isHeaders,
    isUndefined,
    isDate,
    isFile,
    isBlob,
    isRegExp,
    isFunction,
    isStream,
    isURLSearchParams,
    isTypedArray,
    isFileList,
    forEach,
    merge,
    extend,
    trim,
    stripBOM,
    inherits,
    toFlatObject,
    kindOf,
    kindOfTest,
    endsWith,
    toArray,
    forEachEntry,
    matchAll,
    isHTMLForm,
    hasOwnProperty,
    hasOwnProp: hasOwnProperty,
    // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors,
    freezeMethods,
    toObjectSet,
    toCamelCase,
    noop,
    toFiniteNumber,
    findKey,
    global: _global,
    isContextDefined,
    isSpecCompliantForm,
    toJSONObject,
    isAsyncFn,
    isThenable,
    setImmediate: _setImmediate,
    asap
  };
  function AxiosError(message, code, config, request2, response) {
    Error.call(this);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
    this.message = message;
    this.name = "AxiosError";
    code && (this.code = code);
    config && (this.config = config);
    request2 && (this.request = request2);
    if (response) {
      this.response = response;
      this.status = response.status ? response.status : null;
    }
  }
  utils$1.inherits(AxiosError, Error, {
    toJSON: function toJSON() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: utils$1.toJSONObject(this.config),
        code: this.code,
        status: this.status
      };
    }
  });
  const prototype$1 = AxiosError.prototype;
  const descriptors = {};
  [
    "ERR_BAD_OPTION_VALUE",
    "ERR_BAD_OPTION",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ERR_NETWORK",
    "ERR_FR_TOO_MANY_REDIRECTS",
    "ERR_DEPRECATED",
    "ERR_BAD_RESPONSE",
    "ERR_BAD_REQUEST",
    "ERR_CANCELED",
    "ERR_NOT_SUPPORT",
    "ERR_INVALID_URL"
    // eslint-disable-next-line func-names
  ].forEach((code) => {
    descriptors[code] = { value: code };
  });
  Object.defineProperties(AxiosError, descriptors);
  Object.defineProperty(prototype$1, "isAxiosError", { value: true });
  AxiosError.from = (error, code, config, request2, response, customProps) => {
    const axiosError = Object.create(prototype$1);
    utils$1.toFlatObject(error, axiosError, function filter(obj) {
      return obj !== Error.prototype;
    }, (prop) => {
      return prop !== "isAxiosError";
    });
    AxiosError.call(axiosError, error.message, code, config, request2, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  };
  const httpAdapter = null;
  function isVisitable(thing) {
    return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
  }
  function removeBrackets(key) {
    return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
  }
  function renderKey(path, key, dots) {
    if (!path)
      return key;
    return path.concat(key).map(function each(token, i) {
      token = removeBrackets(token);
      return !dots && i ? "[" + token + "]" : token;
    }).join(dots ? "." : "");
  }
  function isFlatArray(arr) {
    return utils$1.isArray(arr) && !arr.some(isVisitable);
  }
  const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
    return /^is[A-Z]/.test(prop);
  });
  function toFormData(obj, formData, options) {
    if (!utils$1.isObject(obj)) {
      throw new TypeError("target must be an object");
    }
    formData = formData || new FormData();
    options = utils$1.toFlatObject(options, {
      metaTokens: true,
      dots: false,
      indexes: false
    }, false, function defined(option, source) {
      return !utils$1.isUndefined(source[option]);
    });
    const metaTokens = options.metaTokens;
    const visitor = options.visitor || defaultVisitor;
    const dots = options.dots;
    const indexes = options.indexes;
    const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
    const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
    if (!utils$1.isFunction(visitor)) {
      throw new TypeError("visitor must be a function");
    }
    function convertValue(value) {
      if (value === null)
        return "";
      if (utils$1.isDate(value)) {
        return value.toISOString();
      }
      if (!useBlob && utils$1.isBlob(value)) {
        throw new AxiosError("Blob is not supported. Use a Buffer instead.");
      }
      if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
        return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
      }
      return value;
    }
    function defaultVisitor(value, key, path) {
      let arr = value;
      if (value && !path && typeof value === "object") {
        if (utils$1.endsWith(key, "{}")) {
          key = metaTokens ? key : key.slice(0, -2);
          value = JSON.stringify(value);
        } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
          key = removeBrackets(key);
          arr.forEach(function each(el, index) {
            !(utils$1.isUndefined(el) || el === null) && formData.append(
              // eslint-disable-next-line no-nested-ternary
              indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
              convertValue(el)
            );
          });
          return false;
        }
      }
      if (isVisitable(value)) {
        return true;
      }
      formData.append(renderKey(path, key, dots), convertValue(value));
      return false;
    }
    const stack = [];
    const exposedHelpers = Object.assign(predicates, {
      defaultVisitor,
      convertValue,
      isVisitable
    });
    function build(value, path) {
      if (utils$1.isUndefined(value))
        return;
      if (stack.indexOf(value) !== -1) {
        throw Error("Circular reference detected in " + path.join("."));
      }
      stack.push(value);
      utils$1.forEach(value, function each(el, key) {
        const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
          formData,
          el,
          utils$1.isString(key) ? key.trim() : key,
          path,
          exposedHelpers
        );
        if (result === true) {
          build(el, path ? path.concat(key) : [key]);
        }
      });
      stack.pop();
    }
    if (!utils$1.isObject(obj)) {
      throw new TypeError("data must be an object");
    }
    build(obj);
    return formData;
  }
  function encode$1(str) {
    const charMap = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0"
    };
    return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
      return charMap[match];
    });
  }
  function AxiosURLSearchParams(params, options) {
    this._pairs = [];
    params && toFormData(params, this, options);
  }
  const prototype = AxiosURLSearchParams.prototype;
  prototype.append = function append(name, value) {
    this._pairs.push([name, value]);
  };
  prototype.toString = function toString2(encoder) {
    const _encode = encoder ? function(value) {
      return encoder.call(this, value, encode$1);
    } : encode$1;
    return this._pairs.map(function each(pair) {
      return _encode(pair[0]) + "=" + _encode(pair[1]);
    }, "").join("&");
  };
  function encode(val) {
    return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
  }
  function buildURL(url, params, options) {
    if (!params) {
      return url;
    }
    const _encode = options && options.encode || encode;
    if (utils$1.isFunction(options)) {
      options = {
        serialize: options
      };
    }
    const serializeFn = options && options.serialize;
    let serializedParams;
    if (serializeFn) {
      serializedParams = serializeFn(params, options);
    } else {
      serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, options).toString(_encode);
    }
    if (serializedParams) {
      const hashmarkIndex = url.indexOf("#");
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }
      url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url;
  }
  class InterceptorManager {
    constructor() {
      this.handlers = [];
    }
    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled,
        rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    }
    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     *
     * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
     */
    eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    }
    /**
     * Clear all interceptors from the stack
     *
     * @returns {void}
     */
    clear() {
      if (this.handlers) {
        this.handlers = [];
      }
    }
    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     *
     * @returns {void}
     */
    forEach(fn) {
      utils$1.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    }
  }
  const InterceptorManager$1 = InterceptorManager;
  const transitionalDefaults = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  };
  const URLSearchParams$1 = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams;
  const FormData$1 = typeof FormData !== "undefined" ? FormData : null;
  const Blob$1 = typeof Blob !== "undefined" ? Blob : null;
  const platform$1 = {
    isBrowser: true,
    classes: {
      URLSearchParams: URLSearchParams$1,
      FormData: FormData$1,
      Blob: Blob$1
    },
    protocols: ["http", "https", "file", "blob", "url", "data"]
  };
  const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
  const _navigator = typeof navigator === "object" && navigator || void 0;
  const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
  const hasStandardBrowserWebWorkerEnv = (() => {
    return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
    self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
  })();
  const origin = hasBrowserEnv && window.location.href || "http://localhost";
  const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    hasBrowserEnv,
    hasStandardBrowserEnv,
    hasStandardBrowserWebWorkerEnv,
    navigator: _navigator,
    origin
  }, Symbol.toStringTag, { value: "Module" }));
  const platform = {
    ...utils,
    ...platform$1
  };
  function toURLEncodedForm(data, options) {
    return toFormData(data, new platform.classes.URLSearchParams(), Object.assign({
      visitor: function(value, key, path, helpers) {
        if (platform.isNode && utils$1.isBuffer(value)) {
          this.append(key, value.toString("base64"));
          return false;
        }
        return helpers.defaultVisitor.apply(this, arguments);
      }
    }, options));
  }
  function parsePropPath(name) {
    return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
      return match[0] === "[]" ? "" : match[1] || match[0];
    });
  }
  function arrayToObject(arr) {
    const obj = {};
    const keys = Object.keys(arr);
    let i;
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      obj[key] = arr[key];
    }
    return obj;
  }
  function formDataToJSON(formData) {
    function buildPath(path, value, target, index) {
      let name = path[index++];
      if (name === "__proto__")
        return true;
      const isNumericKey = Number.isFinite(+name);
      const isLast = index >= path.length;
      name = !name && utils$1.isArray(target) ? target.length : name;
      if (isLast) {
        if (utils$1.hasOwnProp(target, name)) {
          target[name] = [target[name], value];
        } else {
          target[name] = value;
        }
        return !isNumericKey;
      }
      if (!target[name] || !utils$1.isObject(target[name])) {
        target[name] = [];
      }
      const result = buildPath(path, value, target[name], index);
      if (result && utils$1.isArray(target[name])) {
        target[name] = arrayToObject(target[name]);
      }
      return !isNumericKey;
    }
    if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
      const obj = {};
      utils$1.forEachEntry(formData, (name, value) => {
        buildPath(parsePropPath(name), value, obj, 0);
      });
      return obj;
    }
    return null;
  }
  function stringifySafely(rawValue, parser, encoder) {
    if (utils$1.isString(rawValue)) {
      try {
        (parser || JSON.parse)(rawValue);
        return utils$1.trim(rawValue);
      } catch (e) {
        if (e.name !== "SyntaxError") {
          throw e;
        }
      }
    }
    return (encoder || JSON.stringify)(rawValue);
  }
  const defaults = {
    transitional: transitionalDefaults,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils$1.isObject(data);
      if (isObjectPayload && utils$1.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils$1.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }
      if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (utils$1.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils$1.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, this.formSerializer).toString();
        }
        if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const _FormData = this.env && this.env.FormData;
          return toFormData(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            this.formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }],
    transformResponse: [function transformResponse(data) {
      const transitional = this.transitional || defaults.transitional;
      const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
      const JSONRequested = this.responseType === "json";
      if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (data && utils$1.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
        const silentJSONParsing = transitional && transitional.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
            }
            throw e;
          }
        }
      }
      return data;
    }],
    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: {
      FormData: platform.classes.FormData,
      Blob: platform.classes.Blob
    },
    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    },
    headers: {
      common: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": void 0
      }
    }
  };
  utils$1.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
    defaults.headers[method] = {};
  });
  const defaults$1 = defaults;
  const ignoreDuplicateOf = utils$1.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent"
  ]);
  const parseHeaders = (rawHeaders) => {
    const parsed = {};
    let key;
    let val;
    let i;
    rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
      i = line.indexOf(":");
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();
      if (!key || parsed[key] && ignoreDuplicateOf[key]) {
        return;
      }
      if (key === "set-cookie") {
        if (parsed[key]) {
          parsed[key].push(val);
        } else {
          parsed[key] = [val];
        }
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
      }
    });
    return parsed;
  };
  const $internals = Symbol("internals");
  function normalizeHeader(header) {
    return header && String(header).trim().toLowerCase();
  }
  function normalizeValue(value) {
    if (value === false || value == null) {
      return value;
    }
    return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
  }
  function parseTokens(str) {
    const tokens = /* @__PURE__ */ Object.create(null);
    const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let match;
    while (match = tokensRE.exec(str)) {
      tokens[match[1]] = match[2];
    }
    return tokens;
  }
  const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
  function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
    if (utils$1.isFunction(filter)) {
      return filter.call(this, value, header);
    }
    if (isHeaderNameFilter) {
      value = header;
    }
    if (!utils$1.isString(value))
      return;
    if (utils$1.isString(filter)) {
      return value.indexOf(filter) !== -1;
    }
    if (utils$1.isRegExp(filter)) {
      return filter.test(value);
    }
  }
  function formatHeader(header) {
    return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
  }
  function buildAccessors(obj, header) {
    const accessorName = utils$1.toCamelCase(" " + header);
    ["get", "set", "has"].forEach((methodName) => {
      Object.defineProperty(obj, methodName + accessorName, {
        value: function(arg1, arg2, arg3) {
          return this[methodName].call(this, header, arg1, arg2, arg3);
        },
        configurable: true
      });
    });
  }
  class AxiosHeaders {
    constructor(headers) {
      headers && this.set(headers);
    }
    set(header, valueOrRewrite, rewrite) {
      const self2 = this;
      function setHeader(_value, _header, _rewrite) {
        const lHeader = normalizeHeader(_header);
        if (!lHeader) {
          throw new Error("header name must be a non-empty string");
        }
        const key = utils$1.findKey(self2, lHeader);
        if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
          self2[key || _header] = normalizeValue(_value);
        }
      }
      const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
      if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
        setHeaders(header, valueOrRewrite);
      } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
        setHeaders(parseHeaders(header), valueOrRewrite);
      } else if (utils$1.isHeaders(header)) {
        for (const [key, value] of header.entries()) {
          setHeader(value, key, rewrite);
        }
      } else {
        header != null && setHeader(valueOrRewrite, header, rewrite);
      }
      return this;
    }
    get(header, parser) {
      header = normalizeHeader(header);
      if (header) {
        const key = utils$1.findKey(this, header);
        if (key) {
          const value = this[key];
          if (!parser) {
            return value;
          }
          if (parser === true) {
            return parseTokens(value);
          }
          if (utils$1.isFunction(parser)) {
            return parser.call(this, value, key);
          }
          if (utils$1.isRegExp(parser)) {
            return parser.exec(value);
          }
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(header, matcher) {
      header = normalizeHeader(header);
      if (header) {
        const key = utils$1.findKey(this, header);
        return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
      }
      return false;
    }
    delete(header, matcher) {
      const self2 = this;
      let deleted = false;
      function deleteHeader(_header) {
        _header = normalizeHeader(_header);
        if (_header) {
          const key = utils$1.findKey(self2, _header);
          if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
            delete self2[key];
            deleted = true;
          }
        }
      }
      if (utils$1.isArray(header)) {
        header.forEach(deleteHeader);
      } else {
        deleteHeader(header);
      }
      return deleted;
    }
    clear(matcher) {
      const keys = Object.keys(this);
      let i = keys.length;
      let deleted = false;
      while (i--) {
        const key = keys[i];
        if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
          delete this[key];
          deleted = true;
        }
      }
      return deleted;
    }
    normalize(format) {
      const self2 = this;
      const headers = {};
      utils$1.forEach(this, (value, header) => {
        const key = utils$1.findKey(headers, header);
        if (key) {
          self2[key] = normalizeValue(value);
          delete self2[header];
          return;
        }
        const normalized = format ? formatHeader(header) : String(header).trim();
        if (normalized !== header) {
          delete self2[header];
        }
        self2[normalized] = normalizeValue(value);
        headers[normalized] = true;
      });
      return this;
    }
    concat(...targets) {
      return this.constructor.concat(this, ...targets);
    }
    toJSON(asStrings) {
      const obj = /* @__PURE__ */ Object.create(null);
      utils$1.forEach(this, (value, header) => {
        value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
      });
      return obj;
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(thing) {
      return thing instanceof this ? thing : new this(thing);
    }
    static concat(first, ...targets) {
      const computed = new this(first);
      targets.forEach((target) => computed.set(target));
      return computed;
    }
    static accessor(header) {
      const internals = this[$internals] = this[$internals] = {
        accessors: {}
      };
      const accessors = internals.accessors;
      const prototype2 = this.prototype;
      function defineAccessor(_header) {
        const lHeader = normalizeHeader(_header);
        if (!accessors[lHeader]) {
          buildAccessors(prototype2, _header);
          accessors[lHeader] = true;
        }
      }
      utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
      return this;
    }
  }
  AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
  utils$1.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
    let mapped = key[0].toUpperCase() + key.slice(1);
    return {
      get: () => value,
      set(headerValue) {
        this[mapped] = headerValue;
      }
    };
  });
  utils$1.freezeMethods(AxiosHeaders);
  const AxiosHeaders$1 = AxiosHeaders;
  function transformData(fns, response) {
    const config = this || defaults$1;
    const context = response || config;
    const headers = AxiosHeaders$1.from(context.headers);
    let data = context.data;
    utils$1.forEach(fns, function transform(fn) {
      data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
    });
    headers.normalize();
    return data;
  }
  function isCancel(value) {
    return !!(value && value.__CANCEL__);
  }
  function CanceledError(message, config, request2) {
    AxiosError.call(this, message == null ? "canceled" : message, AxiosError.ERR_CANCELED, config, request2);
    this.name = "CanceledError";
  }
  utils$1.inherits(CanceledError, AxiosError, {
    __CANCEL__: true
  });
  function settle(resolve, reject, response) {
    const validateStatus = response.config.validateStatus;
    if (!response.status || !validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(new AxiosError(
        "Request failed with status code " + response.status,
        [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
        response.config,
        response.request,
        response
      ));
    }
  }
  function parseProtocol(url) {
    const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
    return match && match[1] || "";
  }
  function speedometer(samplesCount, min) {
    samplesCount = samplesCount || 10;
    const bytes = new Array(samplesCount);
    const timestamps = new Array(samplesCount);
    let head = 0;
    let tail = 0;
    let firstSampleTS;
    min = min !== void 0 ? min : 1e3;
    return function push(chunkLength) {
      const now = Date.now();
      const startedAt = timestamps[tail];
      if (!firstSampleTS) {
        firstSampleTS = now;
      }
      bytes[head] = chunkLength;
      timestamps[head] = now;
      let i = tail;
      let bytesCount = 0;
      while (i !== head) {
        bytesCount += bytes[i++];
        i = i % samplesCount;
      }
      head = (head + 1) % samplesCount;
      if (head === tail) {
        tail = (tail + 1) % samplesCount;
      }
      if (now - firstSampleTS < min) {
        return;
      }
      const passed = startedAt && now - startedAt;
      return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
    };
  }
  function throttle(fn, freq) {
    let timestamp = 0;
    let threshold = 1e3 / freq;
    let lastArgs;
    let timer;
    const invoke = (args, now = Date.now()) => {
      timestamp = now;
      lastArgs = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      fn.apply(null, args);
    };
    const throttled = (...args) => {
      const now = Date.now();
      const passed = now - timestamp;
      if (passed >= threshold) {
        invoke(args, now);
      } else {
        lastArgs = args;
        if (!timer) {
          timer = setTimeout(() => {
            timer = null;
            invoke(lastArgs);
          }, threshold - passed);
        }
      }
    };
    const flush = () => lastArgs && invoke(lastArgs);
    return [throttled, flush];
  }
  const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
    let bytesNotified = 0;
    const _speedometer = speedometer(50, 250);
    return throttle((e) => {
      const loaded = e.loaded;
      const total = e.lengthComputable ? e.total : void 0;
      const progressBytes = loaded - bytesNotified;
      const rate = _speedometer(progressBytes);
      const inRange = loaded <= total;
      bytesNotified = loaded;
      const data = {
        loaded,
        total,
        progress: total ? loaded / total : void 0,
        bytes: progressBytes,
        rate: rate ? rate : void 0,
        estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
        event: e,
        lengthComputable: total != null,
        [isDownloadStream ? "download" : "upload"]: true
      };
      listener(data);
    }, freq);
  };
  const progressEventDecorator = (total, throttled) => {
    const lengthComputable = total != null;
    return [(loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }), throttled[1]];
  };
  const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
  const isURLSameOrigin = platform.hasStandardBrowserEnv ? ((origin2, isMSIE) => (url) => {
    url = new URL(url, platform.origin);
    return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
  })(
    new URL(platform.origin),
    platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
  ) : () => true;
  const cookies = platform.hasStandardBrowserEnv ? (
    // Standard browser envs support document.cookie
    {
      write(name, value, expires, path, domain, secure) {
        const cookie = [name + "=" + encodeURIComponent(value)];
        utils$1.isNumber(expires) && cookie.push("expires=" + new Date(expires).toGMTString());
        utils$1.isString(path) && cookie.push("path=" + path);
        utils$1.isString(domain) && cookie.push("domain=" + domain);
        secure === true && cookie.push("secure");
        document.cookie = cookie.join("; ");
      },
      read(name) {
        const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
        return match ? decodeURIComponent(match[3]) : null;
      },
      remove(name) {
        this.write(name, "", Date.now() - 864e5);
      }
    }
  ) : (
    // Non-standard browser env (web workers, react-native) lack needed support.
    {
      write() {
      },
      read() {
        return null;
      },
      remove() {
      }
    }
  );
  function isAbsoluteURL(url) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
  }
  function combineURLs(baseURL2, relativeURL) {
    return relativeURL ? baseURL2.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL2;
  }
  function buildFullPath(baseURL2, requestedURL, allowAbsoluteUrls) {
    let isRelativeUrl = !isAbsoluteURL(requestedURL);
    if (baseURL2 && (isRelativeUrl || allowAbsoluteUrls == false)) {
      return combineURLs(baseURL2, requestedURL);
    }
    return requestedURL;
  }
  const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
  function mergeConfig(config1, config2) {
    config2 = config2 || {};
    const config = {};
    function getMergedValue(target, source, prop, caseless) {
      if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
        return utils$1.merge.call({ caseless }, target, source);
      } else if (utils$1.isPlainObject(source)) {
        return utils$1.merge({}, source);
      } else if (utils$1.isArray(source)) {
        return source.slice();
      }
      return source;
    }
    function mergeDeepProperties(a, b, prop, caseless) {
      if (!utils$1.isUndefined(b)) {
        return getMergedValue(a, b, prop, caseless);
      } else if (!utils$1.isUndefined(a)) {
        return getMergedValue(void 0, a, prop, caseless);
      }
    }
    function valueFromConfig2(a, b) {
      if (!utils$1.isUndefined(b)) {
        return getMergedValue(void 0, b);
      }
    }
    function defaultToConfig2(a, b) {
      if (!utils$1.isUndefined(b)) {
        return getMergedValue(void 0, b);
      } else if (!utils$1.isUndefined(a)) {
        return getMergedValue(void 0, a);
      }
    }
    function mergeDirectKeys(a, b, prop) {
      if (prop in config2) {
        return getMergedValue(a, b);
      } else if (prop in config1) {
        return getMergedValue(void 0, a);
      }
    }
    const mergeMap = {
      url: valueFromConfig2,
      method: valueFromConfig2,
      data: valueFromConfig2,
      baseURL: defaultToConfig2,
      transformRequest: defaultToConfig2,
      transformResponse: defaultToConfig2,
      paramsSerializer: defaultToConfig2,
      timeout: defaultToConfig2,
      timeoutMessage: defaultToConfig2,
      withCredentials: defaultToConfig2,
      withXSRFToken: defaultToConfig2,
      adapter: defaultToConfig2,
      responseType: defaultToConfig2,
      xsrfCookieName: defaultToConfig2,
      xsrfHeaderName: defaultToConfig2,
      onUploadProgress: defaultToConfig2,
      onDownloadProgress: defaultToConfig2,
      decompress: defaultToConfig2,
      maxContentLength: defaultToConfig2,
      maxBodyLength: defaultToConfig2,
      beforeRedirect: defaultToConfig2,
      transport: defaultToConfig2,
      httpAgent: defaultToConfig2,
      httpsAgent: defaultToConfig2,
      cancelToken: defaultToConfig2,
      socketPath: defaultToConfig2,
      responseEncoding: defaultToConfig2,
      validateStatus: mergeDirectKeys,
      headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
    };
    utils$1.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
      const merge2 = mergeMap[prop] || mergeDeepProperties;
      const configValue = merge2(config1[prop], config2[prop], prop);
      utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
    });
    return config;
  }
  const resolveConfig = (config) => {
    const newConfig = mergeConfig({}, config);
    let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
    newConfig.headers = headers = AxiosHeaders$1.from(headers);
    newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);
    if (auth) {
      headers.set(
        "Authorization",
        "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
      );
    }
    let contentType;
    if (utils$1.isFormData(data)) {
      if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
        headers.setContentType(void 0);
      } else if ((contentType = headers.getContentType()) !== false) {
        const [type, ...tokens] = contentType ? contentType.split(";").map((token) => token.trim()).filter(Boolean) : [];
        headers.setContentType([type || "multipart/form-data", ...tokens].join("; "));
      }
    }
    if (platform.hasStandardBrowserEnv) {
      withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
      if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin(newConfig.url)) {
        const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
        if (xsrfValue) {
          headers.set(xsrfHeaderName, xsrfValue);
        }
      }
    }
    return newConfig;
  };
  const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
  const xhrAdapter = isXHRAdapterSupported && function(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      const _config = resolveConfig(config);
      let requestData = _config.data;
      const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
      let { responseType, onUploadProgress, onDownloadProgress } = _config;
      let onCanceled;
      let uploadThrottled, downloadThrottled;
      let flushUpload, flushDownload;
      function done() {
        flushUpload && flushUpload();
        flushDownload && flushDownload();
        _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
        _config.signal && _config.signal.removeEventListener("abort", onCanceled);
      }
      let request2 = new XMLHttpRequest();
      request2.open(_config.method.toUpperCase(), _config.url, true);
      request2.timeout = _config.timeout;
      function onloadend() {
        if (!request2) {
          return;
        }
        const responseHeaders = AxiosHeaders$1.from(
          "getAllResponseHeaders" in request2 && request2.getAllResponseHeaders()
        );
        const responseData = !responseType || responseType === "text" || responseType === "json" ? request2.responseText : request2.response;
        const response = {
          data: responseData,
          status: request2.status,
          statusText: request2.statusText,
          headers: responseHeaders,
          config,
          request: request2
        };
        settle(function _resolve(value) {
          resolve(value);
          done();
        }, function _reject(err) {
          reject(err);
          done();
        }, response);
        request2 = null;
      }
      if ("onloadend" in request2) {
        request2.onloadend = onloadend;
      } else {
        request2.onreadystatechange = function handleLoad() {
          if (!request2 || request2.readyState !== 4) {
            return;
          }
          if (request2.status === 0 && !(request2.responseURL && request2.responseURL.indexOf("file:") === 0)) {
            return;
          }
          setTimeout(onloadend);
        };
      }
      request2.onabort = function handleAbort() {
        if (!request2) {
          return;
        }
        reject(new AxiosError("Request aborted", AxiosError.ECONNABORTED, config, request2));
        request2 = null;
      };
      request2.onerror = function handleError() {
        reject(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, request2));
        request2 = null;
      };
      request2.ontimeout = function handleTimeout() {
        let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
        const transitional = _config.transitional || transitionalDefaults;
        if (_config.timeoutErrorMessage) {
          timeoutErrorMessage = _config.timeoutErrorMessage;
        }
        reject(new AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
          request2
        ));
        request2 = null;
      };
      requestData === void 0 && requestHeaders.setContentType(null);
      if ("setRequestHeader" in request2) {
        utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
          request2.setRequestHeader(key, val);
        });
      }
      if (!utils$1.isUndefined(_config.withCredentials)) {
        request2.withCredentials = !!_config.withCredentials;
      }
      if (responseType && responseType !== "json") {
        request2.responseType = _config.responseType;
      }
      if (onDownloadProgress) {
        [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
        request2.addEventListener("progress", downloadThrottled);
      }
      if (onUploadProgress && request2.upload) {
        [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
        request2.upload.addEventListener("progress", uploadThrottled);
        request2.upload.addEventListener("loadend", flushUpload);
      }
      if (_config.cancelToken || _config.signal) {
        onCanceled = (cancel) => {
          if (!request2) {
            return;
          }
          reject(!cancel || cancel.type ? new CanceledError(null, config, request2) : cancel);
          request2.abort();
          request2 = null;
        };
        _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
        if (_config.signal) {
          _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
        }
      }
      const protocol = parseProtocol(_config.url);
      if (protocol && platform.protocols.indexOf(protocol) === -1) {
        reject(new AxiosError("Unsupported protocol " + protocol + ":", AxiosError.ERR_BAD_REQUEST, config));
        return;
      }
      request2.send(requestData || null);
    });
  };
  const composeSignals = (signals, timeout) => {
    const { length } = signals = signals ? signals.filter(Boolean) : [];
    if (timeout || length) {
      let controller = new AbortController();
      let aborted;
      const onabort = function(reason) {
        if (!aborted) {
          aborted = true;
          unsubscribe();
          const err = reason instanceof Error ? reason : this.reason;
          controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
        }
      };
      let timer = timeout && setTimeout(() => {
        timer = null;
        onabort(new AxiosError(`timeout ${timeout} of ms exceeded`, AxiosError.ETIMEDOUT));
      }, timeout);
      const unsubscribe = () => {
        if (signals) {
          timer && clearTimeout(timer);
          timer = null;
          signals.forEach((signal2) => {
            signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
          });
          signals = null;
        }
      };
      signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
      const { signal } = controller;
      signal.unsubscribe = () => utils$1.asap(unsubscribe);
      return signal;
    }
  };
  const composeSignals$1 = composeSignals;
  const streamChunk = function* (chunk, chunkSize) {
    let len = chunk.byteLength;
    if (!chunkSize || len < chunkSize) {
      yield chunk;
      return;
    }
    let pos = 0;
    let end;
    while (pos < len) {
      end = pos + chunkSize;
      yield chunk.slice(pos, end);
      pos = end;
    }
  };
  const readBytes = async function* (iterable, chunkSize) {
    for await (const chunk of readStream(iterable)) {
      yield* streamChunk(chunk, chunkSize);
    }
  };
  const readStream = async function* (stream) {
    if (stream[Symbol.asyncIterator]) {
      yield* stream;
      return;
    }
    const reader = stream.getReader();
    try {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      await reader.cancel();
    }
  };
  const trackStream = (stream, chunkSize, onProgress, onFinish) => {
    const iterator = readBytes(stream, chunkSize);
    let bytes = 0;
    let done;
    let _onFinish = (e) => {
      if (!done) {
        done = true;
        onFinish && onFinish(e);
      }
    };
    return new ReadableStream({
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator.return();
      }
    }, {
      highWaterMark: 2
    });
  };
  const isFetchSupported = typeof fetch === "function" && typeof Request === "function" && typeof Response === "function";
  const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === "function";
  const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Response(str).arrayBuffer()));
  const test = (fn, ...args) => {
    try {
      return !!fn(...args);
    } catch (e) {
      return false;
    }
  };
  const supportsRequestStream = isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const hasContentType = new Request(platform.origin, {
      body: new ReadableStream(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    }).headers.has("Content-Type");
    return duplexAccessed && !hasContentType;
  });
  const DEFAULT_CHUNK_SIZE = 64 * 1024;
  const supportsResponseStream = isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && ((res) => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res2) => res2[type]() : (_, config) => {
        throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
      });
    });
  })(new Response());
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils$1.isBlob(body)) {
      return body.size;
    }
    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request(platform.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils$1.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  const fetchAdapter = isFetchSupported && (async (config) => {
    let {
      url,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions
    } = resolveConfig(config);
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals$1([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
    let request2;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    try {
      if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
        let _request = new Request(url, {
          method: "POST",
          body: data,
          duplex: "half"
        });
        let contentTypeHeader;
        if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
          headers.setContentType(contentTypeHeader);
        }
        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );
          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
        }
      }
      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = "credentials" in Request.prototype;
      request2 = new Request(url, {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      });
      let response = await fetch(request2);
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](response, config);
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request: request2
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (err && err.name === "TypeError" && /fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, request2),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError.from(err, err && err.code, config, request2);
    }
  });
  const knownAdapters = {
    http: httpAdapter,
    xhr: xhrAdapter,
    fetch: fetchAdapter
  };
  utils$1.forEach(knownAdapters, (fn, value) => {
    if (fn) {
      try {
        Object.defineProperty(fn, "name", { value });
      } catch (e) {
      }
      Object.defineProperty(fn, "adapterName", { value });
    }
  });
  const renderReason = (reason) => `- ${reason}`;
  const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
  const adapters = {
    getAdapter: (adapters2) => {
      adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
      const { length } = adapters2;
      let nameOrAdapter;
      let adapter;
      const rejectedReasons = {};
      for (let i = 0; i < length; i++) {
        nameOrAdapter = adapters2[i];
        let id;
        adapter = nameOrAdapter;
        if (!isResolvedHandle(nameOrAdapter)) {
          adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
          if (adapter === void 0) {
            throw new AxiosError(`Unknown adapter '${id}'`);
          }
        }
        if (adapter) {
          break;
        }
        rejectedReasons[id || "#" + i] = adapter;
      }
      if (!adapter) {
        const reasons = Object.entries(rejectedReasons).map(
          ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
        );
        let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
        throw new AxiosError(
          `There is no suitable adapter to dispatch the request ` + s,
          "ERR_NOT_SUPPORT"
        );
      }
      return adapter;
    },
    adapters: knownAdapters
  };
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }
    if (config.signal && config.signal.aborted) {
      throw new CanceledError(null, config);
    }
  }
  function dispatchRequest(config) {
    throwIfCancellationRequested(config);
    config.headers = AxiosHeaders$1.from(config.headers);
    config.data = transformData.call(
      config,
      config.transformRequest
    );
    if (["post", "put", "patch"].indexOf(config.method) !== -1) {
      config.headers.setContentType("application/x-www-form-urlencoded", false);
    }
    const adapter = adapters.getAdapter(config.adapter || defaults$1.adapter);
    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      );
      response.headers = AxiosHeaders$1.from(response.headers);
      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          );
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    });
  }
  const VERSION = "1.8.4";
  const validators$1 = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
    validators$1[type] = function validator2(thing) {
      return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
    };
  });
  const deprecatedWarnings = {};
  validators$1.transitional = function transitional(validator2, version, message) {
    function formatMessage(opt, desc) {
      return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
    }
    return (value, opt, opts) => {
      if (validator2 === false) {
        throw new AxiosError(
          formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
          AxiosError.ERR_DEPRECATED
        );
      }
      if (version && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        formatAppLog(
          "warn",
          "at node_modules/.store/axios@1.8.4/node_modules/axios/lib/helpers/validator.js:43",
          formatMessage(
            opt,
            " has been deprecated since v" + version + " and will be removed in the near future"
          )
        );
      }
      return validator2 ? validator2(value, opt, opts) : true;
    };
  };
  validators$1.spelling = function spelling(correctSpelling) {
    return (value, opt) => {
      formatAppLog("warn", "at node_modules/.store/axios@1.8.4/node_modules/axios/lib/helpers/validator.js:58", `${opt} is likely a misspelling of ${correctSpelling}`);
      return true;
    };
  };
  function assertOptions(options, schema, allowUnknown) {
    if (typeof options !== "object") {
      throw new AxiosError("options must be an object", AxiosError.ERR_BAD_OPTION_VALUE);
    }
    const keys = Object.keys(options);
    let i = keys.length;
    while (i-- > 0) {
      const opt = keys[i];
      const validator2 = schema[opt];
      if (validator2) {
        const value = options[opt];
        const result = value === void 0 || validator2(value, opt, options);
        if (result !== true) {
          throw new AxiosError("option " + opt + " must be " + result, AxiosError.ERR_BAD_OPTION_VALUE);
        }
        continue;
      }
      if (allowUnknown !== true) {
        throw new AxiosError("Unknown option " + opt, AxiosError.ERR_BAD_OPTION);
      }
    }
  }
  const validator = {
    assertOptions,
    validators: validators$1
  };
  const validators = validator.validators;
  class Axios {
    constructor(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager$1(),
        response: new InterceptorManager$1()
      };
    }
    /**
     * Dispatch a request
     *
     * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
     * @param {?Object} config
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    async request(configOrUrl, config) {
      try {
        return await this._request(configOrUrl, config);
      } catch (err) {
        if (err instanceof Error) {
          let dummy = {};
          Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
          const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
          try {
            if (!err.stack) {
              err.stack = stack;
            } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
              err.stack += "\n" + stack;
            }
          } catch (e) {
          }
        }
        throw err;
      }
    }
    _request(configOrUrl, config) {
      if (typeof configOrUrl === "string") {
        config = config || {};
        config.url = configOrUrl;
      } else {
        config = configOrUrl || {};
      }
      config = mergeConfig(this.defaults, config);
      const { transitional, paramsSerializer, headers } = config;
      if (transitional !== void 0) {
        validator.assertOptions(transitional, {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean)
        }, false);
      }
      if (paramsSerializer != null) {
        if (utils$1.isFunction(paramsSerializer)) {
          config.paramsSerializer = {
            serialize: paramsSerializer
          };
        } else {
          validator.assertOptions(paramsSerializer, {
            encode: validators.function,
            serialize: validators.function
          }, true);
        }
      }
      if (config.allowAbsoluteUrls !== void 0)
        ;
      else if (this.defaults.allowAbsoluteUrls !== void 0) {
        config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
      } else {
        config.allowAbsoluteUrls = true;
      }
      validator.assertOptions(config, {
        baseUrl: validators.spelling("baseURL"),
        withXsrfToken: validators.spelling("withXSRFToken")
      }, true);
      config.method = (config.method || this.defaults.method || "get").toLowerCase();
      let contextHeaders = headers && utils$1.merge(
        headers.common,
        headers[config.method]
      );
      headers && utils$1.forEach(
        ["delete", "get", "head", "post", "put", "patch", "common"],
        (method) => {
          delete headers[method];
        }
      );
      config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
      const requestInterceptorChain = [];
      let synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
          return;
        }
        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      const responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });
      let promise;
      let i = 0;
      let len;
      if (!synchronousRequestInterceptors) {
        const chain = [dispatchRequest.bind(this), void 0];
        chain.unshift.apply(chain, requestInterceptorChain);
        chain.push.apply(chain, responseInterceptorChain);
        len = chain.length;
        promise = Promise.resolve(config);
        while (i < len) {
          promise = promise.then(chain[i++], chain[i++]);
        }
        return promise;
      }
      len = requestInterceptorChain.length;
      let newConfig = config;
      i = 0;
      while (i < len) {
        const onFulfilled = requestInterceptorChain[i++];
        const onRejected = requestInterceptorChain[i++];
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected.call(this, error);
          break;
        }
      }
      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        return Promise.reject(error);
      }
      i = 0;
      len = responseInterceptorChain.length;
      while (i < len) {
        promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
      }
      return promise;
    }
    getUri(config) {
      config = mergeConfig(this.defaults, config);
      const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
      return buildURL(fullPath, config.params, config.paramsSerializer);
    }
  }
  utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
    Axios.prototype[method] = function(url, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        url,
        data: (config || {}).data
      }));
    };
  });
  utils$1.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
    function generateHTTPMethod(isForm) {
      return function httpMethod(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url,
          data
        }));
      };
    }
    Axios.prototype[method] = generateHTTPMethod();
    Axios.prototype[method + "Form"] = generateHTTPMethod(true);
  });
  const Axios$1 = Axios;
  class CancelToken {
    constructor(executor) {
      if (typeof executor !== "function") {
        throw new TypeError("executor must be a function.");
      }
      let resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });
      const token = this;
      this.promise.then((cancel) => {
        if (!token._listeners)
          return;
        let i = token._listeners.length;
        while (i-- > 0) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });
      this.promise.then = (onfulfilled) => {
        let _resolve;
        const promise = new Promise((resolve) => {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);
        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };
        return promise;
      };
      executor(function cancel(message, config, request2) {
        if (token.reason) {
          return;
        }
        token.reason = new CanceledError(message, config, request2);
        resolvePromise(token.reason);
      });
    }
    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    }
    /**
     * Subscribe to the cancel signal
     */
    subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }
      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    }
    /**
     * Unsubscribe from the cancel signal
     */
    unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      const index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    }
    toAbortSignal() {
      const controller = new AbortController();
      const abort = (err) => {
        controller.abort(err);
      };
      this.subscribe(abort);
      controller.signal.unsubscribe = () => this.unsubscribe(abort);
      return controller.signal;
    }
    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source() {
      let cancel;
      const token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token,
        cancel
      };
    }
  }
  const CancelToken$1 = CancelToken;
  function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  }
  function isAxiosError(payload) {
    return utils$1.isObject(payload) && payload.isAxiosError === true;
  }
  const HttpStatusCode = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511
  };
  Object.entries(HttpStatusCode).forEach(([key, value]) => {
    HttpStatusCode[value] = key;
  });
  const HttpStatusCode$1 = HttpStatusCode;
  function createInstance(defaultConfig) {
    const context = new Axios$1(defaultConfig);
    const instance = bind(Axios$1.prototype.request, context);
    utils$1.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
    utils$1.extend(instance, context, null, { allOwnKeys: true });
    instance.create = function create(instanceConfig) {
      return createInstance(mergeConfig(defaultConfig, instanceConfig));
    };
    return instance;
  }
  const axios = createInstance(defaults$1);
  axios.Axios = Axios$1;
  axios.CanceledError = CanceledError;
  axios.CancelToken = CancelToken$1;
  axios.isCancel = isCancel;
  axios.VERSION = VERSION;
  axios.toFormData = toFormData;
  axios.AxiosError = AxiosError;
  axios.Cancel = axios.CanceledError;
  axios.all = function all(promises) {
    return Promise.all(promises);
  };
  axios.spread = spread;
  axios.isAxiosError = isAxiosError;
  axios.mergeConfig = mergeConfig;
  axios.AxiosHeaders = AxiosHeaders$1;
  axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
  axios.getAdapter = adapters.getAdapter;
  axios.HttpStatusCode = HttpStatusCode$1;
  axios.default = axios;
  const axios$1 = axios;
  const _sfc_main$3 = {
    __name: "VoiceAssistant",
    setup(__props) {
      const store2 = useStore();
      const API_CONFIG = {
        // 语音识别API端点
        SPEECH_RECOGNITION_API: "https://api.yourdomain.com/speech-recognition",
        // 唤醒词检测API端点
        WAKEUP_DETECTION_API: "https://api.yourdomain.com/wakeup-detection",
        // 文本转语音API端点
        TEXT_TO_SPEECH_API: "https://api.yourdomain.com/text-to-speech",
        // API密钥
        API_KEY: "your-api-key"
      };
      const chatMessages = vue.computed(() => store2.state.chatMessages);
      const inputMessage = vue.ref("");
      const isListening = vue.ref(false);
      const isTyping = vue.ref(false);
      const scrollTop = vue.ref(0);
      const messagesScroll = vue.ref(null);
      const isWakeupMode = vue.ref(false);
      const isWakeupActive = vue.ref(false);
      let recognitionTimer = null;
      let audioRecorder = null;
      let audioPlayer = null;
      let recordedAudio = null;
      const getStatusText = vue.computed(() => {
        if (isWakeupActive.value)
          return "已唤醒，请说出指令";
        if (isListening.value)
          return "正在聆听...";
        if (isWakeupMode.value)
          return "等待唤醒";
        return "待命中";
      });
      const initSpeechServices = () => {
        try {
          if (uni.getRecorderManager) {
            audioRecorder = uni.getRecorderManager();
            audioRecorder.onStart(() => {
              formatAppLog("log", "at components/VoiceAssistant.vue:157", "录音开始");
            });
            audioRecorder.onStop((res) => {
              formatAppLog("log", "at components/VoiceAssistant.vue:161", "录音结束", res);
              const { tempFilePath } = res;
              recordedAudio = tempFilePath;
              if (isWakeupMode.value && !isWakeupActive.value) {
                checkWakeupWord(tempFilePath);
              } else {
                performSpeechRecognition(tempFilePath);
              }
            });
            audioRecorder.onError((res) => {
              formatAppLog("error", "at components/VoiceAssistant.vue:175", "录音错误:", res);
              isListening.value = false;
              uni.showToast({
                title: "录音出错，请重试",
                icon: "none"
              });
            });
          }
          if (uni.createInnerAudioContext) {
            audioPlayer = uni.createInnerAudioContext();
            audioPlayer.onError((res) => {
              formatAppLog("error", "at components/VoiceAssistant.vue:189", "音频播放错误:", res);
              uni.showToast({
                title: "语音播放失败",
                icon: "none"
              });
            });
          }
          formatAppLog("log", "at components/VoiceAssistant.vue:197", "语音服务初始化成功");
        } catch (error) {
          formatAppLog("error", "at components/VoiceAssistant.vue:199", "初始化语音服务失败:", error);
        }
      };
      const checkWakeupWord = async (filePath) => {
        formatAppLog("log", "at components/VoiceAssistant.vue:205", "检查唤醒词...");
        uni.showLoading({ title: "检测中..." });
        try {
          const formData = new FormData();
          formData.append("audio", {
            uri: filePath,
            type: "audio/mp3",
            name: "voice.mp3"
          });
          formData.append("wake_word", "小源小源");
          const response = await axios$1.post(API_CONFIG.WAKEUP_DETECTION_API, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${API_CONFIG.API_KEY}`
            }
          });
          uni.hideLoading();
          if (response.data && response.data.detected) {
            formatAppLog("log", "at components/VoiceAssistant.vue:229", "检测到唤醒词!");
            activateAssistant();
          } else {
            formatAppLog("log", "at components/VoiceAssistant.vue:232", "未检测到唤醒词，继续等待");
            if (isWakeupMode.value) {
              isWakeupActive.value = false;
            }
          }
        } catch (error) {
          uni.hideLoading();
          formatAppLog("error", "at components/VoiceAssistant.vue:239", "唤醒词检测失败:", error);
          uni.showToast({
            title: "唤醒词检测失败",
            icon: "none"
          });
          if (isWakeupMode.value) {
            isWakeupActive.value = false;
          }
        }
      };
      const performSpeechRecognition = async (filePath) => {
        formatAppLog("log", "at components/VoiceAssistant.vue:254", "执行语音识别...");
        uni.showLoading({ title: "识别中..." });
        try {
          const formData = new FormData();
          formData.append("audio", {
            uri: filePath,
            type: "audio/mp3",
            name: "voice.mp3"
          });
          formData.append("language", "zh-CN");
          const response = await axios$1.post(API_CONFIG.SPEECH_RECOGNITION_API, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${API_CONFIG.API_KEY}`
            }
          });
          uni.hideLoading();
          if (response.data && response.data.text) {
            const recognizedText = response.data.text.trim();
            formatAppLog("log", "at components/VoiceAssistant.vue:279", "识别结果:", recognizedText);
            if (recognizedText) {
              inputMessage.value = recognizedText;
              setTimeout(() => {
                sendMessage();
              }, 300);
            } else {
              uni.showToast({
                title: "未能识别语音内容",
                icon: "none"
              });
            }
          } else {
            uni.showToast({
              title: "语音识别失败",
              icon: "none"
            });
          }
        } catch (error) {
          uni.hideLoading();
          formatAppLog("error", "at components/VoiceAssistant.vue:303", "语音识别请求失败:", error);
          uni.showToast({
            title: "语音识别失败",
            icon: "none"
          });
        }
      };
      const speakText = async (text) => {
        if (!text)
          return;
        formatAppLog("log", "at components/VoiceAssistant.vue:314", "播放语音:", text);
        try {
          const response = await axios$1.post(API_CONFIG.TEXT_TO_SPEECH_API, {
            text,
            voice: "zh-CN-XiaoxiaoNeural",
            // 可以指定语音
            speed: 1
          }, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_CONFIG.API_KEY}`
            },
            responseType: "blob"
            // 接收二进制数据
          });
          const blob = new Blob([response.data], { type: "audio/mp3" });
          const tempFilePath = URL.createObjectURL(blob);
          if (audioPlayer) {
            audioPlayer.src = tempFilePath;
            audioPlayer.play();
          } else {
            const audio = new Audio(tempFilePath);
            audio.play();
          }
        } catch (error) {
          formatAppLog("error", "at components/VoiceAssistant.vue:344", "文字转语音失败:", error);
          uni.showToast({
            title: "语音播放失败",
            icon: "none"
          });
        }
      };
      const activateAssistant = () => {
        isWakeupActive.value = true;
        speakText("我在，请说");
        setTimeout(() => {
          startListening();
        }, 1e3);
      };
      const toggleWakeupMode = () => {
        isWakeupMode.value = !isWakeupMode.value;
        if (isWakeupMode.value) {
          uni.showToast({
            title: '唤醒模式已开启，请说"小源小源"',
            icon: "none",
            duration: 2e3
          });
          formatAppLog("log", "at components/VoiceAssistant.vue:375", '唤醒模式已开启，等待唤醒词"小源小源"');
        } else {
          uni.showToast({
            title: "唤醒模式已关闭",
            icon: "none",
            duration: 1500
          });
          isWakeupActive.value = false;
          formatAppLog("log", "at components/VoiceAssistant.vue:383", "唤醒模式已关闭");
        }
      };
      const formatTime = (timeString) => {
        if (!timeString)
          return "";
        try {
          if (timeString.includes(":")) {
            const parts = timeString.split(":");
            if (parts.length >= 3) {
              return `${parts[0]}:${parts[1]}:${parts[2].substring(0, 2)}`;
            }
            return timeString;
          }
          const date = new Date(timeString);
          return date.toTimeString().substring(0, 8);
        } catch (e) {
          return timeString;
        }
      };
      const sendMessage = async () => {
        if (!inputMessage.value.trim() || isListening.value)
          return;
        try {
          isTyping.value = true;
          await store2.dispatch("sendAIMessage", inputMessage.value);
          const latestMessages = store2.state.chatMessages;
          const assistantMessage = latestMessages[latestMessages.length - 1];
          if (assistantMessage && assistantMessage.role === "assistant") {
            speakText(assistantMessage.content);
          }
          inputMessage.value = "";
          setTimeout(() => {
            isTyping.value = false;
            vue.nextTick(() => {
              scrollToBottom();
            });
          }, 500);
          if (isWakeupActive.value) {
            isWakeupActive.value = false;
          }
        } catch (error) {
          formatAppLog("error", "at components/VoiceAssistant.vue:445", "发送消息失败:", error);
          isTyping.value = false;
          uni.showToast({
            title: "发送消息失败",
            icon: "none"
          });
        }
      };
      const startListening = () => {
        if (!audioRecorder) {
          formatAppLog("warn", "at components/VoiceAssistant.vue:457", "录音功能不可用");
          uni.showToast({
            title: "录音功能不可用",
            icon: "none"
          });
          return;
        }
        isListening.value = true;
        recognitionTimer = setTimeout(() => {
          stopListening();
        }, 1e4);
        try {
          audioRecorder.start({
            duration: 1e4,
            // 最长录音时间，单位ms
            sampleRate: 16e3,
            // 采样率
            numberOfChannels: 1,
            // 录音通道数
            encodeBitRate: 48e3,
            // 编码码率
            format: "mp3",
            // 音频格式
            frameSize: 50
            // 指定帧大小
          });
          formatAppLog("log", "at components/VoiceAssistant.vue:482", "开始录音");
        } catch (error) {
          formatAppLog("error", "at components/VoiceAssistant.vue:484", "启动录音失败:", error);
          isListening.value = false;
          uni.showToast({
            title: "启动录音失败",
            icon: "none"
          });
        }
      };
      const stopListening = () => {
        if (recognitionTimer) {
          clearTimeout(recognitionTimer);
          recognitionTimer = null;
        }
        if (!isListening.value)
          return;
        try {
          if (audioRecorder) {
            audioRecorder.stop();
            formatAppLog("log", "at components/VoiceAssistant.vue:505", "停止录音");
          }
        } catch (error) {
          formatAppLog("error", "at components/VoiceAssistant.vue:508", "停止录音失败:", error);
          uni.showToast({
            title: "停止录音失败",
            icon: "none"
          });
        }
        isListening.value = false;
      };
      const scrollToBottom = () => {
        scrollTop.value = 999999;
        setTimeout(() => {
          scrollTop.value = 999999;
        }, 100);
      };
      const loadMoreMessages = () => {
        formatAppLog("log", "at components/VoiceAssistant.vue:532", "加载更多消息");
      };
      vue.watch(chatMessages, () => {
        vue.nextTick(() => {
          scrollToBottom();
        });
      });
      vue.onMounted(() => {
        initSpeechServices();
        if (chatMessages.value.length > 0) {
          vue.nextTick(() => {
            scrollToBottom();
          });
        }
      });
      vue.onBeforeUnmount(() => {
        if (recognitionTimer) {
          clearTimeout(recognitionTimer);
          recognitionTimer = null;
        }
        if (audioRecorder) {
          try {
            audioRecorder.stop();
          } catch (e) {
          }
        }
        if (audioPlayer) {
          audioPlayer.stop();
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "voice-assistant" }, [
          vue.createElementVNode("view", { class: "panel-header" }, [
            vue.createElementVNode("text", { class: "panel-title" }, "语音助手"),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["assistant-status", { "active": isListening.value, "wakeup": isWakeupActive.value }])
              },
              [
                vue.createElementVNode("view", { class: "status-dot" }),
                vue.createElementVNode(
                  "text",
                  { class: "status-text" },
                  vue.toDisplayString(vue.unref(getStatusText)),
                  1
                  /* TEXT */
                )
              ],
              2
              /* CLASS */
            )
          ]),
          vue.createElementVNode("view", { class: "chat-container" }, [
            vue.createElementVNode("scroll-view", {
              "scroll-y": "",
              class: "chat-messages",
              "scroll-top": scrollTop.value,
              onScrolltoupper: loadMoreMessages,
              ref_key: "messagesScroll",
              ref: messagesScroll,
              "enable-flex": ""
            }, [
              vue.createElementVNode("view", { class: "scroll-content" }, [
                vue.unref(chatMessages).length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "empty-state"
                }, [
                  vue.createElementVNode("view", { class: "empty-icon" }),
                  vue.createElementVNode("text", { class: "empty-text" }, "您可以通过语音或文字与我交流"),
                  vue.createElementVNode("view", { class: "examples" }, [
                    vue.createElementVNode("text", { class: "example-title" }, "您可以尝试:"),
                    vue.createElementVNode("view", { class: "example-item" }, [
                      vue.createElementVNode("view", { class: "example-bullet" }),
                      vue.createElementVNode("text", { class: "example-text" }, '"打开水泵"')
                    ]),
                    vue.createElementVNode("view", { class: "example-item" }, [
                      vue.createElementVNode("view", { class: "example-bullet" }),
                      vue.createElementVNode("text", { class: "example-text" }, '"关闭所有设备"')
                    ]),
                    vue.createElementVNode("view", { class: "example-item" }, [
                      vue.createElementVNode("view", { class: "example-bullet" }),
                      vue.createElementVNode("text", { class: "example-text" }, '"切换到自动模式"')
                    ])
                  ])
                ])) : (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "messages-container"
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(vue.unref(chatMessages), (message, index) => {
                      return vue.openBlock(), vue.createElementBlock(
                        "view",
                        {
                          key: index,
                          class: vue.normalizeClass(["message-item", { "user": message.role === "user", "assistant": message.role === "assistant", "system": message.role === "system" }])
                        },
                        [
                          vue.createElementVNode(
                            "view",
                            {
                              class: vue.normalizeClass(["message-avatar", message.role])
                            },
                            [
                              vue.createElementVNode("view", { class: "avatar-icon" })
                            ],
                            2
                            /* CLASS */
                          ),
                          vue.createElementVNode("view", { class: "message-content" }, [
                            vue.createElementVNode(
                              "view",
                              { class: "message-bubble" },
                              vue.toDisplayString(message.content),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              { class: "message-time" },
                              vue.toDisplayString(formatTime(message.time)),
                              1
                              /* TEXT */
                            )
                          ])
                        ],
                        2
                        /* CLASS */
                      );
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  )),
                  vue.createCommentVNode(" 打字动画指示器 "),
                  isTyping.value ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "typing-indicator"
                  }, [
                    vue.createElementVNode("view", { class: "typing-dot" }),
                    vue.createElementVNode("view", { class: "typing-dot" }),
                    vue.createElementVNode("view", { class: "typing-dot" })
                  ])) : vue.createCommentVNode("v-if", true)
                ]))
              ])
            ], 40, ["scroll-top"])
          ]),
          vue.createElementVNode("view", { class: "chat-input-container" }, [
            vue.createElementVNode("view", { class: "input-wrapper" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                class: "text-input",
                type: "text",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => inputMessage.value = $event),
                placeholder: "请输入您的问题...",
                onConfirm: sendMessage,
                disabled: isListening.value,
                "adjust-position": "false"
              }, null, 40, ["disabled"]), [
                [vue.vModelText, inputMessage.value]
              ])
            ]),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["voice-btn", { "listening": isListening.value, "wakeup": isWakeupMode.value }]),
                onTouchstart: startListening,
                onTouchend: stopListening,
                onClick: toggleWakeupMode
              },
              [
                vue.createElementVNode("view", { class: "voice-icon" }),
                isListening.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "voice-waves"
                }, [
                  (vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(3, (wave, index) => {
                      return vue.createElementVNode("view", {
                        key: index,
                        class: "wave"
                      });
                    }),
                    64
                    /* STABLE_FRAGMENT */
                  ))
                ])) : vue.createCommentVNode("v-if", true)
              ],
              34
              /* CLASS, HYDRATE_EVENTS */
            ),
            vue.createElementVNode("button", {
              class: "send-btn",
              disabled: !inputMessage.value || isListening.value,
              onClick: sendMessage
            }, [
              vue.createElementVNode("view", { class: "send-icon" })
            ], 8, ["disabled"])
          ])
        ]);
      };
    }
  };
  const VoiceAssistant = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-c3d7ca27"], ["__file", "D:/All_Projects/uniapp/ky_control/components/VoiceAssistant.vue"]]);
  const _sfc_main$2 = {
    __name: "Loading",
    props: {
      // 是否显示加载中
      show: {
        type: Boolean,
        default: false
      },
      // 加载文本
      text: {
        type: String,
        default: ""
      }
    },
    setup(__props) {
      return (_ctx, _cache) => {
        return __props.show ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-container"
        }, [
          vue.createElementVNode("view", { class: "loading-overlay" }),
          vue.createElementVNode("view", { class: "loading-content" }, [
            vue.createElementVNode("view", { class: "loading-spinner" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(4, (item, index) => {
                  return vue.createElementVNode(
                    "view",
                    {
                      key: index,
                      class: vue.normalizeClass(["spinner-item", `delay-${index}`])
                    },
                    null,
                    2
                    /* CLASS */
                  );
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ]),
            vue.createElementVNode(
              "text",
              { class: "loading-text" },
              vue.toDisplayString(__props.text || "加载中..."),
              1
              /* TEXT */
            )
          ])
        ])) : vue.createCommentVNode("v-if", true);
      };
    }
  };
  const Loading = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-65e10ca8"], ["__file", "D:/All_Projects/uniapp/ky_control/components/Loading.vue"]]);
  const _sfc_main$1 = {
    __name: "index",
    setup(__props) {
      const store2 = useStore();
      const isAutoMode = vue.computed(() => store2.getters.isAutoMode);
      const currentRule = vue.computed(() => store2.state.currentRule);
      const loading = vue.computed(() => store2.state.loading);
      const showIpDialog = vue.ref(false);
      const newIpAddress = vue.ref("");
      const updateServerAddress = () => {
        if (newIpAddress.value) {
          setBaseURL(newIpAddress.value);
          uni.showToast({
            title: "服务器地址已更新",
            icon: "success"
          });
          showIpDialog.value = false;
          store2.dispatch("initApp");
        } else {
          uni.showToast({
            title: "请输入有效地址",
            icon: "none"
          });
        }
      };
      vue.onMounted(() => {
        newIpAddress.value = getBaseURL();
        store2.dispatch("initApp");
        if (uni.getSystemInfoSync().platform === "android") {
          setTimeout(() => {
            if (typeof plus !== "undefined" && plus.navigator) {
              plus.navigator.setFullscreen(true);
            }
          }, 1e3);
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
          vue.createCommentVNode(" 顶部状态栏 "),
          vue.createElementVNode("view", { class: "header" }, [
            vue.createElementVNode("view", { class: "app-info" }, [
              vue.createElementVNode("text", { class: "app-title" }, "开源节流-智能灌溉控制系统"),
              vue.createElementVNode("text", { class: "app-subtitle" }, "MYL")
            ]),
            vue.createElementVNode("view", { class: "status-bar" }, [
              vue.createElementVNode("view", { class: "status-item" }, [
                vue.createElementVNode("text", { class: "status-label" }, "模式"),
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["status-value", { "auto": vue.unref(isAutoMode) }])
                  },
                  vue.toDisplayString(vue.unref(isAutoMode) ? "自动" : "手动"),
                  3
                  /* TEXT, CLASS */
                )
              ]),
              vue.createElementVNode("view", { class: "status-item" }, [
                vue.createElementVNode("text", { class: "status-label" }, "当前规则"),
                vue.createElementVNode(
                  "text",
                  { class: "status-value rule" },
                  vue.toDisplayString(vue.unref(currentRule) || "未设置"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "status-item settings" }, [
                vue.createElementVNode("view", {
                  class: "setting-btn",
                  onClick: _cache[0] || (_cache[0] = ($event) => showIpDialog.value = true)
                }, [
                  vue.createElementVNode("view", { class: "setting-icon ip" }),
                  vue.createElementVNode("text", null, "修改IP")
                ])
              ])
            ])
          ]),
          vue.createCommentVNode(" 主内容区域 "),
          vue.createElementVNode("view", { class: "main-content" }, [
            vue.createCommentVNode(" 左侧区域：语音助手 "),
            vue.createElementVNode("view", { class: "left-panel" }, [
              vue.createVNode(VoiceAssistant)
            ]),
            vue.createCommentVNode(" 中间区域：设备控制 "),
            vue.createElementVNode("view", { class: "center-panel" }, [
              vue.createVNode(DeviceControl)
            ]),
            vue.createCommentVNode(" 右侧区域：模式切换和规则管理 "),
            vue.createElementVNode("view", { class: "right-panel" }, [
              vue.createElementVNode("view", { class: "top-section" }, [
                vue.createVNode(ModeSwitch)
              ]),
              vue.createElementVNode("view", { class: "bottom-section" }, [
                vue.createVNode(PlantRules)
              ])
            ])
          ]),
          vue.createCommentVNode(" IP地址设置弹出框 "),
          showIpDialog.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "dialog-overlay",
            onClick: _cache[4] || (_cache[4] = ($event) => showIpDialog.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "dialog-content",
              onClick: _cache[3] || (_cache[3] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("text", { class: "dialog-title" }, "修改服务器地址"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "dialog-input",
                  type: "text",
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => newIpAddress.value = $event),
                  placeholder: "请输入新的服务器地址"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, newIpAddress.value]
              ]),
              vue.createElementVNode("view", { class: "dialog-actions" }, [
                vue.createElementVNode("button", {
                  class: "dialog-btn cancel",
                  onClick: _cache[2] || (_cache[2] = ($event) => showIpDialog.value = false)
                }, "取消"),
                vue.createElementVNode("button", {
                  class: "dialog-btn confirm",
                  onClick: updateServerAddress
                }, "确认")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 加载动画 "),
          vue.createVNode(Loading, { show: vue.unref(loading) }, null, 8, ["show"])
        ]);
      };
    }
  };
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__file", "D:/All_Projects/uniapp/ky_control/pages/index/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
      this.setFullScreen();
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:11", "App Show");
      this.setFullScreen();
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:18", "App Hide");
    },
    methods: {
      setFullScreen() {
        setTimeout(() => {
          if (typeof plus !== "undefined") {
            try {
              plus.screen.lockOrientation("landscape");
              plus.navigator.setFullscreen(true);
              const currentWebview = plus.webview.currentWebview();
              currentWebview.setStyle({
                position: "absolute",
                top: "0px",
                bottom: "0px",
                left: "0px",
                right: "0px",
                background: "#051020",
                // 以下设置确保全屏显示，隐藏状态栏和底部虚拟按键区
                popGesture: "none",
                scrollIndicator: "none",
                softinputMode: "adjustResize"
              });
              plus.navigator.setStatusBarBackground("#000000");
              plus.navigator.setStatusBarStyle("dark");
              plus.navigator.setFullscreen(true);
              if (plus.os.name.toLowerCase() === "android") {
                const context = plus.android.importClass("android.content.Context");
                const window2 = plus.android.runtimeMainActivity().getWindow();
                const View = plus.android.importClass("android.view.View");
                const FLAG_FULLSCREEN = 1024;
                window2.setFlags(FLAG_FULLSCREEN, FLAG_FULLSCREEN);
                const decorView = window2.getDecorView();
                const SYSTEM_UI_FLAG_HIDE_NAVIGATION = 2;
                const SYSTEM_UI_FLAG_FULLSCREEN = 4;
                const SYSTEM_UI_FLAG_IMMERSIVE_STICKY = 4096;
                const SYSTEM_UI_FLAG_LAYOUT_STABLE = 256;
                const SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION = 512;
                const SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN = 1024;
                const flags = SYSTEM_UI_FLAG_HIDE_NAVIGATION | SYSTEM_UI_FLAG_FULLSCREEN | SYSTEM_UI_FLAG_IMMERSIVE_STICKY | SYSTEM_UI_FLAG_LAYOUT_STABLE | SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
                decorView.setSystemUiVisibility(flags);
              } else if (plus.os.name.toLowerCase() === "ios") {
                const statusBarHeight = plus.navigator.getStatusbarHeight();
                currentWebview.setStyle({
                  top: -statusBarHeight + "px",
                  bottom: "0px"
                });
              }
            } catch (e) {
              formatAppLog("error", "at App.vue:94", "设置全屏失败:", e.message);
            }
          }
        }, 300);
      }
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/All_Projects/uniapp/ky_control/App.vue"]]);
  const store = createStore({
    state: {
      // 设备状态
      devices: {
        pump: "off",
        // 水泵状态
        nitrogen: "off",
        // 氮肥状态
        phosphorus: "off",
        // 磷肥状态
        potassium: "off"
        // 钾肥状态
      },
      // 当前模式（自动/手动）
      currentMode: "manual",
      // 当前使用的植物规则
      currentRule: "",
      // 所有植物规则列表
      allRules: [],
      // 加载状态
      loading: false,
      // 语音助手对话历史
      chatMessages: [],
      // 接口请求状态
      requestStatus: {
        success: false,
        message: ""
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
        state.chatMessages.push({ role, content, time: (/* @__PURE__ */ new Date()).toLocaleTimeString() });
      },
      // 更新请求状态
      updateRequestStatus(state, { success, message }) {
        state.requestStatus = { success, message };
        setTimeout(() => {
          state.requestStatus = { success: false, message: "" };
        }, 3e3);
      }
    },
    actions: {
      // 初始化应用数据
      async initApp({ dispatch }) {
        await dispatch("fetchCurrentMode");
        await dispatch("fetchAllDevicesStatus");
        await dispatch("fetchCurrentRule");
        await dispatch("fetchAllRules");
      },
      // 获取所有设备状态 (新增静默参数)
      async fetchAllDevicesStatus({ commit }, silent = false) {
        if (!silent) {
          commit("setLoading", true);
        }
        try {
          const deviceTypes = ["pump", "nitrogen", "phosphorus", "potassium"];
          for (const device of deviceTypes) {
            const response = await api.getDeviceStatus(device);
            if (response.code === 0) {
              commit("updateDeviceStatus", { device, status: response.data.status });
            }
          }
        } catch (error) {
          formatAppLog("error", "at store/index.js:90", "获取设备状态失败", error);
          if (!silent) {
            commit("updateRequestStatus", { success: false, message: "获取设备状态失败" });
          }
        } finally {
          if (!silent) {
            commit("setLoading", false);
          }
        }
      },
      // 获取指定设备状态 (新增静默参数)
      async fetchDeviceStatus({ commit }, { device, silent = false }) {
        if (!silent) {
          commit("setLoading", true);
        }
        try {
          const response = await api.getDeviceStatus(device);
          if (response.code === 0) {
            commit("updateDeviceStatus", { device, status: response.data.status });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:114", `获取${device}状态失败`, error);
          if (!silent) {
            commit("updateRequestStatus", { success: false, message: `获取${device}状态失败` });
          }
          throw error;
        } finally {
          if (!silent) {
            commit("setLoading", false);
          }
        }
      },
      // 设置设备状态
      async setDeviceStatus({ commit, state }, { device, status }) {
        if (state.currentMode === "auto") {
          commit("updateRequestStatus", { success: false, message: "自动模式下无法手动控制设备" });
          return;
        }
        commit("setLoading", true);
        try {
          const response = await api.setDeviceStatus(device, status);
          if (response.code === 0) {
            let success = false;
            let message = "";
            if (status === "on" && (response.data.set_on === 1 || response.data.set_on === 2)) {
              success = true;
              message = response.data.set_on === 2 ? "设备已处于开启状态" : "设备开启成功";
              commit("updateDeviceStatus", { device, status: "on" });
            } else if (status === "off" && (response.data.set_off === 1 || response.data.set_off === 2)) {
              success = true;
              message = response.data.set_off === 2 ? "设备已处于关闭状态" : "设备关闭成功";
              commit("updateDeviceStatus", { device, status: "off" });
            } else {
              message = "设置失败";
            }
            commit("updateRequestStatus", { success, message });
          } else {
            commit("updateRequestStatus", { success: false, message: response.message || "设置失败" });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:161", `设置${device}状态失败`, error);
          commit("updateRequestStatus", { success: false, message: `设置${device}状态失败` });
          throw error;
        } finally {
          commit("setLoading", false);
        }
      },
      // 获取当前模式 (新增静默参数)
      async fetchCurrentMode({ commit }, silent = false) {
        if (!silent) {
          commit("setLoading", true);
        }
        try {
          const response = await api.getCurrentMode();
          if (response.code === 0) {
            commit("updateCurrentMode", response.data.mod);
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:182", "获取当前模式失败", error);
          if (!silent) {
            commit("updateRequestStatus", { success: false, message: "获取当前模式失败" });
          }
          throw error;
        } finally {
          if (!silent) {
            commit("setLoading", false);
          }
        }
      },
      // 设置当前模式
      async setMode({ commit }, mode) {
        commit("setLoading", true);
        try {
          const response = await api.setMode(mode);
          if (response.code === 0) {
            let success = false;
            let message = "";
            if (response.data.setMod === 1 || response.data.setMod === 2) {
              success = true;
              message = response.data.setMod === 2 ? `已处于${mode === "auto" ? "自动" : "手动"}模式` : `切换到${mode === "auto" ? "自动" : "手动"}模式成功`;
              commit("updateCurrentMode", mode);
            } else {
              message = "模式设置失败";
            }
            commit("updateRequestStatus", { success, message });
          } else {
            commit("updateRequestStatus", { success: false, message: response.message || "模式设置失败" });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:218", "设置模式失败", error);
          commit("updateRequestStatus", { success: false, message: "设置模式失败" });
          throw error;
        } finally {
          commit("setLoading", false);
        }
      },
      // 获取当前植物规则 (新增静默参数)
      async fetchCurrentRule({ commit }, silent = false) {
        if (!silent) {
          commit("setLoading", true);
        }
        try {
          const response = await api.getCurrentRule();
          if (response.code === 0) {
            commit("updateCurrentRule", response.data.rules);
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:239", "获取当前规则失败", error);
          if (!silent) {
            commit("updateRequestStatus", { success: false, message: "获取当前规则失败" });
          }
          throw error;
        } finally {
          if (!silent) {
            commit("setLoading", false);
          }
        }
      },
      // 设置植物规则
      async setRule({ commit }, rule) {
        commit("setLoading", true);
        try {
          const response = await api.setRule(rule);
          if (response.code === 0) {
            let success = false;
            let message = "";
            if (response.data.setRules === 1 || response.data.setRules === 2) {
              success = true;
              message = response.data.setRules === 2 ? `已使用"${rule}"规则` : `切换到"${rule}"规则成功`;
              commit("updateCurrentRule", rule);
            } else {
              message = "规则设置失败";
            }
            commit("updateRequestStatus", { success, message });
          } else {
            commit("updateRequestStatus", { success: false, message: response.message || "规则设置失败" });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:275", "设置规则失败", error);
          commit("updateRequestStatus", { success: false, message: "设置规则失败" });
          throw error;
        } finally {
          commit("setLoading", false);
        }
      },
      // 获取所有植物规则 (新增静默参数)
      async fetchAllRules({ commit }, silent = false) {
        if (!silent) {
          commit("setLoading", true);
        }
        try {
          const response = await api.getAllRules();
          if (response.code === 0) {
            commit("updateAllRules", response.data);
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:296", "获取所有规则失败", error);
          if (!silent) {
            commit("updateRequestStatus", { success: false, message: "获取所有规则失败" });
          }
          throw error;
        } finally {
          if (!silent) {
            commit("setLoading", false);
          }
        }
      },
      // 添加新植物规则
      async addRule({ commit, dispatch }, ruleData) {
        commit("setLoading", true);
        try {
          const response = await api.addRule(ruleData);
          if (response.code === 0) {
            commit("updateRequestStatus", { success: true, message: "添加规则成功" });
            await dispatch("fetchAllRules");
          } else {
            let message = "添加规则失败";
            if (response.code === 2) {
              message = "该植物规则已存在";
            } else if (response.code === 3) {
              message = "起始时间不能大于结束时间";
            }
            commit("updateRequestStatus", { success: false, message });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:329", "添加规则失败", error);
          commit("updateRequestStatus", { success: false, message: "添加规则失败" });
          throw error;
        } finally {
          commit("setLoading", false);
        }
      },
      // 发送AI消息
      async sendAIMessage({ commit }, message) {
        commit("addChatMessage", { role: "user", content: message });
        commit("setLoading", true);
        try {
          const response = await api.sendMessage(message);
          if (response.code === 0) {
            commit("addChatMessage", { role: "assistant", content: response.data.content });
            try {
              const jsonContent = response.data.content;
              const functionData = JSON.parse(jsonContent);
              if (functionData.function_name === "set_device_status") {
                const { device, status } = functionData.parameters;
                if (Array.isArray(device)) {
                  commit("addChatMessage", {
                    role: "system",
                    content: `正在执行批量${status === "on" ? "开启" : "关闭"}设备操作...`
                  });
                } else {
                  commit("addChatMessage", {
                    role: "system",
                    content: `正在${status === "on" ? "开启" : "关闭"}${device}...`
                  });
                }
              }
            } catch (e) {
            }
          } else {
            commit("updateRequestStatus", { success: false, message: "发送消息失败" });
          }
          return response;
        } catch (error) {
          formatAppLog("error", "at store/index.js:380", "发送消息失败", error);
          commit("updateRequestStatus", { success: false, message: "发送消息失败" });
          throw error;
        } finally {
          commit("setLoading", false);
        }
      }
    },
    getters: {
      // 是否处于自动模式
      isAutoMode: (state) => state.currentMode === "auto",
      // 获取设备状态列表
      deviceList: (state) => {
        return Object.entries(state.devices).map(([key, value]) => {
          const nameMap = {
            pump: "水泵",
            nitrogen: "氮肥",
            phosphorus: "磷肥",
            potassium: "钾肥"
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
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(store);
    app.config.globalProperties.$autoAdjustStatusBar = false;
    app.config.errorHandler = (err, vm, info) => {
      formatAppLog("error", "at main.js:16", "应用错误:", err, info);
    };
    app.config.globalProperties.$setFullScreen = () => {
      if (typeof plus !== "undefined") {
        plus.navigator.setFullscreen(true);
        const currentWebview = plus.webview.currentWebview();
        if (currentWebview) {
          currentWebview.setStyle({
            popGesture: "none",
            background: "#051020"
          });
        }
        if (plus.os.name.toLowerCase() === "android") {
          try {
            const window2 = plus.android.runtimeMainActivity().getWindow();
            const View = plus.android.importClass("android.view.View");
            const decorView = window2.getDecorView();
            const flags = 2 | // SYSTEM_UI_FLAG_HIDE_NAVIGATION
            4 | // SYSTEM_UI_FLAG_FULLSCREEN
            4096 | // SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            256 | // SYSTEM_UI_FLAG_LAYOUT_STABLE
            512 | // SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            1024;
            decorView.setSystemUiVisibility(flags);
          } catch (e) {
            formatAppLog("error", "at main.js:50", "Android全屏设置失败:", e);
          }
        }
      }
    };
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
