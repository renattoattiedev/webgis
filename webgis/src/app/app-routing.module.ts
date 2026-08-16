import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './paginas/security/login/login.component';
import { WebgisComponent } from './paginas/webgis/webgis.component';
import { AuthGuard } from './guard/auth.guard';
import { IndexComponent } from './paginas/index/index.component';
import { ContentComponent } from './paginas/manager/content/content.component';
import { RegisterUserComponent } from './paginas/security/register-user/register-user.component';
import { RecoveryPasswordComponent } from './paginas/security/recovery-password/recovery-password.component';
import { ResetPasswordComponent } from './paginas/security/reset-password/reset-password.component';
import { EmailVerificadoComponent } from './paginas/security/email-verificado/email-verificado.component';
import { DadosComponent } from './paginas/dados/dados.component';
import { AuthCallbackComponent } from './paginas/security/auth-callback/auth-callback.component';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register-user', component: RegisterUserComponent },
  { path: 'recovery-password', component: RecoveryPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'email-verified', component: EmailVerificadoComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'webgis', component: WebgisComponent },
  { path: 'dados', component: DadosComponent },
  {
    path: 'manager',
    component: ContentComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
