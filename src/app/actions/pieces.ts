'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { pieceSchema } from '@/lib/validations';
import { TypePiece } from '@prisma/client';
import { z } from 'zod';

/**
 * Obtenir toutes les pièces avec pagination et filtres
 */
export async function getPieces({
    page = 1,
    limit = 10,
    type,
    stockBas = false,
    search
}: {
    page?: number;
    limit?: number;
    type?: TypePiece;
    stockBas?: boolean;
    search?: string;
}) {
    try {
        // Construire la condition where dynamiquement
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (stockBas) {
            where.quantiteStock = {
                lte: prisma.piece.fields.quantiteMinimale
            };
        }

        if (search) {
            where.OR = [
                { reference: { contains: search, mode: 'insensitive' } },
                { nom: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { fournisseur: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Récupérer les données avec pagination
        const skip = (page - 1) * limit;

        const [pieces, total] = await Promise.all([
            prisma.piece.findMany({
                where,
                skip,
                take: limit,
                orderBy: { nom: 'asc' }
            }),
            prisma.piece.count({ where })
        ]);

        return {
            data: pieces,
            pagination: {
                total,
                pageCount: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit
            }
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des pièces:', error);
        throw new Error('Impossible de récupérer les pièces. Veuillez réessayer.');
    }
}

/**
 * Obtenir une pièce par son ID
 */
export async function getPieceById(id: string) {
    try {
        const piece = await prisma.piece.findUnique({
            where: { id },
            include: {
                utilisations: {
                    take: 10,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        maintenance: {
                            include: {
                                cycle: true,
                                moteur: true
                            }
                        }
                    }
                }
            }
        });

        if (!piece) {
            throw new Error('Pièce non trouvée');
        }

        return piece;
    } catch (error) {
        console.error('Erreur lors de la récupération de la pièce:', error);
        throw new Error('Impossible de récupérer la pièce. Veuillez réessayer.');
    }
}

/**
 * Créer une nouvelle pièce
 */
export async function createPiece(
    data: z.infer<typeof pieceSchema>
) {
    try {
        // Valider les données avec Zod
        const validatedData = pieceSchema.parse(data);

        const newPiece = await prisma.piece.create({
            data: validatedData
        });

        revalidatePath('/dashboard/pieces');
        return { success: true, data: newPiece };
    } catch (error) {
        console.error('Erreur lors de la création de la pièce:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Données invalides',
                validationErrors: error.errors
            };
        }

        return {
            success: false,
            error: 'Impossible de créer la pièce. Veuillez réessayer.'
        };
    }
}

/**
 * Mettre à jour une pièce
 */
export async function updatePiece(
    id: string,
    data: z.infer<typeof pieceSchema>
) {
    try {
        // Valider les données avec Zod
        const validatedData = pieceSchema.parse(data);

        const updatedPiece = await prisma.piece.update({
            where: { id },
            data: validatedData
        });

        revalidatePath(`/dashboard/pieces/${id}`);
        revalidatePath('/dashboard/pieces');

        return { success: true, data: updatedPiece };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la pièce:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Données invalides',
                validationErrors: error.errors
            };
        }

        return {
            success: false,
            error: 'Impossible de mettre à jour la pièce. Veuillez réessayer.'
        };
    }
}

/**
 * Ajuster le stock d'une pièce (entrée ou sortie)
 */
export async function ajusterStock(
    id: string,
    quantite: number,
    notes?: string
) {
    try {
        // Vérifier que la pièce existe
        const piece = await prisma.piece.findUnique({
            where: { id },
            select: { quantiteStock: true }
        });

        if (!piece) {
            return {
                success: false,
                error: 'Pièce non trouvée'
            };
        }

        // Vérifier que le stock ne devient pas négatif
        if (piece.quantiteStock + quantite < 0) {
            return {
                success: false,
                error: 'Stock insuffisant pour cette opération'
            };
        }

        // Mettre à jour le stock
        const updatedPiece = await prisma.piece.update({
            where: { id },
            data: {
                quantiteStock: {
                    increment: quantite
                }
            }
        });

        // Créer une alerte si le stock devient bas
        if (updatedPiece.quantiteStock <= updatedPiece.quantiteMinimale) {
            await prisma.alerte.create({
                data: {
                    titre: `Stock bas: ${updatedPiece.nom}`,
                    message: `Le stock de ${updatedPiece.nom} est bas (${updatedPiece.quantiteStock}/${updatedPiece.quantiteMinimale})`,
                    type: 'STOCK',
                    criticite: updatedPiece.quantiteStock === 0 ? 'CRITIQUE' : 'ELEVEE',
                    pieceId: id
                }
            });
        }

        revalidatePath(`/dashboard/pieces/${id}`);
        revalidatePath('/dashboard/pieces');

        return { success: true, data: updatedPiece };
    } catch (error) {
        console.error('Erreur lors de l\'ajustement du stock:', error);
        return {
            success: false,
            error: 'Impossible d\'ajuster le stock. Veuillez réessayer.'
        };
    }
}

/**
 * Supprimer une pièce
 */
export async function deletePiece(id: string) {
    try {
        // Vérifier si la pièce est utilisée dans des maintenances
        const utilisations = await prisma.pieceUtilisee.count({
            where: { pieceId: id }
        });

        if (utilisations > 0) {
            return {
                success: false,
                error: `Cette pièce est utilisée dans ${utilisations} maintenance(s) et ne peut pas être supprimée.`
            };
        }

        // Supprimer la pièce
        await prisma.piece.delete({
            where: { id }
        });

        revalidatePath('/dashboard/pieces');

        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de la pièce:', error);
        return {
            success: false,
            error: 'Impossible de supprimer la pièce. Veuillez réessayer.'
        };
    }
}