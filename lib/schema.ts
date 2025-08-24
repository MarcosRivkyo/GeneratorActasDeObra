// JSON Schema para Structured Outputs
export const actaJsonSchema = {
  name: "acta_obra_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      obra: {
        type: "object",
        additionalProperties: false,
        properties: {
          nombre: { type: "string" },
          situacion: {
            type: "object",
            additionalProperties: false,
            properties: {
              ubicacion: { type: "string" },
              callePortal: { type: "string" },
              cp: { type: "string" },
              provincia: { type: "string" },
              coordenadas: { type: "string" }
            },
            required: ["ubicacion", "callePortal", "cp", "provincia", "coordenadas"] 
          },
          fechaISO: { type: "string" },
          numeroActa: { type: "string" }
        },
        required: ["nombre", "situacion", "fechaISO", "numeroActa"] 
      },
      asistentes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            nombre: { type: "string" },
            cargo: { type: "string" },
            entidad: { type: "string" }
          },
          required: ["nombre", "cargo", "entidad"] 
        }
      },
      estadoObra: { type: "string" },
      cuestionesTratadas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            titulo: { type: "string" },
            detalle: { type: "string" }
          },
          required: ["titulo", "detalle"] 
        }
      },
      fotos: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            url: { type: "string" },
            pie: { type: "string" }
          },
          required: ["url", "pie"] 
        }
      },
      firmas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            nombre: { type: "string" },
            cargo: { type: "string" },
            firmaImagenUrl: { type: "string" }
          },
          required: ["nombre", "cargo", "firmaImagenUrl"] 
        }
      },
      notasAdicionales: { type: "string" }
    },
    required: [
      "obra",
      "asistentes",
      "estadoObra",
      "cuestionesTratadas",
      "fotos",
      "firmas",
      "notasAdicionales" 
    ]
  },
  strict: true
} as const;
