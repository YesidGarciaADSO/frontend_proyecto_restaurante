import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

// Protege las rutas que necesitan login y valida los permisos segun el rol del empleado
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(LoginService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const urlDestino = state.url || '/dashboard';
  if (urlDestino === '/' || urlDestino === '') {
    router.navigate([authService.obtenerRutaInicioPorRol()]);
    return false;
  }

  if (!authService.tienePermisoRuta(urlDestino)) {
    router.navigate([authService.obtenerRutaInicioPorRol()]);
    return false;
  }

  return true;
};
