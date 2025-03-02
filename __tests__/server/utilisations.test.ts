import { mockServerAction, mockTransaction } from '../helpers/test-utils';
import { createUtilisation } from '@/app/actions/utilisations';
import { utilisationSchema } from '@/lib/validations';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

describe('Server Actions: Utilisations', () => {
  const mockedCreateUtilisation = mockServerAction(createUtilisation, utilisationSchema as z.ZodType);
  
  test('createUtilisation should create a new utilisation and update kilometrages', async () => {
    // Arrange
    const utilisationData = {
      date: new Date(),
      responsable: 'Jean Dupont',
      nbTours: 25,
      distanceTour: 800,
      type: 'SESSION_NORMALE' as 'SESSION_NORMALE' | 'COURSE' | 'FORMATION' | 'TEST_TECHNIQUE',
      cycleId: 'cycle-id-1'
    };
    
    const distanceTotale = (utilisationData.nbTours * utilisationData.distanceTour) / 1000;
    
    const existingCycle = {
      id: 'cycle-id-1',
      kilometrage: 1000,
      moteurCourantId: 'moteur-id-1'
    };
    
    const expectedUtilisation = {
      id: 'utilisation-id',
      ...utilisationData,
      distanceTotale,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock des requêtes qui seront utilisées dans la transaction
    (prisma.partieCycle.findUnique as jest.Mock).mockResolvedValue(existingCycle);
    (prisma.utilisation.create as jest.Mock).mockResolvedValue(expectedUtilisation);
    (prisma.partieCycle.update as jest.Mock).mockResolvedValue({
      ...existingCycle,
      kilometrage: existingCycle.kilometrage + distanceTotale
    });
    (prisma.moteur.update as jest.Mock).mockResolvedValue({
      id: 'moteur-id-1',
      kilometrage: 500 + distanceTotale
    });
    
    // Mock de la transaction Prisma
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
      return await fn(prisma);
    });
    
    // Act
    const result = await mockedCreateUtilisation.execute(utilisationData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(expectedUtilisation);
    expect(prisma.partieCycle.findUnique).toHaveBeenCalledWith({
      where: { id: 'cycle-id-1' },
      select: expect.any(Object)
    });
    expect(prisma.utilisation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...utilisationData,
        distanceTotale
      })
    });
    expect(prisma.partieCycle.update).toHaveBeenCalledWith({
      where: { id: 'cycle-id-1' },
      data: { kilometrage: existingCycle.kilometrage + distanceTotale }
    });
    expect(prisma.moteur.update).toHaveBeenCalledWith({
      where: { id: 'moteur-id-1' },
      data: expect.objectContaining({
        kilometrage: { increment: distanceTotale }
      })
    });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/utilisations');
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/motos/${utilisationData.cycleId}`);
  });
});