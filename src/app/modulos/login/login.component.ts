import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
})
export class Login {
  correo = '';
  clave = '';
  error = false;
  cargando = false;

  constructor(private slogin: LoginService, private router: Router) {
    if (this.slogin.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    if (!this.correo || !this.clave) {
      this.error = true;
      return;
    }

    this.cargando = true;
    this.error = false;

    this.slogin.login(this.correo, this.clave).subscribe({
      next: (resultado: any) => {
        this.cargando = false;
        if (resultado && resultado[0]?.validar === 'valida') {
          this.slogin.guardarSesion(resultado[0]);
          this.router.navigate(['/dashboard']);
        } else {
          this.error = true;
        }
      },
      error: () => {
        this.cargando = false;
        this.error = true;
      }
    });
  }
}
