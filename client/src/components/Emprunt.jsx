import React from "react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
const base = import.meta.env.VITE_BASE_URL || '/'

const Emprunt = () => {
    const { livreId } = useParams();
    const [emprunts, setEmprunts] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${base}api/emprunts/livre/${livreId}`, {
            credentials: 'include'
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Erreur API ${response.status}`);
                }
                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('La reponse API n\'est pas du JSON');
                }
                return response.json();
            })
            .then(data => setEmprunts(data))
            .catch(error => setError(error.message))
    }, [livreId, base]);

    const handleEmprunter = (livreId) => {
        setMessage('')
        setError('')
        try {
            fetch(`${base}api/emprunts/emprunter/${livreId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            throw new Error('Connectez-vous pour emprunter un livre');
                        }
                        if (response.status === 409) {
                            throw new Error('Ce livre est deja emprunte');
                        }
                        throw new Error('Erreur lors de l\'emprunt du livre');
                    }
                    return response.json();
                }
                )
                .then(data => {
                    setMessage('Emprunt confirme. Date limite: 30 jours.');
                    return fetch(`${base}api/emprunts/livre/${livreId}`, {
                        credentials: 'include'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    setEmprunts(data);
                })
                .catch(error => {
                    setError(error.message);
                }
                );
        } catch (error) {
            setError(error.message);
        }
    };

    const hasActiveBorrow = emprunts.some((emprunt) => !emprunt.date_retour)

    return (
        <div className="container">
            <h1>Emprunts pour le livre ID: {livreId}</h1>
            {message && <p>{message}</p>}
            {error && <p className="error-message">{error}</p>}
            {!hasActiveBorrow && (
                <button onClick={() => handleEmprunter(livreId)}>Emprunter ce livre</button>
            )}
            {emprunts.length === 0 ? (
                <p>Aucun emprunt trouvé pour ce livre.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Emprunteur</th>
                            <th>Email</th>
                            <th>Date d'emprunt</th>
                            <th>Date de retour prevue</th>
                            <th>Date de retour</th>
                        </tr>
                    </thead>
                    <tbody> 
                        {emprunts.map((emprunt) => (
                            <tr key={emprunt.id}>
                                <td>{`${emprunt.prenom || ''} ${emprunt.nom || ''}`.trim() || `Utilisateur #${emprunt.utilisateur_id}`}</td>
                                <td>{emprunt.email || '-'}</td>
                                <td>{new Date(emprunt.date_emprunt).toLocaleDateString()}</td>
                                <td>{new Date(new Date(emprunt.date_emprunt).setDate(new Date(emprunt.date_emprunt).getDate() + 30)).toLocaleDateString()}</td>
                                <td>{emprunt.date_retour ? new Date(emprunt.date_retour).toLocaleDateString() : 'Non retourné'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Emprunt;
