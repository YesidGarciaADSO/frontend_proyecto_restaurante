import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
})
export class Login {
  // Modos de acceso: 'login' | 'recuperar'
  modo: 'login' | 'recuperar' = 'login';

  // Credenciales de acceso
  correo = '';
  clave = '';
  verClave = false;

  // Campos para restablecer contraseña
  recCorreo = '';
  recNuevaClave = '';
  recConfirmarClave = '';

  // Mensajes de retroalimentación
  error = false;
  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  constructor(private slogin: LoginService, private router: Router) {
    if (this.slogin.estaAutenticado()) {
      this.router.navigate([this.slogin.obtenerRutaInicioPorRol()]);
    }
  }

  cambiarModo(nuevoModo: 'login' | 'recuperar'): void {
    this.modo = nuevoModo;
    this.error = false;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ==========================================
  // INICIO DE SESIÓN INSTITUCIONAL
  // ==========================================
  onLogin(): void {
    if (!this.correo.trim() || !this.clave.trim()) {
      this.error = true;
      this.mensajeError = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.error = false;
    this.mensajeExito = '';

    this.slogin.login(this.correo.trim(), this.clave).subscribe({
      next: (resultado: any) => {
        this.cargando = false;
        if (resultado && resultado[0]?.validar === 'valida') {
          this.slogin.guardarSesion(resultado[0]);
          this.router.navigate([this.slogin.obtenerRutaInicioPorRol()]);
        } else {
          this.error = true;
          this.mensajeError = 'Usuario o contraseña incorrectos.';
        }
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'No se pudo conectar con el servidor.';
      }
    });
  }

  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ==========================================
  confirmarRecuperacion(): void {
    this.error = false;
    this.mensajeExito = '';

    if (!this.recCorreo.trim() || !this.recCorreo.includes('@')) {
      this.error = true;
      this.mensajeError = 'Ingresa un correo electrónico válido.';
      return;
    }

    if (!this.recNuevaClave.trim() || this.recNuevaClave.length < 6) {
      this.error = true;
      this.mensajeError = 'La nueva contraseña debe tener mínimo 6 caracteres.';
      return;
    }

    if (this.recNuevaClave !== this.recConfirmarClave) {
      this.error = true;
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    this.slogin.recuperarClave(this.recCorreo.trim(), this.recNuevaClave).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res && res.resultado === 'ERROR') {
          this.error = true;
          this.mensajeError = res.mensaje || 'No se encontró la cuenta asociada.';
          return;
        }
        this.correo = this.recCorreo.trim();
        this.clave = '';
        this.recCorreo = '';
        this.recNuevaClave = '';
        this.recConfirmarClave = '';
        this.modo = 'login';
        this.mensajeExito = '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.';
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'No se pudo actualizar la contraseña.';
      }
    });
  }
}
