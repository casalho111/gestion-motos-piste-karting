'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TypeUtilisation } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from "sonner"
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, ActivityIcon, CheckCircle } from 'lucide-react'

import { createUtilisation } from '@/app/actions/utilisations'

// Créer un schéma de validation basé sur celui défini dans /lib/validations.ts
const formSchema = z.object({
    date: z.date({
        required_error: "La date est requise",
    }),
    responsable: z.string().min(2, {
        message: "Le nom du responsable doit comporter au moins 2 caractères",
    }),
    nbTours: z.coerce.number().int().positive({
        message: "Le nombre de tours doit être un nombre entier positif",
    }),
    distanceTour: z.coerce.number().positive({
        message: "La distance du tour doit être positive",
    }).default(800),
    type: z.enum([
        TypeUtilisation.SESSION_NORMALE,
        TypeUtilisation.COURSE,
        TypeUtilisation.FORMATION,
        TypeUtilisation.TEST_TECHNIQUE
    ]),
    notes: z.string().optional(),
    cycleId: z.string({
        required_error: "Veuillez sélectionner une moto",
    })
})

// Typer les props du composant
type FormEnregistrementSessionProps = {
    motos: Array<{
        id: string
        numSerie: string
        modele: string
        kilometrage: number
    }>
    motoPreselectionee?: string
    onSuccess?: (data: any) => void
}

export function FormEnregistrementSession({
    motos,
    motoPreselectionee,
    onSuccess
}: FormEnregistrementSessionProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [distanceTotale, setDistanceTotale] = useState(0)

    // Créer un formulaire avec React Hook Form et Zod
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date(),
            responsable: '',
            nbTours: 0,
            distanceTour: 800,
            type: TypeUtilisation.SESSION_NORMALE,
            notes: '',
            cycleId: motoPreselectionee || ''
        },
    })

    // Calculer la distance totale lorsque les tours ou la longueur du circuit changent
    useEffect(() => {
        const nbTours = form.watch('nbTours')
        const distanceTour = form.watch('distanceTour')

        if (nbTours && distanceTour) {
            // Conversion en kilomètres
            setDistanceTotale((nbTours * distanceTour) / 1000)
        } else {
            setDistanceTotale(0)
        }
    }, [form.watch('nbTours'), form.watch('distanceTour')])

    // Gérer la soumission du formulaire
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)

        try {
            const result = await createUtilisation(values)

            if (result.success) {
                toast.success("Session enregistrée", {
                    description: `${values.nbTours} tours enregistrés pour la moto ${motos.find(m => m.id === values.cycleId)?.numSerie
                        }. Distance totale: ${distanceTotale.toFixed(1)} km`,
                })

                // Reset le formulaire
                form.reset({
                    date: new Date(),
                    responsable: values.responsable, // Garder le responsable
                    nbTours: 0,
                    distanceTour: 800,
                    type: TypeUtilisation.SESSION_NORMALE,
                    notes: '',
                    cycleId: values.cycleId // Garder la moto sélectionnée
                })

                // Rafraîchir la page ou appeler le callback
                if (onSuccess) {
                    onSuccess(result.data)
                } else {
                    router.refresh()
                }
            } else {
                toast.error("Erreur", {
                    description: result.error || "Une erreur est survenue lors de l'enregistrement de la session",
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("Erreur", {
                description: "Une erreur inattendue est survenue",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Enregistrer une session
                </CardTitle>
                <CardDescription>
                    Saisissez les détails de la session d&apos;utilisation
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Sélection de la moto */}
                            <FormField
                                control={form.control}
                                name="cycleId"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Moto</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={loading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une moto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {motos.map((moto) => (
                                                    <SelectItem key={moto.id} value={moto.id}>
                                                        {moto.numSerie} ({moto.modele}) - {moto.kilometrage} km
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date de la session */}
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""
                                                            }`}
                                                        disabled={loading}
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
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Responsable */}
                            <FormField
                                control={form.control}
                                name="responsable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsable</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={loading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type de session */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={loading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type de session" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={TypeUtilisation.SESSION_NORMALE}>
                                                    Session normale
                                                </SelectItem>
                                                <SelectItem value={TypeUtilisation.COURSE}>
                                                    Course
                                                </SelectItem>
                                                <SelectItem value={TypeUtilisation.FORMATION}>
                                                    Formation
                                                </SelectItem>
                                                <SelectItem value={TypeUtilisation.TEST_TECHNIQUE}>
                                                    Test technique
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Nombre de tours */}
                            <FormField
                                control={form.control}
                                name="nbTours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de tours</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                min="1"
                                                disabled={loading}
                                                onChange={(e) => {
                                                    const value = e.target.value ? parseInt(e.target.value) : 0
                                                    field.onChange(value)
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Distance du tour */}
                            <FormField
                                control={form.control}
                                name="distanceTour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Distance du tour (m)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                min="1"
                                                disabled={loading}
                                                onChange={(e) => {
                                                    const value = e.target.value ? parseFloat(e.target.value) : 0
                                                    field.onChange(value)
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Affichage de la distance totale */}
                            <div className="col-span-2 bg-muted p-3 rounded-md">
                                <p className="text-sm font-medium">Distance totale calculée:</p>
                                <p className="text-lg font-bold">{distanceTotale.toFixed(1)} km</p>
                                <p className="text-xs text-muted-foreground">
                                    Cette distance sera ajoutée au kilométrage de la moto et du moteur monté.
                                </p>
                            </div>

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Notes (optionnel)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Observations, comportement de la moto, etc."
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Enregistrement...' : 'Enregistrer la session'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}