import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticateService } from '../../../services/api/authenticate.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `<p style="text-align:center; margin-top: 40px;">Entrando...</p>`,
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthenticateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      this.authService.errorMessage =
        'Falha ao concluir o login com Microsoft. Tente novamente.';
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.authService.completeEntraLogin(code).subscribe((success) => {
      if (success) {
        const urlIntended = this.authService.getUrlIntended();
        this.router.navigateByUrl(urlIntended, { replaceUrl: true });
        return;
      }

      this.router.navigateByUrl('/login', { replaceUrl: true });
    });
  }
}
