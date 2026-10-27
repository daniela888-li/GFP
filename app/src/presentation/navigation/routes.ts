export type RouteInfo = {
  title: string;
  story: string;
  stage: string;
};

export const ROUTES = {
  login: { title: 'Iniciar sesion', story: 'HU2', stage: '04' },
  registration: { title: 'Registro de usuario', story: 'HU1', stage: '03' },
  passwordRecovery: {
    title: 'Recuperar contrasena',
    story: 'HU3',
    stage: '05',
  },
  categories: { title: 'Categorias', story: 'HU8', stage: '06' },
  movementForm: { title: 'Registro de movimiento', story: 'HU4', stage: '07' },
  movementHistory: {
    title: 'Historial de movimientos',
    story: 'HU5 y HU6',
    stage: '08 y 09',
  },
  receiptCapture: {
    title: 'Movimiento con foto',
    story: 'HU7',
    stage: '10',
  },
  financialAnalysis: {
    title: 'Analisis financiero',
    story: 'HU9',
    stage: '11',
  },
  recommendations: { title: 'Recomendaciones', story: 'HU10', stage: '12' },
} as const satisfies Record<string, RouteInfo>;

export type RouteName = keyof typeof ROUTES;

export const INITIAL_ROUTE: RouteName = 'login';
