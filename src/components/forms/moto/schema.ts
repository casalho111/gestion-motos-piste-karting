// components/forms/moto/schema.ts
import { z } from "zod";
import { EtatEntite } from "@prisma/client";

export const motoFormSchema = z.object({
  numSerie: z.string({
    required_error: "Le numéro de série est requis",
  }).min(2, "Le numéro de série doit comporter au moins 2 caractères"),
  modele: z.string({
    required_error: "Le modèle est requis",
  }).min(2, "Le modèle doit comporter au moins 2 caractères"),
  dateAcquisition: z.date({
    required_error: "La date d'acquisition est requise",
  }),
  etat: z.nativeEnum(EtatEntite, {
    required_error: "L'état est requis",
  }),
  notesEtat: z.string().optional(),
  couleur: z.string().optional(),
  kilometrage: z.number({
    invalid_type_error: "Le kilométrage doit être un nombre",
  }).nonnegative("Le kilométrage ne peut pas être négatif").default(0),
  moteurCourantId: z.string().optional(),
});

export type MotoFormValues = z.infer<typeof motoFormSchema>;

export const defaultMotoValues: Partial<MotoFormValues> = {
  dateAcquisition: new Date(),
  etat: EtatEntite.DISPONIBLE,
  kilometrage: 0,
};