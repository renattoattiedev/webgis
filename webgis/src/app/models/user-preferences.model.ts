export interface SelectedLayerRef {
  id: string; // ID da camada ou mapa no backend
  grupoId: string; // ID do grupo ao qual pertence
  temaId: string; // ID do tema
  tipo?: 'V' | 'R' | 'M'; // Vetor, Raster, Mapa
}

export interface UserPreferenceDTO {
  id: string;
  userId: string;
  selectedLayers?: SelectedLayerRef[] | null;
  zoom?: number | null;
  centerX?: number | null; // could be X in projected CRS
  extent?: { minX: number; minY: number; maxX: number; maxY: number } | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface UserPreferenceResponse {
  preference: UserPreferenceDTO | null;
  success: boolean;
  message?: string;
}

export type CreateUserPreferencePayload = Partial<
  Pick<UserPreferenceDTO, 'selectedLayers' | 'zoom' | 'centerX' | 'extent'>
>;

export type UpdateUserPreferencePayload = CreateUserPreferencePayload; // same shape (partial)
