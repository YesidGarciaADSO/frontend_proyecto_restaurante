import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from './header/header.component';
import { SidebarComponent } from './nav/sidebar.component';
import { Footer } from './footer/footer.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterModule, Header, SidebarComponent, Footer],
  templateUrl: './main.component.html',
})
export class Main {}
