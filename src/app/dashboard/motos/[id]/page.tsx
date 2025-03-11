'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TabNavigation } from '@/components/layout/TabNavigation'
import MotoDetailView from '@/components/motos/MotoDetailView'
import { Bike, Wrench, Clock, History } from 'lucide-react'

// Page détaillée d'une moto avec navigation par onglets
export default function MotoDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'details'
  
  // Définir la navigation par onglets
  const tabs = [
    {
      id: 'details',
      label: 'Détails',
      icon: <Bike className="h-4 w-4" />
    },
    {
      id: 'entretien',
      label: 'Entretien',
      icon: <Wrench className="h-4 w-4" />
    },
    {
      id: 'utilisation',
      label: 'Utilisation',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: <History className="h-4 w-4" />
    }
  ]
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  // Gérer le changement d'onglet
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }
  
  return (
    <div className="space-y-6">
      <TabNavigation 
        items={tabs}
        defaultTab={defaultTab}
        onChange={handleTabChange}
      />
      
      {/* Nous utilisons déjà un composant MotoDetailView qui gère sa propre navigation par onglets.
          Dans un cas réel, il faudrait synchroniser les deux ou adapter le MotoDetailView pour utiliser TabNavigation.
          Ici, nous affichons directement le MotoDetailView pour l'exemple. */}
      <MotoDetailView motoId={params.id} />
    </div>
  )
}