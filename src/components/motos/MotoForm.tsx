'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { EtatEntite } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// Import des Server Actions
import { createMoto, updateMoto } from '@/app/actions/motos'

// Définition du schéma de validation avec Zod
const formSchema = z.object({
  numSerie: z.string().min(1, "Le numéro de série est requis"),
  modele: z.string().min(1, "Le modèle est requis"),
  dateAcquisition: z.date({
    required_error: "La date d'acquisition est requise",
  }),
  etat: z.nativeEnum(EtatEntite),
  notesEtat: z.string().optional(),
  couleur: z.string().optional(),
  moteurCourantId: z.string().optional().nullable(),
})

interface MotoFormProps {
  initialData?: z.infer<typeof formSchema> & { id?: string }
}

export function MotoForm({ initialData }: MotoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData?.id
  
  // Initialisation du formulaire
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numSerie: initialData?.numSerie || '',
      modele: initialData?.modele || '',
      dateAcquisition: initialData?.dateAcquisition || new Date(),
      etat: initialData?.etat || EtatEntite.DISPONIBLE,
      notesEtat: initialData?.notesEtat || '',
      couleur: initialData?.couleur || '',
      moteurCourantId: initialData?.moteurCourantId || null,
    },
  })
  
  // Soumission du formulaire
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    try {
      // Appeler la Server Action appropriée
      const action = isEditing 
        ? () => {
            // Convertit null en undefined pour être compatible avec l'API
            const formattedValues = {
              ...values,
              moteurCourantId: values.moteurCourantId || undefined
            }
            return updateMoto(initialData!.id!, formattedValues)
          }
        : () => {
            // Convertit null en undefined pour être compatible avec l'API
            const formattedValues = {
              ...values,
              moteurCourantId: values.moteurCourantId || undefined
            }
            return createMoto(formattedValues)
          }
      
      const result = await action()
      
      if (result.success) {
        toast.success(
          isEditing ? "Moto mise à jour avec succès" : "Moto créée avec succès"
        )
        router.push('/dashboard/motos')
        router.refresh()
      } else {
        toast.error(result.error || "Une erreur est survenue")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Numéro de série */}
          <FormField
            control={form.control}
            name="numSerie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de série</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Modèle */}
          <FormField
            control={form.control}
            name="modele"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="YZF-R 125">YZF-R 125</SelectItem>
                    <SelectItem value="MT 125">MT 125</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date d'acquisition */}
          <FormField
            control={form.control}
            name="dateAcquisition"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d'acquisition</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""
                          }`}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* État */}
          <FormField
            control={form.control}
            name="etat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>État</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EtatEntite).map(etat => (
                      <SelectItem key={etat} value={etat}>
                        {etat === 'DISPONIBLE' && 'Disponible'}
                        {etat === 'EN_MAINTENANCE' && 'En maintenance'}
                        {etat === 'A_VERIFIER' && 'À vérifier'}
                        {etat === 'HORS_SERVICE' && 'Hors service'}
                        {etat === 'INDISPONIBLE' && 'Indisponible'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Notes sur l'état */}
          <FormField
            control={form.control}
            name="notesEtat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes sur l'état</FormLabel>
                <FormControl>
                  <Textarea {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  Notes supplémentaires concernant l'état de la moto
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Couleur */}
          <FormField
            control={form.control}
            name="couleur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Couleur</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Chargement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}