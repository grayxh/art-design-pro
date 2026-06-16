import { AppRouteRecord } from '@/types/router'

export const subpackageRoutes: AppRouteRecord = {
  path: '/subpackage',
  name: 'Subpackage',
  component: '/index/index',
  meta: {
    title: 'menus.subpackage.title',
    icon: 'ri:box-3-line',
    keepAlive: false
  },
  children: [
    {
      path: 'list',
      name: 'SubpackageList',
      component: '/subpackage/index',
      meta: {
        title: 'menus.subpackage.list',
        icon: 'ri:list-check-3',
        keepAlive: true
      }
    },
    {
      path: 'company',
      name: 'SubpackageCompany',
      component: '/subpackage/company',
      meta: {
        title: 'menus.subpackage.company',
        icon: 'ri:building-2-line',
        keepAlive: true
      }
    },
    {
      path: 'personnel',
      name: 'SubpackagePersonnel',
      component: '/subpackage/personnel',
      meta: {
        title: 'menus.subpackage.personnel',
        icon: 'ri:group-line',
        keepAlive: true
      }
    },
    {
      path: 'settings',
      name: 'SubpackageSettings',
      component: '',
      meta: {
        title: 'menus.subpackage.settings',
        icon: 'ri:settings-3-line',
        keepAlive: true
      },
      children: [
        {
          path: 'dict',
          name: 'SubpackageDict',
          component: '/subpackage/settings/dict',
          meta: {
            title: 'menus.subpackage.dict',
            icon: 'ri:book-2-line',
            keepAlive: true
          }
        },
        {
          path: 'file',
          name: 'SubpackageFile',
          component: '/subpackage/settings/file',
          meta: {
            title: 'menus.subpackage.file',
            icon: 'ri:file-list-3-line',
            keepAlive: true
          }
        }
      ]
    }
  ]
}
