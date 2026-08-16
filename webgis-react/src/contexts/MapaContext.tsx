// GEO Portal — MapaContext (portado do MapaService do Angular)
// Substitui o MapaService + rxjs por React Context. Mantém o Map do OpenLayers
// como singleton e expõe estado derivado (basemap, escala, identify, swipe).

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type Map from 'ol/Map';
import type ImageSource from 'ol/source/Image';
import ImageLayer from 'ol/layer/Image';

type AnyImageLayer = ImageLayer<ImageSource>;
type SwipeState = { enabled: boolean; position?: number };

interface MapaContextValue {
  setMapa: (mapa: Map | null) => void;
  getMapa: () => Map | null;
  mapa: Map | null;
  // Estado derivado
  basemapUrl: string | null;
  setBasemapUrl: (url: string | null) => void;
  escala: number;
  setEscala: (n: number) => void;
  identifyEnabled: boolean;
  setIdentifyEnabled: Dispatch<SetStateAction<boolean>>;
  swipe: SwipeState;
  setSwipe: Dispatch<SetStateAction<SwipeState>>;
  manualZoom: boolean;
  setManualZoom: Dispatch<SetStateAction<boolean>>;
}

const MapaContext = createContext<MapaContextValue | null>(null);

export function MapaProvider({ children }: { children: ReactNode }) {
  // ref para não recriar o Map em cada render e expor getMapa estável
  const mapaRef = useRef<Map | null>(null);
  const [mapa, setMapaState] = useState<Map | null>(null);
  const [basemapUrl, setBasemapUrl] = useState<string | null>(null);
  const [escala, setEscala] = useState<number>(900000);
  const [identifyEnabled, setIdentifyEnabled] = useState(true);
  const [swipe, setSwipe] = useState<SwipeState>({ enabled: false });
  const [manualZoom, setManualZoom] = useState(false);

  const setMapa = useCallback((m: Map | null) => {
    mapaRef.current = m;
    setMapaState(m);
  }, []);

  const getMapa = useCallback(() => mapaRef.current, []);

  return (
    <MapaContext.Provider
      value={{
        setMapa,
        getMapa,
        mapa,
        basemapUrl,
        setBasemapUrl,
        escala,
        setEscala,
        identifyEnabled,
        setIdentifyEnabled,
        swipe,
        setSwipe,
        manualZoom,
        setManualZoom,
      }}
    >
      {children}
    </MapaContext.Provider>
  );
}

export function useMapa(): MapaContextValue {
  const ctx = useContext(MapaContext);
  if (!ctx) {
    throw new Error('useMapa deve ser usado dentro de <MapaProvider>');
  }
  return ctx;
}

export function getAvailableLayers(mapa: Map): AnyImageLayer[] {
  return mapa
    .getLayers()
    .getArray()
    .filter((layer): layer is AnyImageLayer => layer instanceof ImageLayer);
}