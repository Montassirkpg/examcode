import React, { useEffect, useMemo, useState } from 'react'

const base = import.meta.env.VITE_BASE_URL || '/'

const addThirtyDays = (dateStr) => {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + 30)
    return date
}

const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString()
}

const MesEmprunts = () => {
    const [sessionUser, setSessionUser] = useState(null)
    const [emprunts, setEmprunts] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    const loadData = async () => {
        setLoading(true)
        setError('')

        try {
            const sessionResponse = await fetch(`${base}api/session`, {
                credentials: 'include'
            })

            if (!sessionResponse.ok) {
                throw new Error('Vous devez etre connecte pour voir vos emprunts')
            }

            const sessionData = await sessionResponse.json()
            const user = sessionData.user
            setSessionUser(user)

            const empruntsResponse = await fetch(`${base}api/emprunts/mesemprunts/${user.id}`, {
                credentials: 'include'
            })

            if (!empruntsResponse.ok) {
                throw new Error(`Impossible de charger l'historique (${empruntsResponse.status})`)
            }

            const empruntsData = await empruntsResponse.json()
            setEmprunts(empruntsData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const activeCount = useMemo(() => emprunts.filter((e) => !e.date_retour).length, [emprunts])

    const handleRetour = async (empruntId) => {
        try {
            const response = await fetch(`${base}api/emprunts/retourner/${empruntId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Le retour du livre a echoue')
            }

            await loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="container">
            <h2>Mes emprunts</h2>
            {sessionUser && <p>Compte: {sessionUser.email}</p>}
            <p>Emprunts en cours: {activeCount}</p>

            {loading && <p>Chargement en cours...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && emprunts.length === 0 && (
                <p>Aucun emprunt trouve.</p>
            )}

            {!loading && !error && emprunts.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Livre</th>
                            <th>Date d'emprunt</th>
                            <th>Date de retour prevue</th>
                            <th>Etat</th>
                            <th>Date de retour</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emprunts.map((emprunt) => {
                            const dueDate = emprunt.date_retour_prevue
                                ? new Date(emprunt.date_retour_prevue)
                                : addThirtyDays(emprunt.date_emprunt)
                            const now = new Date()
                            const isReturned = !!emprunt.date_retour
                            const isLate = !isReturned && dueDate < now
                            const nearDeadline = !isReturned && !isLate && (dueDate - now) / (1000 * 60 * 60 * 24) <= 3

                            return (
                                <tr key={emprunt.id}>
                                    <td>{emprunt.titre || `Livre #${emprunt.livre_id}`}</td>
                                    <td>{formatDate(emprunt.date_emprunt)}</td>
                                    <td>{formatDate(dueDate)}</td>
                                    <td>
                                        {isReturned ? 'Retourne' : isLate ? 'En retard - rappel automatique envoye' : nearDeadline ? 'Echeance proche - rappel automatique envoye' : 'En cours'}
                                    </td>
                                    <td>{formatDate(emprunt.date_retour)}</td>
                                    <td>
                                        {isReturned ? (
                                            <span>-</span>
                                        ) : (
                                            <button onClick={() => handleRetour(emprunt.id)}>Signaler le retour</button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default MesEmprunts
