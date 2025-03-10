// components/forms/maintenance/schema.ts
import { z } from "zod";
import { TypeEntretien } from "@prisma/client";

// Schéma pour une pièce utilisée
export const pieceUtiliseeSchema = z.object({
  pieceId: z.string({
    required_error: "Veuillez sélectionner une pièce",
  }),
  nom: z.string().optional(), // Champ informationnel uniquement
  quantite: z.number({
    required_error: "La quantité est requise",
    invalid_type_error: "La quantité doit être un nombre",
  }).int().positive("La quantité doit être positive"),
  prixUnitaire: z.number({
    invalid_type_error: "Le prix doit être un nombre",
  }).nonnegative("Le prix ne peut pas être négatif").optional(),
  reference: z.string().optional(), // Champ informationnel uniquement
  type: z.string().optional(), // Champ informationnel uniquement
});

// Schéma principal du formulaire de maintenance
export const maintenanceFormSchema = z.object({
  type: z.nativeEnum(TypeEntretien, {
    required_error: "Le type d'entretien est requis",
  }),
  dateRealisation: z.date({
    required_error: "La date de réalisation est requise",
  }),
  kilometrageEffectue: z.number({
    required_error: "Le kilométrage est requis",
    invalid_type_error: "Le kilométrage doit être un nombre",
  }).nonnegative("Le kilométrage ne peut pas être négatif"),
  coutTotal: z.number({
    required_error: "Le coût total est requis",
    invalid_type_error: "Le coût total doit être un nombre",
  }).nonnegative("Le coût total ne peut pas être négatif"),
  technicien: z.string({
    required_error: "Le nom du technicien est requis",
  }).min(2, "Le nom doit comporter au moins 2 caractères"),
  description: z.string({
    required_error: "La description est requise",
  }).min(5, "La description doit comporter au moins 5 caractères"),
  notes: z.string().optional(),
  cycleId: z.string().optional(),
  moteurId: z.string().optional(),
  piecesUtilisees: z.array(pieceUtiliseeSchema).optional(),
})
.refine(data => data.cycleId || data.moteurId, {
  message: "Vous devez sélectionner au moins une moto ou un moteur",
  path: ["cycleId"],
});

// Types dérivés du schéma
export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;
export type PieceUtiliseeFormValues = z.infer<typeof pieceUtiliseeSchema>;

// Valeurs par défaut pour initialiser le formulaire
export const defaultMaintenanceValues: Partial<MaintenanceFormValues> = {
  type: TypeEntretien.ENTRETIEN_REGULIER,
  dateRealisation: new Date(),
  kilometrageEffectue: 0,
  coutTotal: 0,
  piecesUtilisees: [],
};