import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminRoutesService {
  private componentSource = new BehaviorSubject<Type<any> | null>(null);
  public component$ = this.componentSource.asObservable();

  // Ponte usada pelo header mobile do admin (3B) para habilitar/disparar o
  // "Salvar" do GeralComponent sem acesso direto à instância criada via
  // *ngComponentOutlet.
  public geralDirty$ = new BehaviorSubject<boolean>(false);
  public geralSaveRequested$ = new Subject<void>();

  public setComponent(component: Type<any>) {
    this.componentSource.next(component);
  }
}
