/**
 * 第三方库类型声明补充
 *
 * 部分依赖的 package.json `exports` 未暴露类型入口（或暴露的入口没有
 * 对应的 .d.ts），在 `moduleResolution: bundler` 下 TypeScript 无法自动
 * 解析到它们的类型，这里统一补齐最小可用声明。
 *
 * 如果依赖后续修复了类型入口，删除对应声明即可。
 */

declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'

  /** 富文本编辑器组件 */
  export const Editor: DefineComponent<any, any, any>
  /** 编辑器工具栏组件 */
  export const Toolbar: DefineComponent<any, any, any>
}
