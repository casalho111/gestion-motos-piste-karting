// components/forms/utilisation/schema.ts
import { z } from "zod";
import { TypeUtilisation } from "@prisma/client";

export const utilisationFormSchema = z.object({
  date: z.date({
    required_error: "La date est requise",
  }),
  responsable: z.string({
    required_error: "Le nom du responsable est requis",
  }).min(2, "Le nom doit comporter au moins 2 caractères"),
  nbTours: z.number({
    required_error: "Le nombre de tours est requis",
    invalid_type_error: "Le nombre de tours doit être un nombre",
  }).int().positive("Le nombre de tours doit être positif"),
  distanceTour: z.number({
    invalid_type_error: "La distance du tour doit être un nombre",
  }).positive("La distance du tour doit être positive").default(800),
  type: z.nativeEnum(TypeUtilisation, {
    required_error: "Le type d'utilisation est requis",
  }).default(TypeUtilisation.SESSION_NORMALE),
  notes: z.string().optional(),
  cycleId: z.string({
    required_error: "La moto est requise",
  }),
});

export type UtilisationFormValues = z.infer<typeof utilisationFormSchema>;

export const defaultUtilisationValues: Partial<UtilisationFormValues> = {
  date: new Date(),
  nbTours: 1,
  distanceTour: 800, // 800 mètres par défaut
  type: TypeUtilisation.SESSION_NORMALE,
};