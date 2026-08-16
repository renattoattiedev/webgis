import { Injectable } from '@nestjs/common';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';

export interface GrupoAccessContext {
  userId: string | null;
  isAdmin: boolean;
  /** ids de grupos com vínculo ativo status 'membro' */
  gruposMembro: Set<string>;
  /** todos os grupos ativos, indexados por id */
  grupos: Map<string, Grupo>;
}

@Injectable()
export class GrupoAccessPolicy {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
  ) {}

  async buildContext(
    userId: string | null,
    perfil: string | null,
  ): Promise<GrupoAccessContext> {
    const gruposAtivos = await this.grupoRepository.findManyAtivos();
    const grupos = new Map(gruposAtivos.map((g) => [g.id.toString(), g]));

    const gruposMembro = new Set<string>();
    if (userId) {
      const vinculos = await this.grupoMembrosRepository.findManyByUser(userId);
      for (const vinculo of vinculos) {
        if (vinculo.status === 'membro') {
          gruposMembro.add(vinculo.grupoId);
        }
      }
    }

    return { userId, isAdmin: perfil === 'Admin', gruposMembro, grupos };
  }

  isMembro(ctx: GrupoAccessContext, grupo: Grupo): boolean {
    if (!ctx.userId) return false;
    return (
      grupo.grupoDono === ctx.userId ||
      ctx.gruposMembro.has(grupo.id.toString())
    );
  }

  canViewGrupo(ctx: GrupoAccessContext, grupo: Grupo): boolean {
    if (ctx.isAdmin || this.isMembro(ctx, grupo)) return true;
    if (!ctx.userId) return false;
    return grupo.grupoVisibilidade !== 'membros';
  }

  canViewInstitucional(ctx: GrupoAccessContext, grupo: Grupo): boolean {
    if (!ctx.userId) return false;
    if (ctx.isAdmin || this.isMembro(ctx, grupo)) return true;
    return grupo.grupoVisibilidade !== 'membros';
  }

  canViewInstitucionalByGrupoId(
    ctx: GrupoAccessContext,
    grupoId: string,
  ): boolean {
    const grupo = ctx.grupos.get(grupoId);
    if (!grupo) return ctx.isAdmin;
    return this.canViewInstitucional(ctx, grupo);
  }

  /** Decide se um item de conteúdo do nível informado é visível para o usuário do contexto. */
  canViewItemByNivel(
    ctx: GrupoAccessContext,
    nivel: string,
    grupoId: string,
    idUsrCriacao: string,
  ): boolean {
    switch (nivel) {
      case 'Público':
        return true;
      case 'Institucional':
        return this.canViewInstitucionalByGrupoId(ctx, grupoId);
      case 'Privado':
        return (
          ctx.isAdmin || (ctx.userId !== null && ctx.userId === idUsrCriacao)
        );
      default:
        return false;
    }
  }

  /** Soma quantos itens do breakdown por nível o usuário do contexto efetivamente vê. */
  contarItensVisiveis(
    ctx: GrupoAccessContext,
    grupo: Grupo,
    contagens: {
      publico: number;
      institucional: number;
      privadoTotal: number;
      privadoCriador: number;
    },
  ): number {
    const institucionalVisivel = this.canViewInstitucional(ctx, grupo)
      ? contagens.institucional
      : 0;
    const privadoVisivel = ctx.isAdmin
      ? contagens.privadoTotal
      : contagens.privadoCriador;
    return contagens.publico + institucionalVisivel + privadoVisivel;
  }

  canEditGroupContent(
    ctx: GrupoAccessContext,
    grupo: Grupo,
    itemCreatorId: string,
  ): boolean {
    if (ctx.isAdmin) return true;
    if (!ctx.userId) return false;
    if (grupo.grupoDono === ctx.userId) return true;
    if (itemCreatorId === ctx.userId) return true;
    return (
      grupo.grupoMembrosContribuem && ctx.gruposMembro.has(grupo.id.toString())
    );
  }

  canEditGroupContentByGrupoId(
    ctx: GrupoAccessContext,
    grupoId: string,
    itemCreatorId: string,
  ): boolean {
    const grupo = ctx.grupos.get(grupoId);
    if (!grupo) return ctx.isAdmin;
    return this.canEditGroupContent(ctx, grupo, itemCreatorId);
  }

  canManageGrupo(ctx: GrupoAccessContext, grupo: Grupo): boolean {
    if (ctx.isAdmin) return true;
    return ctx.userId !== null && grupo.grupoDono === ctx.userId;
  }

  /** Decide se o solicitante pode publicar/salvar/mover conteúdo para o grupo informado. Admin sempre pode; demais perfis só se forem membro (ou dono) do grupo. */
  canAssignToGrupo(ctx: GrupoAccessContext, grupoId: string): boolean {
    if (ctx.isAdmin) return true;
    const grupo = ctx.grupos.get(grupoId);
    if (!grupo) return false;
    return this.isMembro(ctx, grupo);
  }

  /** Checagem pontual para um único grupo, sem carregar todos os grupos (rotas de alto tráfego). */
  async canViewInstitucionalForGrupo(
    userId: string | null,
    perfil: string | null,
    grupoId: string,
  ): Promise<boolean> {
    if (!userId) return false;
    if (perfil === 'Admin') return true;
    const grupo = await this.grupoRepository.findById(grupoId);
    if (!grupo) return false;
    if (grupo.grupoDono === userId) return true;
    const vinculo = await this.grupoMembrosRepository.findByGrupoAndUser(
      grupoId,
      userId,
    );
    if (vinculo && vinculo.ativo && vinculo.status === 'membro') return true;
    return grupo.grupoVisibilidade !== 'membros';
  }
}
