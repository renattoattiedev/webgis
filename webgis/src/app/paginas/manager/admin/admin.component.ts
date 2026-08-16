import { CommonModule } from '@angular/common';
import { Component, OnInit, Type } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AdminRoutesService } from 'src/app/services/admin.routes.service';
import { PacotesConceituaisComponent } from './pacotes-conceituais/pacotes-conceituais.component';
import { GruposComponent } from './grupos/grupos.component';
import { TemasComponent } from './temas/temas.component';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { Router } from '@angular/router';
import { GeralComponent } from './geral/geral.component';
import { ComponentesComponent } from './componentes/componentes.component';
import { BasemapsComponent } from './basemaps/basemaps.component';
import { MembersComponent } from '../members/members.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatNativeDateModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  isSidenavOpened = true;
  currentComponent: Type<any> | null = GeralComponent;

  PacotesConceituaisComponent = PacotesConceituaisComponent;
  TemasComponent = TemasComponent;
  GruposComponent = GruposComponent;
  GeralComponent = GeralComponent;
  ComponentesComponent = ComponentesComponent;
  BasemapsComponent = BasemapsComponent;
  MembersComponent = MembersComponent;

  isAdmin: boolean = false;

  constructor(
    private adminRoutesService: AdminRoutesService,
    private authService: AuthenticateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      return;
    }

    if (!this.currentComponent) {
      this.currentComponent = GeralComponent;
      this.adminRoutesService.setComponent(GeralComponent);
    }

    this.adminRoutesService.component$.subscribe((component: any) => {
      this.currentComponent = component;
    });
  }
  openComponent(component: Type<any>) {
    this.adminRoutesService.setComponent(component);
  }
}
