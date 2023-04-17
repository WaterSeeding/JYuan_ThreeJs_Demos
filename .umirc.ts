import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '@umijs/max',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: 'CRUD 示例',
      path: '/table',
      component: './Table',
    },
    {
      name: 'DEMO 示例',
      path: '/demo',
      component: './Demo',
      layout: false,
    },
    {
      name: 'Line 示例',
      path: '/line',
      component: './Line',
      layout: false,
    },
    {
      name: ' Sun 示例',
      path: '/sun',
      component: './Sun',
      layout: false,
    },
    {
      name: ' Sun 示例',
      path: '/sun',
      component: './Sun',
      layout: false,
    },
    {
      name: ' Bloom 示例',
      path: '/bloom',
      component: './Bloom',
      layout: false,
    },
    {
      name: ' UnrealBloom 示例',
      path: '/unrealBloom',
      component: './UnrealBloom',
      layout: false,
    },
    {
      name: ' CircularCoil 示例',
      path: '/circularCoil',
      component: './CircularCoil',
      layout: false,
    },
    {
      name: ' Composer 示例',
      path: '/composer',
      component: './Composer',
      layout: false,
    },
    {
      name: ' Outline 示例',
      path: '/outline',
      component: './Outline',
      layout: false,
    },
    {
      name: ' Isolychn 示例',
      path: '/isolychn',
      component: './Isolychn',
      layout: false,
    },
    {
      name: ' Plane 示例',
      path: '/plane',
      component: './Plane',
      layout: false,
    },
  ],
  npmClient: 'pnpm',
});
