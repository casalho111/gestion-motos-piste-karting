// components/forms/controle/schema.ts
import { z } from "zod";

export const controleJournalierSchema = z.object({
  date: z.date({
    required_error: "La date est requise",
  }),
  controleur: z.string({
    required_error: "Le nom du contrôleur est requis",
  }).min(2, "Le nom doit comporter au moins 2 caractères"),
  estConforme: z.boolean(),
  freinsAvant: z.boolean().default(true),
  freinsArriere: z.boolean().default(true),
  pneus: z.boolean().default(true),
  suspensions: z.boolean().default(true),
  transmission: z.boolean().default(true),
  niveauxFluides: z.boolean().default(true),
  eclairage: z.boolean().default(true),
  autres: z.string().optional(),
  commentaires: z.string().optional(),
  cycleId: z.string({
    required_error: "La moto est requise",
  }),
}).refine(data => {
  // Si le contrôle n'est pas conforme, un commentaire est requis
  if (!data.estConforme && !data.commentaires) {
    return false;
  }
  return true;
}, {
  message: "Un commentaire est requis pour les contrôles non conformes",
  path: ["commentaires"],
});

export type ControleJournalierFormValues = z.infer<typeof controleJournalierSchema>;

export const defaultControleValues: Partial<ControleJournalierFormValues> = {
  date: new Date(),
  estConforme: true,
  freinsAvant: true,
  freinsArriere: true,
  pneus: true,
  suspensions: true,
  transmission: true,
  niveauxFluides: true,
  eclairage: true,
};