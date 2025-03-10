import { z } from "zod";
import { EtatEntite } from "@prisma/client";

export const moteurFormSchema = z.object({
  numSerie: z.string({
    required_error: "Le numéro de série est requis",
  }).min(2, "Le numéro de série doit comporter au moins 2 caractères"),
  type: z.string({
    required_error: "Le type est requis",
  }).min(2, "Le type doit comporter au moins 2 caractères"),
  cylindree: z.number({
    invalid_type_error: "La cylindrée doit être un nombre",
  }).int().positive("La cylindrée doit être positive").default(125),
  dateAcquisition: z.date({
    required_error: "La date d'acquisition est requise",
  }),
  kilometrage: z.number({
    invalid_type_error: "Le kilométrage doit être un nombre",
  }).nonnegative("Le kilométrage ne peut pas être négatif").default(0),
  heuresMoteur: z.number({
    invalid_type_error: "Les heures moteur doivent être un nombre",
  }).nonnegative("Les heures moteur ne peuvent pas être négatives").optional(),
  etat: z.nativeEnum(EtatEntite, {
    required_error: "L'état est requis",
  }),
  notesEtat: z.string().optional(),
});

export type MoteurFormValues = z.infer<typeof moteurFormSchema>;

export const defaultMoteurValues: Partial<MoteurFormValues> = {
  dateAcquisition: new Date(),
  etat: EtatEntite.DISPONIBLE,
  kilometrage: 0,
  cylindree: 125,
};