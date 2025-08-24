"use client";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { ActaObra } from "@/types/acta";

export function ActaForm({
  value,
  onChange,
}: {
  value: ActaObra;
  onChange: (v: ActaObra) => void;
}) {
  const { register, control, reset, getValues } = useForm<ActaObra>({
    defaultValues: value,
  });

  useEffect(() => { reset(value); }, [value, reset]);

  const asistentes = useFieldArray({ control, name: "asistentes", keyName: "id" });
  const cuestiones = useFieldArray({ control, name: "cuestionesTratadas", keyName: "id" });
  const firmas     = useFieldArray({ control, name: "firmas", keyName: "id" });

  const handleSave = () => onChange(getValues());

  return (
    <>
      <form className="form">
        <fieldset>
          <legend>Identificación de la obra</legend>
          <input placeholder="Nombre de la obra" {...register("obra.nombre")} />
          <input placeholder="Ubicación (municipio)" {...register("obra.situacion.ubicacion")} />
          <input placeholder="Calle y portal" {...register("obra.situacion.callePortal")} />
          <div className="row">
            <input placeholder="Provincia" {...register("obra.situacion.provincia")} />
            <input placeholder="C.P." {...register("obra.situacion.cp")} />
          </div>
          <input type="datetime-local" {...register("obra.fechaISO")} />
          <input placeholder="Nº de acta" {...register("obra.numeroActa")} />
        </fieldset>

        <fieldset>
          <legend>Asistentes</legend>
          {asistentes.fields.map((f, i) => (
            <div key={f.id} className="row" style={{ alignItems: "center" }}>
              <input placeholder="Nombre" {...register(`asistentes.${i}.nombre` as const)} />
              <input placeholder="Cargo"  {...register(`asistentes.${i}.cargo`  as const)} />
              <input placeholder="Entidad"{...register(`asistentes.${i}.entidad`as const)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-stop" style={{ padding: "6px 10px" }}
                        onClick={() => asistentes.remove(i)}>
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => asistentes.append({ nombre: "", cargo: "", entidad: "" })}>
            + Añadir asistente
          </button>
        </fieldset>

        <fieldset>
          <legend>Estado de la obra</legend>
          <textarea rows={4} {...register("estadoObra")} />
        </fieldset>

        <fieldset>
          <legend>Cuestiones tratadas</legend>
          {cuestiones.fields.map((f, i) => (
            <div key={f.id}>
              <input placeholder="Título (opcional)" {...register(`cuestionesTratadas.${i}.titulo` as const)} />
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <textarea rows={3} placeholder="Detalle" {...register(`cuestionesTratadas.${i}.detalle` as const)} />
                <button type="button" className="btn btn-stop" style={{ height: 38 }}
                        onClick={() => cuestiones.remove(i)}>
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => cuestiones.append({ titulo: "", detalle: "" })}>
            + Añadir cuestión
          </button>
        </fieldset>

        <fieldset>
          <legend>Firmas</legend>
          {firmas.fields.map((f, i) => (
            <div key={f.id} className="row" style={{ alignItems: "center" }}>
              <input placeholder="Nombre" {...register(`firmas.${i}.nombre` as const)} />
              <input placeholder="Cargo"  {...register(`firmas.${i}.cargo`  as const)} />
              <div>
                <button type="button" className="btn btn-stop" style={{ padding: "6px 10px" }}
                        onClick={() => firmas.remove(i)}>
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={() => firmas.append({ nombre: "", cargo: "" })}>
            + Añadir firmante
          </button>
        </fieldset>

        <fieldset>
          <legend>Notas adicionales</legend>
          <textarea rows={3} {...register("notasAdicionales")} />
        </fieldset>
      </form>

      <button className="btn" type="button" onClick={handleSave}>
        Guardar cambios
      </button>
    </>
  );
}
