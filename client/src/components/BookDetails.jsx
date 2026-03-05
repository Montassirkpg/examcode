import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const base = import.meta.env.VITE_BASE_URL || '/'

const BookDetails = () => {
    const { bookId } = useParams()
    const navigate = useNavigate()
    const [book, setBook] = useState(null)
    const [userRole, setUserRole] = useState('Guest')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetch(`${base}api/books/${bookId}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => setBook(data[0]))
            .catch(error => console.error('Erreur:', error));

        fetch(base+'api/session', {
            credentials: 'include'
        })
            .then(response => {
                if (response.status === 200) return response.json()
                throw new Error('Not authenticated')
            })
            .then(data => setUserRole(data.user.role || 'Guest'))
            .catch(error => setUserRole('Guest'));
    }, [bookId]);

    const handleBorrow = async () => {
        setMessage('')
        setError('')
        try {
            const response = await fetch(`${base}api/emprunts/emprunter/${bookId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Connectez-vous pour emprunter un livre')
                }
                if (response.status === 409) {
                    throw new Error('Ce livre est deja emprunte')
                }
                throw new Error('Impossible d\'emprunter ce livre')
            }

            setBook((prev) => ({ ...prev, statut: 'emprunté' }))
            setMessage('Emprunt confirme. Duree maximale: 30 jours.')
        } catch (err) {
            setError(err.message)
        }
    }

    const handleBack = () => {
        navigate('/books');
    };

    const handleEdit = () => {
        navigate(`/edit_book/${bookId}`);
    };

    const handleDelete = () => {
        console.log('Supprimer le livre:', bookId);
    };

    if (!book) {
        return <p>Livre non trouvé</p>;
    }

    return (
        <div className="container">
            <div className="details">
                <h3>{book.titre}</h3>
                <img className="book-image" src={book.photo_url} alt={book.titre} />
                <p>Auteur : {book.auteur}</p>
                <p>Année de publication : {book.date_publication}</p>
                <p>ISBN : {book.isbn}</p>
                <p>Statut : {book.statut}</p>
                <p>URL de l'image : {book.photo_url}</p>
                {message && <p>{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
            <div className="back-button">
                <button onClick={handleBack}>Retour à la liste des livres</button>
                {book.statut === 'disponible' && userRole !== 'Guest' && (
                    <button onClick={handleBorrow}>Emprunter ce livre</button>
                )}
                {userRole === 'admin' && (
                    <>
                        <button onClick={handleEdit}>Modifier le livre</button>
                        <button onClick={handleDelete}>Supprimer le livre</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookDetails