import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

// Props espelham o modelo Prisma `UserPreference`
export interface UserPreferenceProps {
  COD_USER_ID: string;
  SELECTED_LAYERS?: any;
  ZOOM?: number | null;
  CENTER_X?: number | null;
  EXTENT?: any;
  DHS_INCLUSAO: Date | string;
  DHS_ULTIMA_ALTERACAO?: Date | string | null;
}

export class UserPreference extends AggregateRoot<UserPreferenceProps> {
  get userPreferenceId() {
    return this.id.toString();
  }

  get userId() {
    return this.props.COD_USER_ID;
  }

  setUserId(userId: string) {
    this.props.COD_USER_ID = userId;
  }

  get selectedLayers() {
    return this.props.SELECTED_LAYERS ?? null;
  }

  setSelectedLayers(layers: any) {
    this.props.SELECTED_LAYERS = layers ?? null;
  }

  get zoom() {
    return this.props.ZOOM ?? null;
  }

  setZoom(zoom: number | null) {
    this.props.ZOOM = zoom ?? null;
  }

  get centerX() {
    return this.props.CENTER_X ?? null;
  }

  setCenterX(centerX: number | null) {
    this.props.CENTER_X = centerX ?? null;
  }

  get extent() {
    return this.props.EXTENT ?? null;
  }

  setExtent(extent: any) {
    this.props.EXTENT = extent ?? null;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO ?? null;
  }

  setUpdatedAt(date: Date | string | null) {
    this.props.DHS_ULTIMA_ALTERACAO = date;
  }

  static create(props: UserPreferenceProps, id?: UniqueEntityID) {
    const pref = new UserPreference(
      {
        ...props,
        DHS_INCLUSAO: props.DHS_INCLUSAO ?? new Date(),
      },
      id,
    );
    return pref;
  }
}
