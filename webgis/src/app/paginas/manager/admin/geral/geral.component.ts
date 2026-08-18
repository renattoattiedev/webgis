import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of, Subscription } from 'rxjs';
import { Configs } from 'src/app/models/configs.model';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { UpdateConfigService } from 'src/app/services/api/update.config.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminRoutesService } from 'src/app/services/admin.routes.service';

@Component({
  selector: 'app-geral',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    NgFor,
    NgIf,
    MatProgressSpinnerModule,
  ],
  templateUrl: './geral.component.html',
  styleUrls: ['./geral.component.scss'],
})
export class GeralComponent implements OnInit, OnDestroy {
  configForm: FormGroup;
  configData: Configs[] = [];
  groupedConfigData: any[] = [];
  isLoading = false;

  private saveRequestSub?: Subscription;
  private dirtySub?: Subscription;

  expandedGroups = new Set<number>([0]);

  constructor(
    private fetchConfigService: FetchConfigsService,
    private fb: FormBuilder,
    private updateConfig: UpdateConfigService,
    private snackBar: MatSnackBar,
    private adminRoutesService: AdminRoutesService,
  ) {
    this.configForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadConfigs();

    this.saveRequestSub = this.adminRoutesService.geralSaveRequested$.subscribe(() => {
      this.configForm.markAsPristine();
      this.adminRoutesService.geralDirty$.next(false);
    });
  }

  ngOnDestroy(): void {
    this.saveRequestSub?.unsubscribe();
    this.dirtySub?.unsubscribe();
    this.adminRoutesService.geralDirty$.next(false);
  }

  loadConfigs(): void {
    this.isLoading = true;
    this.fetchConfigService
      .getConfigs()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar configurações:', error);
          this.snackBar.open('Erro ao carregar configurações', 'Fechar', {
            duration: 5000,
          });
          return of([]);
        }),
      )
      .subscribe((configs: Configs[]) => {
        if (configs) {
          this.configData = configs;
          this.groupedConfigData = this.groupConfigsByGroupOrder(
            this.configData,
          );
          this.buildForm();
          this.dirtySub?.unsubscribe();
          this.dirtySub = this.configForm.valueChanges.subscribe(() => {
            this.adminRoutesService.geralDirty$.next(this.configForm.dirty);
          });
        }
        this.isLoading = false;
      });
  }

  groupConfigsByGroupOrder(configs: any[]): any[] {
    const grouped = configs.reduce((groups, config) => {
      const group = groups.find(
        (g: { grupoOrder: any; grupoKey: any }) =>
          g.grupoOrder === config.grupoOrder && g.grupoKey === config.grupoKey,
      );
      if (group) {
        group.items.push(config);
      } else {
        groups.push({
          grupoOrder: config.grupoOrder,
          grupoKey: config.grupoKey,
          items: [config],
        });
      }
      return groups;
    }, []);

    grouped.forEach((group: { items: { keyOrder: number }[] }) => {
      group.items.sort(
        (a: { keyOrder: number }, b: { keyOrder: number }) =>
          a.keyOrder - b.keyOrder,
      );
    });

    return grouped.sort(
      (a: { grupoOrder: number }, b: { grupoOrder: number }) =>
        a.grupoOrder - b.grupoOrder,
    );
  }

  buildForm() {
    this.groupedConfigData.forEach((group) => {
      group.items.forEach((item: Configs) => {
        // 🆕 Usar displayValue ao invés de value para exibição
        const displayValue = item.displayValue || item.value || '';
        const control = this.fb.control({
          value: displayValue,
          disabled: !item.canEdit, // 🆕 Desabilitar se não pode editar
        });

        this.configForm.addControl(item.key, control);

        // 🆕 Só adicionar listener se pode editar
        if (item.canEdit) {
          control.valueChanges.subscribe((newValue) => {
            this.saveConfig(item, newValue);
          });
        }
      });
    });
  }

  // 🆕 Método para editar configuração sensível
  async editSensitiveConfig(item: Configs): Promise<void> {
    if (!item.isSensitive || !item.canEdit) return;

    try {
      // Buscar valor real para edição
      const configForEdit = await this.fetchConfigService
        .getConfigForEdit(item.id)
        .toPromise();

      if (configForEdit) {
        // Atualizar o form control com o valor real
        const control = this.configForm.get(item.key);
        if (control) {
          control.setValue(configForEdit.value);
          control.enable();

          // Mostrar aviso
          this.snackBar.open(
            `⚠️ Editando configuração sensível: ${item.key}. Mantenha sigilo!`,
            'OK',
            { duration: 5000 },
          );
        }
      }
    } catch (error: any) {
      this.snackBar.open(
        error.message || 'Erro ao carregar configuração para edição',
        'Fechar',
        { duration: 5000 },
      );
    }
  }

  saveConfig(item: Configs, value: any) {
    if (!item.canEdit) {
      this.snackBar.open(
        'Você não tem permissão para editar esta configuração',
        'Fechar',
        { duration: 3000 },
      );
      return;
    }

    // Criar uma cópia atualizada da configuração
    const configToUpdate = { ...item, value };

    this.updateConfig.updateConfig(configToUpdate).subscribe({
      next: () => {
        const message = item.isSensitive
          ? `🔒 Configuração sensível ${item.key} atualizada com sucesso!`
          : `✅ Configuração ${item.key} salva com sucesso!`;

        this.snackBar.open(message, '', { duration: 3000 });

        // Recarregar configurações para pegar novos valores mascarados
        if (item.isSensitive) {
          this.loadConfigs();
        }
      },
      error: (error) => {
        console.error('Erro ao salvar configuração:', error);
        this.snackBar.open(`❌ Erro ao salvar ${item.key}`, 'Fechar', {
          duration: 5000,
        });
      },
    });
  }

  // 🆕 Verificar se item é sensível e não editável
  isSensitiveAndLocked(item: Configs): boolean {
    return item.isSensitive && !item.canEdit;
  }

  // 🆕 Verificar se item é sensível mas editável
  isSensitiveAndEditable(item: Configs): boolean {
    return item.isSensitive && item.canEdit;
  }

  // Grupos colapsáveis (mobile) — só o primeiro grupo abre por padrão.
  isGroupExpanded(index: number): boolean {
    return this.expandedGroups.has(index);
  }

  toggleGroup(index: number): void {
    if (this.expandedGroups.has(index)) {
      this.expandedGroups.delete(index);
    } else {
      this.expandedGroups.add(index);
    }
  }
}
