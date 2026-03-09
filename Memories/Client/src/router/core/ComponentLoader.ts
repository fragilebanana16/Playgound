/**
 * 组件加载器
 *
 * 负责动态加载 Vue 组件
 *
 * @module router/core/ComponentLoader
 * @author Art Design Pro Team
 */

import { h } from 'vue'

export class ComponentLoader {
  private modules: Record<string, () => Promise<any>>

  constructor() {
    // 动态导入 views 目录下所有 .vue 组件
    this.modules = import.meta.glob('../../views/**/*.vue')
  }

  /**
   * 加载组件
   */
  load(componentPath: string | (() => Promise<any>)): () => Promise<any> {
    // 如果传的是函数，直接返回
    if (typeof componentPath === 'function') {
      return componentPath
    }
  
    if (!componentPath) {
      return this.createEmptyComponent()
    }
  
    const fullPath = `../../views${componentPath}.vue`
    const fullPathWithIndex = `../../views${componentPath}/index.vue`
    const module = this.modules[fullPath] || this.modules[fullPathWithIndex]
  
    if (!module) {
      console.error(`[ComponentLoader] 未找到组件: ${componentPath}`)
      return this.createErrorComponent(componentPath)
    }
  
    return module
  }

  /**
   * 加载布局组件
   */
  loadLayout(): () => Promise<any> {
    return () => import('@/views/index/index.vue')
  }

  /**
   * 加载 iframe 组件
   */
  loadIframe(): () => Promise<any> {
    return () => import('@/views/outside/Iframe.vue')
  }

  /**
   * 创建空组件
   */
  private createEmptyComponent(): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', {})
        }
      })
  }

  /**
   * 创建错误提示组件
   */
  private createErrorComponent(componentPath: string): () => Promise<any> {
    return () =>
      Promise.resolve({
        render() {
          return h('div', { class: 'route-error' }, `组件未找到: ${componentPath}`)
        }
      })
  }
}
