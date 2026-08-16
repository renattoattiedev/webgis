import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminRoutesService {
  private componentSource = new BehaviorSubject<Type<any> | null>(null);
  public component$ = this.componentSource.asObservable();

  public setComponent(component: Type<any>) {
    this.componentSource.next(component);
  }
}
