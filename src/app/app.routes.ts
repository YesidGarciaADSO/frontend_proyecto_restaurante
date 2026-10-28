import { Routes } from '@angular/router';
import { Main } from './estructura/main.component';
import { Dashboard } from './modulos/dashboard/dashboard.component';
import { ClientesComponent } from './modulos/clientes/clientes.component';
import { Pedidos } from './modulos/pedidos/pedidos.component';
import { VentasComponent } from './modulos/ventas/ventas.component';
import { Login } from './modulos/login/login.component';
import { CategoriaComponent } from './modulos/categorias/categorias.component';
import { ProductosComponent } from './modulos/productos/productos.component';
import { AjustesComponent } from './modulos/ajustes/ajustes.component';
import { UsuariosComponent } from './modulos/usuarios/usuarios.component';
import { DomiciliarioComponent } from './modulos/domiciliario/domiciliario.component';
import { PagosComponent } from './modulos/pagos/pagos.component';
import { ProveedorComponent } from './modulos/proveedores/proveedor.component';
import { InventarioComponent } from './modulos/inventario/inventario.component';
import { NoEncontro } from './modulos/no-encontro/no-encontro.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: Login },

    {
        path: '',
        component: Main,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'clientes', component: ClientesComponent },
            { path: 'pedidos', component: Pedidos },
            { path: 'productos', component: ProductosComponent },
            { path: 'ventas', component: VentasComponent },
            { path: 'categorias', component: CategoriaComponent },
            { path: 'ajustes', component: AjustesComponent },
            { path: 'usuarios', component: UsuariosComponent },
            { path: 'domiciliario', component: DomiciliarioComponent },
            { path: 'pagos', component: PagosComponent },
            { path: 'proveedores', component: ProveedorComponent },
            { path: 'inventario', component: InventarioComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
    },

    { path: '**', component: NoEncontro },
];
