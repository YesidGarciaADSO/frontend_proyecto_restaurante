import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App implements OnInit {
  title = 'frontend';
  private http = inject(HttpClient);

  ngOnInit(): void {
    if (!sessionStorage.getItem('bd_migrada_v3')) {
      this.http.get('https://fastfood-os.site.je/backend/actualizar_bd.php').subscribe({
        next: () => sessionStorage.setItem('bd_migrada_v3', '1'),
        error: () => {}
      });
    }
  }
}
