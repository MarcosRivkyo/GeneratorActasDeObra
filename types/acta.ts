export interface Asistente {
  nombre: string;
  cargo?: string;
  entidad?: string;
}

export interface Foto {
  id: string;
  url: string;
  pie?: string;
}

export interface Firmante {
  nombre: string;
  cargo?: string;
  firmaImagenUrl?: string;
}

export interface ActaObra {
  obra: {
    nombre?: string;
    situacion: {
      ubicacion?: string;
      callePortal?: string;
      cp?: string;
      provincia?: string;
      coordenadas?: string;
    };
    fechaISO: string; // ISO 8601
    numeroActa?: string;
  };
  asistentes: Asistente[];
  estadoObra: string;
  cuestionesTratadas: { titulo?: string; detalle: string }[];
  fotos: Foto[];
  firmas: Firmante[];
  notasAdicionales?: string;
}
