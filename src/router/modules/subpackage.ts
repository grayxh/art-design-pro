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
    }
  ]
}
