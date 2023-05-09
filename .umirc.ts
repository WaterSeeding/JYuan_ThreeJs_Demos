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
      name: ' Earth 示例',
      path: '/earth',
      component: './Earth',
      layout: false,
    },
    {
      name: ' EarthPixel 示例',
      path: '/earthPixel',
      component: './EarthPixel',
      layout: false,
    },
    {
      name: ' EarthVector 示例',
      path: '/earthVector',
      component: './EarthVector',
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
    {
      name: 'LineSvg 示例',
      path: '/lineSvg',
      component: './LineSvg',
      layout: false,
    },
    {
      name: 'LineWidth 示例',
      path: '/lineWidth',
      component: './LineWidth',
      layout: false,
    },
    {
      name: 'LineData 示例',
      path: '/lineData',
      component: './LineData',
      layout: false,
    },
    {
      name: 'Svg 示例',
      path: '/svg',
      component: './Svg',
      layout: false,
    },
  ],
  npmClient: 'pnpm',
});
