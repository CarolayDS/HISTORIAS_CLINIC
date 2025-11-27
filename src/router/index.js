import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../supabase";

const routes = [
  {
    path: "/",
    name: "Login",
    component: () => import("../views/login_register.vue")
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("../views/home.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/dashboard.vue"),
    meta: { requiresAuth: true }
  },

  {
    path: "/ia",
    name: "ia",
    component: () => import("../views/ia.vue"),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de autenticación
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (to.meta.requiresAuth && !session) {
    return next({ name: 'Login' });
  }
  
  if (to.name === 'Login' && session) {
    return next({ name: 'Home' });
  }
  
  next();
});

export default router;