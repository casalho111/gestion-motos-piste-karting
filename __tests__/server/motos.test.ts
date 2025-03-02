import { mockServerAction, createMockContext } from '../helpers/test-utils';
import { createMoto } from '@/app/actions/motos';
import { partieCycleSchema } from '@/lib/validations';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { EtatEntite } from '@prisma/client';

describe('Server Actions: Motos', () => {
  const mockedCreateMoto = mockServerAction(createMoto, partieCycleSchema);
  
  test('createMoto should create a new moto with valid data', async () => {
    // Arrange
    const motoData = {
      numSerie: 'YZ123',
      modele: 'YZF-R 125',
      dateAcquisition: new Date(),
      etat: EtatEntite.DISPONIBLE
    };
    
    const expectedMoto = {
      id: 'moto-id',
      ...motoData,
      kilometrage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    (prisma.partieCycle.create as jest.Mock).mockResolvedValue(expectedMoto);
    
    // Act
    const result = await mockedCreateMoto.execute(motoData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(expectedMoto);
    expect(prisma.partieCycle.create).toHaveBeenCalledWith({
      data: expect.objectContaining(motoData)
    });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/motos');
  });
  
  test('createMoto should fail with invalid data', async () => {
    // Arrange
    const invalidData = {
      // Manque numSerie qui est requis
      modele: 'YZF-R 125',
      dateAcquisition: new Date()
    };
    
    // Act
    const result = await mockedCreateMoto.execute(invalidData as any);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Données invalides');
    expect(result.validationErrors).toBeDefined();
    expect(prisma.partieCycle.create).not.toHaveBeenCalled();
  });
  
  test('createMoto should handle database errors', async () => {
    // Arrange
    const motoData = {
      numSerie: 'YZ123',
      modele: 'YZF-R 125',
      dateAcquisition: new Date(),
      etat: EtatEntite.DISPONIBLE
    };
    
    (prisma.partieCycle.create as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    // Act
    const result = await mockedCreateMoto.execute(motoData);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});